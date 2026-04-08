"""
Intervention Effectiveness ETL — Builds a resident-month panel dataset
from intervention_plans, process_recordings, health_wellbeing_records,
education_records, incident_reports, and residents.
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
    incidents = read_table('incident_reports')

    residents['date_of_admission'] = pd.to_datetime(residents['date_of_admission'])
    recordings['session_date'] = pd.to_datetime(recordings['session_date'])
    education['record_date'] = pd.to_datetime(education['record_date'])
    health['record_date'] = pd.to_datetime(health['record_date'])
    interventions['created_at'] = pd.to_datetime(interventions['created_at'])
    interventions['target_date'] = pd.to_datetime(interventions['target_date'])
    incidents['incident_date'] = pd.to_datetime(incidents['incident_date'])

    # ── Step 1: Build month-level outcome measures ──
    health['month'] = health['record_date'].dt.to_period('M').dt.to_timestamp()
    edu_monthly = education.copy()
    edu_monthly['month'] = edu_monthly['record_date'].dt.to_period('M').dt.to_timestamp()

    positive_emotions = ['Calm', 'Hopeful', 'Happy']
    recordings['is_positive_end'] = recordings['emotional_state_end'].isin(positive_emotions).astype(int)
    recordings['month'] = recordings['session_date'].dt.to_period('M').dt.to_timestamp()

    incidents['month'] = incidents['incident_date'].dt.to_period('M').dt.to_timestamp()

    health_monthly = health.groupby(['resident_id', 'month']).agg(
        health_score=('general_health_score', 'mean'),
        nutrition_score=('nutrition_score', 'mean'),
        sleep_score=('sleep_quality_score', 'mean'),
        energy_score=('energy_level_score', 'mean'),
    ).reset_index()

    edu_monthly_agg = edu_monthly.groupby(['resident_id', 'month']).agg(
        edu_progress=('progress_percent', 'mean'),
    ).reset_index()

    rec_monthly = recordings.groupby(['resident_id', 'month']).agg(
        session_count=('recording_id', 'count'),
        pct_positive_end=('is_positive_end', 'mean'),
    ).reset_index()

    inc_monthly = incidents.groupby(['resident_id', 'month']).agg(
        incident_count=('incident_id', 'count'),
    ).reset_index()

    panel = health_monthly.merge(edu_monthly_agg, on=['resident_id', 'month'], how='outer')
    panel = panel.merge(rec_monthly, on=['resident_id', 'month'], how='outer')
    panel = panel.merge(inc_monthly, on=['resident_id', 'month'], how='outer')
    panel = panel.sort_values(['resident_id', 'month']).reset_index(drop=True)

    for col in ['health_score', 'nutrition_score', 'sleep_score', 'energy_score',
                'edu_progress', 'session_count', 'pct_positive_end', 'incident_count']:
        panel[col] = panel[col].fillna(0)

    # ── Step 2: Intervention features per resident-month ──
    interventions['month_created'] = interventions['created_at'].dt.to_period('M').dt.to_timestamp()

    categories = ['Safety', 'Psychosocial', 'Education', 'Physical Health', 'Legal', 'Reintegration']

    def get_active_interventions(row):
        rid, month = row['resident_id'], row['month']
        month_end = month + pd.offsets.MonthEnd(0)
        active = interventions[
            (interventions['resident_id'] == rid) &
            (interventions['created_at'] <= month_end) &
            ((interventions['target_date'] >= month) |
             (interventions['status'].isin(['Open', 'In Progress'])))
        ]
        result = {}
        for cat in categories:
            col = f'has_{cat.lower().replace(" ", "_")}'
            result[col] = int((active['plan_category'] == cat).any())
        result['total_active_plans'] = len(active)
        result['categories_active'] = active['plan_category'].nunique()
        return pd.Series(result)

    print('[ETL] Computing intervention features per resident-month …')
    int_features = panel[['resident_id', 'month']].apply(get_active_interventions, axis=1)
    panel = pd.concat([panel, int_features], axis=1)

    # ── Step 3: Compute deltas ──
    delta_cols = ['health_score', 'nutrition_score', 'sleep_score', 'energy_score',
                  'edu_progress', 'pct_positive_end']
    for col in delta_cols:
        panel[f'delta_{col}'] = panel.groupby('resident_id')[col].diff()

    panel['months_since_start'] = panel.groupby('resident_id').cumcount()

    panel_clean = panel.dropna(subset=[f'delta_{delta_cols[0]}']).copy()

    for col in delta_cols:
        panel_clean[f'delta_{col}'] = panel_clean[f'delta_{col}'].fillna(0)

    out_path = ARTIFACTS_DIR / 'intervention_etl.pkl'
    joblib.dump(panel_clean, out_path)
    print(f'[ETL] Saved panel DataFrame ({panel_clean.shape}) → {out_path}')
    return panel_clean


if __name__ == '__main__':
    run()
