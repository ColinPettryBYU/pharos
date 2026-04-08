"""
Donor Churn Inference — Loads the trained model, scores every supporter,
and upserts results to the donor_churn_scores table.
"""
import joblib
import pandas as pd
from datetime import datetime, timezone

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import upsert_dataframe


def run():
    model = joblib.load(ARTIFACTS_DIR / 'donor_churn_pipeline.sav')
    feature_cols = joblib.load(ARTIFACTS_DIR / 'donor_churn_features.sav')
    df = joblib.load(ARTIFACTS_DIR / 'donor_churn_etl.pkl')

    X_all = df[feature_cols].copy()
    all_proba = model.predict_proba(X_all)[:, 1]

    risk_df = df[['supporter_id']].copy()
    risk_df['churn_risk_score'] = all_proba.round(4)
    risk_df['risk_tier'] = pd.cut(
        all_proba,
        bins=[0, 0.3, 0.6, 1.0],
        labels=['Low Risk', 'Medium Risk', 'High Risk'],
    )
    risk_df['risk_tier'] = risk_df['risk_tier'].astype(str)
    risk_df['computed_at'] = datetime.now(timezone.utc)

    out = risk_df[['supporter_id', 'churn_risk_score', 'risk_tier', 'computed_at']]
    print(f'[INFERENCE] Upserting {len(out)} rows → donor_churn_scores')
    upsert_dataframe(out, 'donor_churn_scores')
    print('[INFERENCE] Done.')


if __name__ == '__main__':
    run()
