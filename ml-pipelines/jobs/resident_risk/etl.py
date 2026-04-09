"""
Resident Risk ETL — Reads residents + five related tables from the live DB
and builds a resident-month panel with engineered features for the elevated-
risk predictor.
"""
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime, timezone

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import read_table


RISK_MAP = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4}
SEVERITY_MAP = {'Low': 1, 'Medium': 2, 'High': 3}
COOP_MAP = {'Highly Cooperative': 4, 'Cooperative': 3, 'Neutral': 2, 'Uncooperative': 1}
EMOTION_SCORE = {
    'Calm': 1, 'Happy': 1,
    'Anxious': 2, 'Sad': 2,
    'Angry': 3, 'Withdrawn': 3,
    'Distressed': 4,
    'Hopeful': 1,
}

_BOOL_MAP = {True: 1, False: 0, 'True': 1, 'False': 0,
             't': 1, 'f': 0, 'true': 1, 'false': 0}


def _to_bool_int(series):
    return series.map(_BOOL_MAP).fillna(0).astype(int)


def _parse_dt(series):
    return pd.to_datetime(series, utc=True).dt.tz_localize(None)


def _to_num(series):
    return pd.to_numeric(series, errors='coerce')


def run():
    print('[ETL] Loading tables from database …')
    residents = read_table('residents')
    recordings = read_table('process_recordings')
    health = read_table('health_wellbeing_records')
    education = read_table('education_records')
    incidents = read_table('incident_reports')
    visitations = read_table('home_visitations')

    # ── Date parsing ──
    residents['date_of_admission'] = _parse_dt(residents['date_of_admission'])
    recordings['session_date'] = _parse_dt(recordings['session_date'])
    health['record_date'] = _parse_dt(health['record_date'])
    education['record_date'] = _parse_dt(education['record_date'])
    incidents['incident_date'] = _parse_dt(incidents['incident_date'])
    visitations['visit_date'] = _parse_dt(visitations['visit_date'])

    # ── Numeric coercion ──
    for col in ['general_health_score', 'nutrition_score', 'sleep_quality_score',
                'energy_level_score', 'height_cm', 'weight_kg', 'bmi']:
        if col in health.columns:
            health[col] = _to_num(health[col])

    for col in ['progress_percent', 'attendance_rate']:
        if col in education.columns:
            education[col] = _to_num(education[col])

    if 'session_duration_minutes' in recordings.columns:
        recordings['session_duration_minutes'] = _to_num(recordings['session_duration_minutes'])

    for df in [residents, recordings, education, health, incidents, visitations]:
        if 'resident_id' in df.columns:
            df['resident_id'] = _to_num(df['resident_id'])

    # ── Boolean coercion ──
    for col in ['progress_noted', 'concerns_flagged', 'referral_made']:
        if col in recordings.columns:
            recordings[col] = _to_bool_int(recordings[col])

    sub_cats = [c for c in residents.columns if c.startswith('sub_cat_')]
    bool_cols_residents = ['is_pwd', 'has_special_needs'] + sub_cats
    for col in bool_cols_residents:
        if col in residents.columns:
            residents[col] = _to_bool_int(residents[col])

    for col in ['medical_checkup_done', 'dental_checkup_done', 'psychological_checkup_done']:
        if col in health.columns:
            health[col] = _to_bool_int(health[col])

    if 'follow_up_needed' in visitations.columns:
        visitations['follow_up_needed'] = _to_bool_int(visitations['follow_up_needed'])

    if 'resolved' in incidents.columns:
        incidents['resolved'] = _to_bool_int(incidents['resolved'])

    # ── Month-period columns ──
    recordings['ym'] = recordings['session_date'].dt.to_period('M')
    health['ym'] = health['record_date'].dt.to_period('M')
    education['ym'] = education['record_date'].dt.to_period('M')
    incidents['ym'] = incidents['incident_date'].dt.to_period('M')
    visitations['ym'] = visitations['visit_date'].dt.to_period('M')

    # ── Build spine: (resident_id, ym) for every month a resident was in care ──
    all_periods = set()
    for df_sub in [recordings, health, education, incidents, visitations]:
        all_periods.update(df_sub['ym'].dropna().unique())

    if not all_periods:
        print('[ETL] No period data found — aborting.')
        return pd.DataFrame()

    period_range = pd.period_range(min(all_periods), max(all_periods), freq='M')
    resident_ids = residents['resident_id'].dropna().unique()
    spine = pd.MultiIndex.from_product([resident_ids, period_range],
                                       names=['resident_id', 'ym'])
    panel = pd.DataFrame(index=spine).reset_index()
    print(f'[ETL] Spine: {len(panel)} rows  ({len(resident_ids)} residents × {len(period_range)} months)')

    # ── 1. Resident baseline features ──
    residents['risk_level_numeric'] = residents['current_risk_level'].map(RISK_MAP).fillna(0)
    residents['initial_risk_numeric'] = residents['initial_risk_level'].map(RISK_MAP).fillna(0)
    residents['n_trauma_flags'] = residents[sub_cats].sum(axis=1) if sub_cats else 0

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    residents['months_in_care'] = ((now - residents['date_of_admission']).dt.days / 30.44).round(1)

    base = residents[['resident_id', 'risk_level_numeric', 'initial_risk_numeric',
                       'n_trauma_flags', 'has_special_needs', 'is_pwd',
                       'months_in_care', 'case_category']].copy()
    base['has_special_needs'] = base['has_special_needs'].fillna(0).astype(int)
    base['is_pwd'] = base['is_pwd'].fillna(0).astype(int)

    panel = panel.merge(base, on='resident_id', how='left')

    # ── 2. Process-recording features (per resident-month) ──
    recordings['emotion_start_score'] = recordings['emotional_state_observed'].map(EMOTION_SCORE)
    recordings['emotion_end_score'] = recordings['emotional_state_end'].map(EMOTION_SCORE)
    recordings['emotional_improvement'] = recordings['emotion_start_score'] - recordings['emotion_end_score']
    recordings['is_distressed'] = (recordings['emotional_state_observed'] == 'Distressed').astype(int)

    rec_monthly = recordings.groupby(['resident_id', 'ym']).agg(
        n_sessions_t=('recording_id', 'count'),
        pct_concerns_flagged_t=('concerns_flagged', 'mean'),
        pct_referral_made_t=('referral_made', 'mean'),
        emotional_start_score_mean=('emotion_start_score', 'mean'),
        emotional_improvement_mean=('emotional_improvement', 'mean'),
        n_distressed_sessions_t=('is_distressed', 'sum'),
    ).reset_index()

    panel = panel.merge(rec_monthly, on=['resident_id', 'ym'], how='left')

    # ── 3. Health features (per resident-month) ──
    health_monthly = health.groupby(['resident_id', 'ym']).agg(
        health_score_t=('general_health_score', 'mean'),
        bmi_t=('bmi', 'mean'),
        psychological_checkup_done_t=('psychological_checkup_done', 'max'),
        nutrition_score_t=('nutrition_score', 'mean'),
    ).reset_index()

    panel = panel.merge(health_monthly, on=['resident_id', 'ym'], how='left')

    # Health trend: delta from prior month
    panel = panel.sort_values(['resident_id', 'ym'])
    panel['health_trend'] = panel.groupby('resident_id')['health_score_t'].diff()

    # ── 4. Education features (per resident-month) ──
    edu_monthly = education.groupby(['resident_id', 'ym']).agg(
        attendance_rate_t=('attendance_rate', 'mean'),
        progress_percent_t=('progress_percent', 'mean'),
    ).reset_index()

    panel = panel.merge(edu_monthly, on=['resident_id', 'ym'], how='left')

    # ── 5. Prior incidents (3-month rolling window) ──
    incidents['severity_num'] = incidents['severity'].map(SEVERITY_MAP).fillna(1)
    incidents['is_high_severity'] = (incidents['severity_num'] == 3).astype(int)
    incidents['is_selfharm'] = (incidents['incident_type'] == 'SelfHarm').astype(int)

    inc_monthly = incidents.groupby(['resident_id', 'ym']).agg(
        n_incidents_m=('incident_id', 'count'),
        n_high_severity_m=('is_high_severity', 'sum'),
        selfharm_flag_m=('is_selfharm', 'max'),
    ).reset_index()

    panel = panel.merge(inc_monthly, on=['resident_id', 'ym'], how='left')
    for col in ['n_incidents_m', 'n_high_severity_m', 'selfharm_flag_m']:
        panel[col] = panel[col].fillna(0)

    panel = panel.sort_values(['resident_id', 'ym'])
    for col_src, col_dst in [('n_incidents_m', 'n_incidents_prior_3m'),
                              ('n_high_severity_m', 'n_high_severity_prior_3m'),
                              ('selfharm_flag_m', 'selfharm_flag_prior')]:
        rolled = (panel.groupby('resident_id')[col_src]
                  .rolling(3, min_periods=1).sum()
                  .reset_index(level=0, drop=True))
        panel[col_dst] = rolled.values

    # The rolling sum includes the current month — subtract current to get prior only
    panel['n_incidents_prior_3m'] = (panel['n_incidents_prior_3m'] - panel['n_incidents_m']).clip(lower=0)
    panel['n_high_severity_prior_3m'] = (panel['n_high_severity_prior_3m'] - panel['n_high_severity_m']).clip(lower=0)
    panel['selfharm_flag_prior'] = (panel['selfharm_flag_prior'] - panel['selfharm_flag_m']).clip(0, 1)

    # ── 6. Visitation features (per resident-month) ──
    visitations['coop_score'] = visitations['family_cooperation_level'].map(COOP_MAP)
    visitations['is_unfavorable'] = (visitations['visit_outcome'] == 'Unfavorable').astype(int)

    safety_col = 'safety_concerns_noted'
    if safety_col in visitations.columns:
        visitations['safety_flag'] = _to_bool_int(visitations[safety_col])
    else:
        visitations['safety_flag'] = 0

    vis_monthly = visitations.groupby(['resident_id', 'ym']).agg(
        pct_unfavorable_visits_t=('is_unfavorable', 'mean'),
        safety_concerns_noted_t=('safety_flag', 'max'),
        cooperation_score_mean=('coop_score', 'mean'),
    ).reset_index()

    panel = panel.merge(vis_monthly, on=['resident_id', 'ym'], how='left')

    # ── 7. Construct target: elevated_risk in T+1 ──
    # Elevated risk = next month has high-severity incident OR SelfHarm incident
    # OR risk level escalation
    next_month_incidents = inc_monthly.copy()
    next_month_incidents['ym'] = next_month_incidents['ym'] - 1  # shift back so T aligns with T+1 event
    next_month_incidents = next_month_incidents.rename(columns={
        'n_high_severity_m': 'next_high_severity',
        'selfharm_flag_m': 'next_selfharm',
        'n_incidents_m': 'next_incidents',
    })

    panel = panel.merge(
        next_month_incidents[['resident_id', 'ym', 'next_high_severity', 'next_selfharm']],
        on=['resident_id', 'ym'], how='left',
    )
    panel['next_high_severity'] = panel['next_high_severity'].fillna(0)
    panel['next_selfharm'] = panel['next_selfharm'].fillna(0)

    panel['elevated_risk'] = (
        (panel['next_high_severity'] > 0) | (panel['next_selfharm'] > 0)
    ).astype(int)

    # ── Drop helper columns ──
    panel.drop(columns=['n_incidents_m', 'n_high_severity_m', 'selfharm_flag_m',
                         'next_high_severity', 'next_selfharm'], inplace=True)

    # ── Fill remaining NaN in feature columns with 0 ──
    feature_cols = [c for c in panel.columns if c not in ('resident_id', 'ym', 'elevated_risk')]
    panel[feature_cols] = panel[feature_cols].fillna(0)

    # ── Drop rows where target is undefined (last month in data has no T+1) ──
    last_ym = panel['ym'].max()
    panel_train = panel[panel['ym'] < last_ym].copy()

    out_path = ARTIFACTS_DIR / 'resident_risk_etl.pkl'
    joblib.dump(panel, out_path)
    print(f'[ETL] Full panel: {panel.shape}  |  Training rows (excl last month): {panel_train.shape[0]}')
    print(f'[ETL] Positive rate (elevated_risk): {panel_train["elevated_risk"].mean():.3f}')
    print(f'[ETL] Saved → {out_path}')
    return panel


if __name__ == '__main__':
    run()
