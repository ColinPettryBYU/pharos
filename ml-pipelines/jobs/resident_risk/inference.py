"""
Resident Risk Inference — Loads the trained model, scores every resident using
the latest month of data, computes top contributing factors, and upserts
results to the resident_elevated_risk_scores table.
"""
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import upsert_dataframe


def _get_top_factors(model, feature_cols, X, top_n=3):
    """Approximate per-row top factors using global importances × absolute feature values."""
    gbm = model.named_steps['model']
    preprocessor = model.named_steps['prep']

    importances = gbm.feature_importances_

    X_transformed = preprocessor.transform(X)
    if hasattr(X_transformed, 'toarray'):
        X_transformed = X_transformed.toarray()

    transformed_names = []
    for name, trans, cols in preprocessor.transformers_:
        if name == 'num':
            transformed_names.extend(cols)
        elif name == 'cat':
            ohe = trans.named_steps['ohe']
            transformed_names.extend(ohe.get_feature_names_out(cols).tolist())

    if len(transformed_names) != len(importances):
        transformed_names = [f'f{i}' for i in range(len(importances))]

    contrib = np.abs(X_transformed) * importances[np.newaxis, :]

    top_factors_list = []
    for i in range(contrib.shape[0]):
        row_contribs = contrib[i]
        top_idx = np.argsort(row_contribs)[::-1][:top_n]
        factors = [
            {'feature': transformed_names[j], 'weight': round(float(row_contribs[j]), 4)}
            for j in top_idx if row_contribs[j] > 0
        ]
        top_factors_list.append(json.dumps(factors))

    return top_factors_list


def run():
    print('[INFERENCE] Loading model and features …')
    model = joblib.load(ARTIFACTS_DIR / 'resident_risk_pipeline.sav')
    feature_cols = joblib.load(ARTIFACTS_DIR / 'resident_risk_features.sav')

    from jobs.resident_risk.etl import run as run_etl
    df = run_etl()

    if df is None or len(df) == 0:
        print('[INFERENCE] No data from ETL — aborting.')
        return

    latest_ym = df['ym'].max()
    current = df[df['ym'] == latest_ym].copy()

    if len(current) == 0:
        print('[INFERENCE] No current-month data, using latest available per resident')
        current = df.sort_values('ym').groupby('resident_id').last().reset_index()

    missing_cols = [c for c in feature_cols if c not in current.columns]
    for c in missing_cols:
        current[c] = 0

    X = current[feature_cols].copy()
    risk_scores = model.predict_proba(X)[:, 1]

    top_factors = _get_top_factors(model, feature_cols, X, top_n=3)

    results = pd.DataFrame({
        'resident_id': current['resident_id'].astype(int).values,
        'risk_score': np.round(risk_scores, 4).astype(float),
        'risk_tier': pd.cut(
            risk_scores,
            bins=[-np.inf, 0.35, 0.6, np.inf],
            labels=['Low', 'Medium', 'High'],
        ).astype(str),
        'top_factors': top_factors,
        'computed_at': datetime.now(timezone.utc),
    })

    results = results.drop_duplicates(subset='resident_id', keep='last')

    print(f'[INFERENCE] Tier distribution:\n{results["risk_tier"].value_counts().to_string()}')
    print(f'[INFERENCE] Upserting {len(results)} rows → resident_elevated_risk_scores')
    upsert_dataframe(results, 'resident_elevated_risk_scores')
    print('[INFERENCE] Done.')


if __name__ == '__main__':
    run()
