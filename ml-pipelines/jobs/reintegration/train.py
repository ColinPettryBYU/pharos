"""
Reintegration Readiness Train — Builds an sklearn Pipeline with preprocessing,
compares classifiers with class_weight='balanced', and saves the best model.
"""
import json
import joblib
from datetime import datetime

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, make_scorer, precision_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from jobs.config import ARTIFACTS_DIR


def run():
    df = joblib.load(ARTIFACTS_DIR / 'reintegration_etl.pkl')

    exclude_cols = ['resident_id', 'reintegration_status', 'ready']
    feature_cols = [c for c in df.columns if c not in exclude_cols]

    X = df[feature_cols].copy()
    y = df['ready'].copy()

    numeric_cols = X.select_dtypes(include='number').columns.tolist()
    categorical_cols = X.select_dtypes(include='object').columns.tolist()

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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    precision_ready = make_scorer(precision_score, pos_label=1, zero_division=0)

    models = {
        'Logistic Regression': Pipeline([
            ('prep', preprocessor),
            ('model', LogisticRegression(max_iter=1000, C=0.5, class_weight='balanced', random_state=42)),
        ]),
        'Random Forest': Pipeline([
            ('prep', preprocessor),
            ('model', RandomForestClassifier(
                n_estimators=200, max_depth=4, min_samples_leaf=3,
                class_weight='balanced', random_state=42)),
        ]),
        'Gradient Boosting': Pipeline([
            ('prep', preprocessor),
            ('model', GradientBoostingClassifier(
                n_estimators=100, max_depth=2, learning_rate=0.1,
                min_samples_leaf=3, random_state=42)),
        ]),
    }

    print('[TRAIN] Comparing models …')
    results = {}
    for name, pipeline in models.items():
        auc_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='roc_auc')
        prec_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring=precision_ready)
        pipeline.fit(X_train, y_train)
        results[name] = {
            'auc_mean': auc_scores.mean(),
            'prec_mean': prec_scores.mean(),
            'pipeline': pipeline,
        }
        print(f'  {name:<25s}  AUC: {auc_scores.mean():.3f} ± {auc_scores.std():.3f}  '
              f'Prec: {prec_scores.mean():.3f}')

    best_name = max(results, key=lambda k: results[k]['auc_mean'])
    best_pipeline = results[best_name]['pipeline']
    print(f'[TRAIN] Best model: {best_name}')

    y_proba = best_pipeline.predict_proba(X_test)[:, 1]
    y_pred = best_pipeline.predict(X_test)
    test_auc = roc_auc_score(y_test, y_proba)
    print(f'[TRAIN] Test AUC-ROC: {test_auc:.3f}')
    print(classification_report(y_test, y_pred, target_names=['Not Ready', 'Ready']))

    model_path = ARTIFACTS_DIR / 'reintegration_readiness_pipeline.sav'
    features_path = ARTIFACTS_DIR / 'reintegration_readiness_features.sav'
    meta_path = ARTIFACTS_DIR / 'reintegration_readiness_metadata.json'

    joblib.dump(best_pipeline, model_path)
    joblib.dump(feature_cols, features_path)

    metadata = {
        'trained_at': datetime.utcnow().isoformat(),
        'best_model': best_name,
        'cv_auc_roc': round(results[best_name]['auc_mean'], 4),
        'test_auc_roc': round(test_auc, 4),
        'n_samples': len(df),
        'n_features': len(feature_cols),
        'positive_rate': round(y.mean(), 4),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'[TRAIN] Saved model → {model_path}')
    print(f'[TRAIN] Saved features → {features_path}')
    print(f'[TRAIN] Saved metadata → {meta_path}')


if __name__ == '__main__':
    run()
