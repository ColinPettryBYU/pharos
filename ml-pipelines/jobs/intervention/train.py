"""
Intervention Effectiveness Train — Runs OLS with resident fixed effects
for the explanatory model and trains a GBR predictive model for
composite improvement.
"""
import json
import joblib
import numpy as np
from datetime import datetime

import statsmodels.api as sm
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from statsmodels.stats.outliers_influence import variance_inflation_factor

from jobs.config import ARTIFACTS_DIR

import pandas as pd

INT_COLS = [
    'has_safety', 'has_psychosocial', 'has_education',
    'has_physical_health', 'has_legal', 'has_reintegration',
]


def run():
    panel_clean = joblib.load(ARTIFACTS_DIR / 'intervention_etl.pkl')

    # ── VIF check ──
    explanatory_features = INT_COLS + ['session_count', 'months_since_start', 'total_active_plans']

    scaler_exp = StandardScaler()
    X_vif = panel_clean[explanatory_features].copy()
    X_vif_scaled = pd.DataFrame(
        scaler_exp.fit_transform(X_vif), columns=X_vif.columns, index=X_vif.index)

    vif_df = pd.DataFrame({
        'feature': X_vif_scaled.columns,
        'VIF': [variance_inflation_factor(X_vif_scaled.values, i) for i in range(X_vif_scaled.shape[1])],
    }).sort_values('VIF', ascending=False)

    high_vif = vif_df[vif_df['VIF'] > 5]['feature'].tolist()
    if high_vif:
        print(f'[TRAIN] Dropping {high_vif} due to VIF > 5')
        explanatory_features_final = [f for f in explanatory_features if f not in high_vif]
    else:
        explanatory_features_final = explanatory_features

    print(f'[TRAIN] Explanatory features: {explanatory_features_final}')

    # ── OLS with resident fixed effects ──
    resident_dummies = pd.get_dummies(panel_clean['resident_id'], prefix='res', drop_first=True, dtype=int)

    target_outcomes = {
        'delta_health_score': 'Health Score Change',
        'delta_edu_progress': 'Education Progress Change',
        'delta_pct_positive_end': 'Emotional State Change',
    }

    ols_models = {}
    for outcome, label in target_outcomes.items():
        y = panel_clean[outcome].copy()
        X = panel_clean[explanatory_features_final].copy()
        X = pd.concat([X, resident_dummies], axis=1)
        X = sm.add_constant(X)

        model = sm.OLS(y, X).fit(cov_type='HC1')
        ols_models[outcome] = model

        sig = [f for f in explanatory_features_final if model.pvalues.get(f, 1) < 0.10]
        print(f'[TRAIN] OLS {outcome}: R2={model.rsquared:.4f}, Sig features: {sig}')

    # ── Export effectiveness matrix ──
    intervention_feature_names = INT_COLS
    effectiveness_rows = []
    for outcome, ols_model in ols_models.items():
        for feat in intervention_feature_names:
            if feat in ols_model.params.index:
                effectiveness_rows.append({
                    'outcome': outcome,
                    'intervention': feat.replace('has_', '').replace('_', ' ').title(),
                    'coefficient': round(float(ols_model.params[feat]), 6),
                    'p_value': round(float(ols_model.pvalues[feat]), 6),
                    'significant': bool(ols_model.pvalues[feat] < 0.10),
                })

    eff_matrix = pd.DataFrame(effectiveness_rows)
    eff_path = ARTIFACTS_DIR / 'intervention_effectiveness_matrix.csv'
    eff_matrix.to_csv(eff_path, index=False)
    print(f'[TRAIN] Saved OLS matrix → {eff_path}')

    # ── Predictive model: composite improvement ──
    panel_clean['composite_improvement'] = (
        panel_clean['delta_health_score'].clip(-2, 2) / 2 +
        panel_clean['delta_edu_progress'].clip(-20, 20) / 20 +
        panel_clean['delta_pct_positive_end'].clip(-1, 1)
    ) / 3

    pred_features = INT_COLS + [
        'session_count', 'months_since_start', 'total_active_plans', 'categories_active',
        'health_score', 'edu_progress', 'pct_positive_end', 'incident_count',
    ]

    for col in pred_features:
        if col in panel_clean.columns:
            panel_clean[col] = panel_clean[col].fillna(0)

    X = panel_clean[pred_features].copy()
    y = panel_clean['composite_improvement'].copy()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pred_models = {
        'Linear Regression': Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('model', LinearRegression()),
        ]),
        'Random Forest': Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('model', RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42)),
        ]),
        'Gradient Boosting': Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('model', GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)),
        ]),
    }

    print('[TRAIN] Comparing predictive models …')
    results = {}
    for name, model in pred_models.items():
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        test_r2 = r2_score(y_test, y_pred)
        test_rmse = mean_squared_error(y_test, y_pred) ** 0.5
        results[name] = {'cv_r2': cv_scores.mean(), 'test_r2': test_r2, 'test_rmse': test_rmse, 'model': model}
        print(f'  {name:<25s}  CV R2: {cv_scores.mean():.3f}  Test R2: {test_r2:.3f}  RMSE: {test_rmse:.4f}')

    best_pred_name = max(results, key=lambda k: results[k]['cv_r2'])
    best_pred_model = results[best_pred_name]['model']
    print(f'[TRAIN] Best predictive model: {best_pred_name}')

    model_path = ARTIFACTS_DIR / 'intervention_effectiveness_model.sav'
    features_path = ARTIFACTS_DIR / 'intervention_effectiveness_features.sav'
    meta_path = ARTIFACTS_DIR / 'intervention_effectiveness_metadata.json'

    joblib.dump(best_pred_model, model_path)
    joblib.dump(pred_features, features_path)

    metadata = {
        'trained_at': datetime.utcnow().isoformat(),
        'best_model': best_pred_name,
        'cv_r2': round(results[best_pred_name]['cv_r2'], 4),
        'test_r2': round(results[best_pred_name]['test_r2'], 4),
        'test_rmse': round(results[best_pred_name]['test_rmse'], 4),
        'vif_dropped': high_vif,
        'explanatory_features': explanatory_features_final,
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'[TRAIN] Saved model → {model_path}')
    print(f'[TRAIN] Saved features → {features_path}')
    print(f'[TRAIN] Saved metadata → {meta_path}')


if __name__ == '__main__':
    run()
