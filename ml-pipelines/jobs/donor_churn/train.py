"""
Donor Churn Train — Builds an sklearn Pipeline (preprocessor + GBM),
tunes hyperparameters, and saves the model artifact.
"""
import json
import joblib
import numpy as np
from datetime import datetime

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from jobs.config import ARTIFACTS_DIR


def run():
    df = joblib.load(ARTIFACTS_DIR / 'donor_churn_etl.pkl')

    drop_cols = ['supporter_id', 'churned']
    X = df.drop(columns=drop_cols)
    y = df['churned'].copy()

    numeric_cols = X.select_dtypes(include='number').columns.tolist()
    categorical_cols = X.select_dtypes(include='object').columns.tolist()
    feature_cols = X.columns.tolist()

    numeric_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])

    preprocessor = ColumnTransformer([
        ('num', numeric_pipe, numeric_cols),
        ('cat', categorical_pipe, categorical_cols),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    param_grid = {
        'model__n_estimators': [100, 200],
        'model__max_depth': [2, 3, 4],
        'model__learning_rate': [0.05, 0.1, 0.2],
        'model__min_samples_leaf': [2, 5],
    }

    full_pipeline = Pipeline([
        ('prep', preprocessor),
        ('model', GradientBoostingClassifier(random_state=42)),
    ])

    print('[TRAIN] Running GridSearchCV …')
    grid_search = GridSearchCV(full_pipeline, param_grid, cv=cv, scoring='roc_auc', n_jobs=-1)
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    print(f'[TRAIN] Best params: {grid_search.best_params_}')
    print(f'[TRAIN] Best CV AUC-ROC: {grid_search.best_score_:.3f}')

    y_proba = best_model.predict_proba(X_test)[:, 1]
    y_pred = best_model.predict(X_test)
    test_auc = roc_auc_score(y_test, y_proba)
    print(f'[TRAIN] Test AUC-ROC: {test_auc:.3f}')
    print(classification_report(y_test, y_pred, target_names=['Active', 'Churned']))

    model_path = ARTIFACTS_DIR / 'donor_churn_pipeline.sav'
    features_path = ARTIFACTS_DIR / 'donor_churn_features.sav'
    meta_path = ARTIFACTS_DIR / 'donor_churn_metadata.json'

    joblib.dump(best_model, model_path)
    joblib.dump(feature_cols, features_path)

    metadata = {
        'trained_at': datetime.utcnow().isoformat(),
        'best_params': grid_search.best_params_,
        'cv_auc_roc': round(grid_search.best_score_, 4),
        'test_auc_roc': round(test_auc, 4),
        'n_samples': len(df),
        'n_features': len(feature_cols),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'[TRAIN] Saved model → {model_path}')
    print(f'[TRAIN] Saved features → {features_path}')
    print(f'[TRAIN] Saved metadata → {meta_path}')


if __name__ == '__main__':
    run()
