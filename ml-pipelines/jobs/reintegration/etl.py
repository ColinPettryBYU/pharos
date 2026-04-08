"""
Reintegration Readiness ETL — Reads residents + six related tables from the
live DB and engineers per-resident features for the readiness model.
"""
import numpy as np
import pandas as pd
import joblib

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import read_table


def run():
    print('[ETL] Loading tables from database …')
    residents = read_table('residents')
    recordings = read_table('process_recordings')
    education = read_table('education_records')
    health = read_table('health_wellbeing_records')
    interventions = read_table('intervention_plans')
    visitations = read_table('home_visitations')
    incidents = read_table('incident_reports')

    residents['date_of_admission'] = pd.to_datetime(residents['date_of_admission'])
    residents['date_of_birth'] = pd.to_datetime(residents['date_of_birth'])
    recordings['session_date'] = pd.to_datetime(recordings['session_date'])
    education['record_date'] = pd.to_datetime(education['record_date'])
    health['record_date'] = pd.to_datetime(health['record_date'])
    interventions['created_at'] = pd.to_datetime(interventions['created_at'])
    interventions['target_date'] = pd.to_datetime(interventions['target_date'])
    visitations['visit_date'] = pd.to_datetime(visitations['visit_date'])
    incidents['incident_date'] = pd.to_datetime(incidents['incident_date'])

    res = residents[residents['reintegration_status'].isin(
        ['Completed', 'Not Started', 'On Hold', 'In Progress'])].copy()

    # ── Base resident features ──
    risk_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
    sub_cats = [c for c in res.columns if c.startswith('sub_cat_')]

    base_features = pd.DataFrame({
        'resident_id': res['resident_id'],
        'initial_risk': res['initial_risk_level'].map(risk_map).fillna(0),
        'current_risk': res['current_risk_level'].map(risk_map).fillna(0),
        'risk_improvement': (res['initial_risk_level'].map(risk_map).fillna(0)
                             - res['current_risk_level'].map(risk_map).fillna(0)),
        'tenure_days': (pd.Timestamp.now() - res['date_of_admission']).dt.days,
        'is_pwd': res['is_pwd'].astype(int),
        'has_special_needs': res['has_special_needs'].astype(int),
        'num_subcategories': res[sub_cats].sum(axis=1),
    })

    # ── Process recording features ──
    positive_emotions = ['Calm', 'Hopeful', 'Happy']

    rec_agg = recordings.groupby('resident_id').agg(
        total_sessions=('recording_id', 'count'),
        avg_session_duration=('session_duration_minutes', 'mean'),
        pct_progress_noted=('progress_noted', 'mean'),
        pct_concerns_flagged=('concerns_flagged', 'mean'),
        referrals_made=('referral_made', 'sum'),
    ).reset_index()

    emotional_feats = recordings.groupby('resident_id').apply(
        lambda g: pd.Series({
            'pct_positive_end': g['emotional_state_end'].isin(positive_emotions).mean(),
        })
    ).reset_index()

    def session_frequency(g):
        if len(g) > 1:
            gaps = g['session_date'].sort_values().diff().dt.days.dropna()
            return pd.Series({
                'session_freq_days': gaps.mean(),
                'last_session_recency': (pd.Timestamp.now() - g['session_date'].max()).days,
            })
        return pd.Series({'session_freq_days': np.nan, 'last_session_recency': 9999})

    freq_feats = recordings.groupby('resident_id').apply(session_frequency).reset_index()

    rec_features = rec_agg.merge(emotional_feats, on='resident_id', how='outer')
    rec_features = rec_features.merge(freq_feats, on='resident_id', how='outer')

    # ── Education features ──
    edu_agg = education.groupby('resident_id').agg(
        edu_records_count=('education_record_id', 'count'),
        avg_attendance=('attendance_rate', 'mean'),
        avg_progress=('progress_percent', 'mean'),
        completed_count=('completion_status', lambda x: (x == 'Completed').sum()),
    ).reset_index()

    def edu_trend(g):
        if len(g) > 1:
            g_sorted = g.sort_values('record_date')
            x = np.arange(len(g_sorted))
            y = g_sorted['progress_percent'].fillna(0).values.astype(float)
            slope = np.polyfit(x, y, 1)[0]
            return pd.Series({
                'edu_progress_trend': slope,
                'latest_progress': y[-1],
                'latest_attendance': g_sorted['attendance_rate'].iloc[-1],
            })
        return pd.Series({'edu_progress_trend': 0, 'latest_progress': 0, 'latest_attendance': 0})

    edu_trends = education.groupby('resident_id').apply(edu_trend).reset_index()
    edu_features = edu_agg.merge(edu_trends, on='resident_id', how='outer')

    # ── Health features ──
    health_agg = health.groupby('resident_id').agg(
        health_records_count=('health_record_id', 'count'),
        avg_health_score=('general_health_score', 'mean'),
        avg_nutrition=('nutrition_score', 'mean'),
        avg_sleep=('sleep_quality_score', 'mean'),
        avg_energy=('energy_level_score', 'mean'),
        pct_medical_done=('medical_checkup_done', 'mean'),
        pct_dental_done=('dental_checkup_done', 'mean'),
        pct_psych_done=('psychological_checkup_done', 'mean'),
    ).reset_index()

    def health_trend(g):
        if len(g) > 1:
            g_sorted = g.sort_values('record_date')
            x = np.arange(len(g_sorted))
            y = g_sorted['general_health_score'].fillna(0).values.astype(float)
            slope = np.polyfit(x, y, 1)[0]
            return pd.Series({'health_trend': slope, 'latest_health_score': y[-1]})
        return pd.Series({'health_trend': 0, 'latest_health_score': 0})

    health_trends = health.groupby('resident_id').apply(health_trend).reset_index()
    health_features = health_agg.merge(health_trends, on='resident_id', how='outer')

    # ── Visitation features ──
    coop_map = {'Highly Cooperative': 4, 'Cooperative': 3, 'Neutral': 2, 'Uncooperative': 1}
    visitations['coop_num'] = visitations['family_cooperation_level'].map(coop_map)

    visit_features = visitations.groupby('resident_id').agg(
        total_visits=('visitation_id', 'count'),
        pct_favorable=('visit_outcome', lambda x: (x == 'Favorable').mean()),
        avg_cooperation=('coop_num', 'mean'),
        safety_concerns_ever=('safety_concerns_noted', lambda x: (x.notna() & (x != '')).any().astype(int)),
    ).reset_index()

    def coop_trend(g):
        if len(g) > 1:
            g_sorted = g.sort_values('visit_date')
            vals = g_sorted['coop_num'].dropna()
            if len(vals) > 1:
                x = np.arange(len(vals))
                slope = np.polyfit(x, vals.values.astype(float), 1)[0]
                return pd.Series({'cooperation_trend': slope, 'latest_cooperation': vals.iloc[-1]})
        return pd.Series({'cooperation_trend': 0, 'latest_cooperation': 2})

    coop_trends = visitations.groupby('resident_id').apply(coop_trend).reset_index()
    visit_features = visit_features.merge(coop_trends, on='resident_id', how='outer')

    # ── Intervention features ──
    int_features = interventions.groupby('resident_id').agg(
        total_plans=('plan_id', 'count'),
        pct_achieved=('status', lambda x: (x == 'Achieved').mean()),
        pct_in_progress=('status', lambda x: (x == 'In Progress').mean()),
        categories_covered=('plan_category', 'nunique'),
    ).reset_index()

    for cat in ['Safety', 'Psychosocial', 'Education', 'Physical Health', 'Legal', 'Reintegration']:
        col_name = f'has_{cat.lower().replace(" ", "_")}_plan'
        cat_data = interventions.groupby('resident_id')['plan_category'].apply(
            lambda x: int(cat in x.values)).reset_index()
        cat_data.columns = ['resident_id', col_name]
        int_features = int_features.merge(cat_data, on='resident_id', how='outer')

    # ── Incident features ──
    severity_map = {'Low': 1, 'Medium': 2, 'High': 3}
    incidents['severity_num'] = incidents['severity'].map(severity_map)

    inc_features = incidents.groupby('resident_id').agg(
        total_incidents=('incident_id', 'count'),
        avg_severity=('severity_num', 'mean'),
        max_severity=('severity_num', 'max'),
        pct_resolved=('resolved', 'mean'),
    ).reset_index()

    latest_date = incidents['incident_date'].max()
    recent_90 = incidents[incidents['incident_date'] > (latest_date - pd.Timedelta(days=90))]
    recent_counts = recent_90.groupby('resident_id')['incident_id'].count().reset_index()
    recent_counts.columns = ['resident_id', 'recent_incidents_90d']
    inc_features = inc_features.merge(recent_counts, on='resident_id', how='left')
    inc_features['recent_incidents_90d'] = inc_features['recent_incidents_90d'].fillna(0)

    # ── Merge all ──
    df = base_features.copy()
    for feat_df in [rec_features, edu_features, health_features, visit_features, int_features, inc_features]:
        df = df.merge(feat_df, on='resident_id', how='left')

    df = df.fillna(0)

    target_data = res[['resident_id', 'reintegration_status']].copy()
    df = df.merge(target_data, on='resident_id', how='inner')
    df['ready'] = (df['reintegration_status'] == 'Completed').astype(int)

    out_path = ARTIFACTS_DIR / 'reintegration_etl.pkl'
    joblib.dump(df, out_path)
    print(f'[ETL] Saved modelling DataFrame ({df.shape}) → {out_path}')
    return df


if __name__ == '__main__':
    run()
