"""
Reintegration Readiness Inference — Loads model, scores all residents,
and upserts results to the resident_readiness_scores table.
"""
import joblib
import pandas as pd
from datetime import datetime

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import upsert_dataframe


def run():
    model = joblib.load(ARTIFACTS_DIR / 'reintegration_readiness_pipeline.sav')
    feature_cols = joblib.load(ARTIFACTS_DIR / 'reintegration_readiness_features.sav')
    df = joblib.load(ARTIFACTS_DIR / 'reintegration_etl.pkl')

    X_all = df[feature_cols].copy()
    all_proba = model.predict_proba(X_all)[:, 1]

    readiness_df = df[['resident_id']].copy()
    readiness_df['readiness_score'] = (all_proba * 100).round(1)
    readiness_df['readiness_tier'] = pd.cut(
        all_proba,
        bins=[0, 0.30, 0.50, 0.75, 1.0],
        labels=['Not Ready', 'In Progress', 'Nearly Ready', 'Ready'],
    )
    readiness_df['readiness_tier'] = readiness_df['readiness_tier'].astype(str)
    readiness_df['computed_at'] = datetime.utcnow()

    out = readiness_df[['resident_id', 'readiness_score', 'readiness_tier', 'computed_at']]
    print(f'[INFERENCE] Upserting {len(out)} rows → resident_readiness_scores')
    upsert_dataframe(out, 'resident_readiness_scores')
    print('[INFERENCE] Done.')


if __name__ == '__main__':
    run()
