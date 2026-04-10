"""
Resident Risk Train — Temporal train/test split, GroupKFold by resident_id,
GridSearchCV on a GBM pipeline, and model artifact export.
"""
import json
import joblib
import numpy as np
from datetime import datetime, timezone

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from jobs.config import ARTIFACTS_DIR


def run():
    panel = joblib.load(ARTIFACTS_DIR / 'resident_risk_etl.pkl')

    last_ym = panel['ym'].max()
    df = panel[panel['ym'] < last_ym].copy()

    exclude_cols = ['resident_id', 'ym', 'elevated_risk']
    feature_cols = [c for c in df.columns if c not in exclude_cols]

    X = df[feature_cols].copy()
    y = df['elevated_risk'].copy()
    groups = df['resident_id'].values

    numeric_cols = X.select_dtypes(include='number').columns.tolist()
    categorical_cols = X.select_dtypes(include=['object', 'string']).columns.tolist()

    numeric_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])

    transformers = [('num', numeric_pipe, numeric_cols)]
    if categorical_cols:
        categorical_pipe = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
        ])
        transformers.append(('cat', categorical_pipe, categorical_cols))

    preprocessor = ColumnTransformer(transformers)

    # ── Temporal split at 80th percentile month ──
    sorted_yms = sorted(df['ym'].unique())
    cutoff_idx = int(len(sorted_yms) * 0.8)
    cutoff_ym = sorted_yms[cutoff_idx]
    train_mask = df['ym'] < cutoff_ym
    test_mask = df['ym'] >= cutoff_ym

    X_train, X_test = X[train_mask], X[test_mask]
    y_train, y_test = y[train_mask], y[test_mask]
    groups_train = groups[train_mask]

    print(f'[TRAIN] Train: {len(X_train)} rows (< {cutoff_ym})  |  Test: {len(X_test)} rows (≥ {cutoff_ym})')
    print(f'[TRAIN] Positive rate — train: {y_train.mean():.3f}  test: {y_test.mean():.3f}')

    # ── GroupKFold by resident_id ──
    n_unique_groups = len(np.unique(groups_train))
    n_splits = min(5, n_unique_groups)
    if n_splits < 2:
        print('[TRAIN] Not enough groups for GroupKFold — falling back to 2 splits')
        n_splits = 2
    cv = GroupKFold(n_splits=n_splits)

    param_grid = {
        'model__n_estimators': [100, 200],
        'model__max_depth': [2, 3, 4],
        'model__learning_rate': [0.05, 0.1],
        'model__min_samples_leaf': [3, 5],
    }

    full_pipeline = Pipeline([
        ('prep', preprocessor),
        ('model', GradientBoostingClassifier(random_state=42)),
    ])

    print('[TRAIN] Running GridSearchCV …')
    grid_search = GridSearchCV(
        full_pipeline, param_grid,
        cv=cv, scoring='roc_auc', n_jobs=-1,
    )
    grid_search.fit(X_train, y_train, groups=groups_train)

    best_model = grid_search.best_estimator_
    print(f'[TRAIN] Best params: {grid_search.best_params_}')
    print(f'[TRAIN] Best CV AUC-ROC: {grid_search.best_score_:.3f}')

    # ── Evaluate on temporal test set ──
    y_proba = best_model.predict_proba(X_test)[:, 1]
    y_pred = best_model.predict(X_test)

    n_test_classes = len(np.unique(y_test))
    if n_test_classes > 1:
        test_auc = roc_auc_score(y_test, y_proba)
        print(f'[TRAIN] Test AUC-ROC: {test_auc:.3f}')
    else:
        test_auc = float('nan')
        print('[TRAIN] Test set has only one class — AUC undefined')

    if n_test_classes > 1:
        print(classification_report(y_test, y_pred, target_names=['No Elevation', 'Elevated Risk'],
                                    zero_division=0))
    else:
        print(f'[TRAIN] Skipping classification_report (only {n_test_classes} class in test set)')
        print(f'[TRAIN] Test predictions — 0: {(y_pred == 0).sum()}, 1: {(y_pred == 1).sum()}')

    # ── Save artifacts ──
    model_path = ARTIFACTS_DIR / 'resident_risk_pipeline.sav'
    features_path = ARTIFACTS_DIR / 'resident_risk_features.sav'
    meta_path = ARTIFACTS_DIR / 'resident_risk_metadata.json'

    joblib.dump(best_model, model_path)
    joblib.dump(feature_cols, features_path)

    metadata = {
        'trained_at': datetime.now(timezone.utc).isoformat(),
        'best_params': {k: (int(v) if isinstance(v, (np.integer,)) else v)
                        for k, v in grid_search.best_params_.items()},
        'cv_auc_roc': round(float(grid_search.best_score_), 4),
        'test_auc_roc': round(float(test_auc), 4) if not np.isnan(test_auc) else None,
        'n_train': int(len(X_train)),
        'n_test': int(len(X_test)),
        'n_features': len(feature_cols),
        'positive_rate_train': round(float(y_train.mean()), 4),
        'cutoff_ym': str(cutoff_ym),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'[TRAIN] Saved model    → {model_path}')
    print(f'[TRAIN] Saved features → {features_path}')
    print(f'[TRAIN] Saved metadata → {meta_path}')


if __name__ == '__main__':
    run()
