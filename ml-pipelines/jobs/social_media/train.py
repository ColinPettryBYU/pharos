"""
Social Media Optimizer Train — Builds sklearn Pipeline for predicting
engagement_rate and donation_referrals, tunes the donation model via
GridSearchCV, and saves both model artifacts.
"""
import json
import joblib
import numpy as np
from datetime import datetime

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from jobs.config import ARTIFACTS_DIR

PRED_NUM_FEATURES = [
    'caption_length', 'num_hashtags', 'mentions_count', 'has_call_to_action',
    'features_resident_story', 'is_boosted', 'boost_budget_php',
    'hour_sin', 'hour_cos', 'is_weekend', 'follower_count_at_post', 'has_donate_cta',
]
PRED_CAT_FEATURES = ['platform', 'post_type', 'media_type', 'content_topic', 'sentiment_tone']


def _build_preprocessor():
    numeric_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])
    return ColumnTransformer([
        ('num', numeric_pipe, PRED_NUM_FEATURES),
        ('cat', categorical_pipe, PRED_CAT_FEATURES),
    ])


def run():
    df = joblib.load(ARTIFACTS_DIR / 'social_media_etl.pkl')

    all_features = PRED_NUM_FEATURES + PRED_CAT_FEATURES
    X_raw = df[all_features].copy()
    y_engagement = df['engagement_rate'].copy()
    y_donation_ref = df['donation_referrals'].copy()

    preprocessor = _build_preprocessor()

    X_tr, X_te, y_eng_tr, y_eng_te, y_don_tr, y_don_te = train_test_split(
        X_raw, y_engagement, y_donation_ref, test_size=0.2, random_state=42)

    # ── Engagement models ──
    print('[TRAIN] Training engagement models …')
    eng_models = {
        'Linear Regression': LinearRegression(),
        'Random Forest': RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42),
    }
    eng_results = {}
    for name, model in eng_models.items():
        pipe = Pipeline([('prep', preprocessor), ('model', model)])
        cv_scores = cross_val_score(pipe, X_tr, y_eng_tr, cv=5, scoring='r2')
        pipe.fit(X_tr, y_eng_tr)
        y_pred = pipe.predict(X_te)
        test_r2 = r2_score(y_eng_te, y_pred)
        test_rmse = mean_squared_error(y_eng_te, y_pred) ** 0.5
        eng_results[name] = {'cv_r2': cv_scores.mean(), 'test_r2': test_r2, 'test_rmse': test_rmse, 'pipeline': pipe}
        print(f'  {name:<25s}  CV R2: {cv_scores.mean():.3f}  Test R2: {test_r2:.3f}  RMSE: {test_rmse:.4f}')

    best_eng_name = max(eng_results, key=lambda k: eng_results[k]['test_r2'])
    best_eng_pipeline = eng_results[best_eng_name]['pipeline']

    # ── Donation referral model (GridSearch) ──
    print('[TRAIN] Tuning donation referral model …')
    param_grid = {
        'model__n_estimators': [100, 200],
        'model__max_depth': [3, 5, 8],
        'model__learning_rate': [0.05, 0.1, 0.2],
        'model__min_samples_leaf': [3, 5, 10],
    }

    donate_pipeline = Pipeline([('prep', _build_preprocessor()), ('model', GradientBoostingRegressor(random_state=42))])
    grid = GridSearchCV(donate_pipeline, param_grid, cv=5, scoring='r2', n_jobs=-1)
    grid.fit(X_tr, y_don_tr)

    best_donation_pipeline = grid.best_estimator_
    y_don_pred = best_donation_pipeline.predict(X_te)
    don_test_r2 = r2_score(y_don_te, y_don_pred)
    don_test_rmse = mean_squared_error(y_don_te, y_don_pred) ** 0.5
    print(f'[TRAIN] Best donation params: {grid.best_params_}')
    print(f'[TRAIN] Donation Test R2: {don_test_r2:.3f}  RMSE: {don_test_rmse:.2f}')

    # ── Save ──
    don_model_path = ARTIFACTS_DIR / 'social_media_donation_model.sav'
    eng_model_path = ARTIFACTS_DIR / 'social_media_engagement_model.sav'
    features_path = ARTIFACTS_DIR / 'social_media_features.sav'
    meta_path = ARTIFACTS_DIR / 'social_media_metadata.json'

    joblib.dump(best_donation_pipeline, don_model_path)
    joblib.dump(best_eng_pipeline, eng_model_path)
    joblib.dump(all_features, features_path)

    metadata = {
        'trained_at': datetime.utcnow().isoformat(),
        'best_engagement_model': best_eng_name,
        'engagement_test_r2': round(eng_results[best_eng_name]['test_r2'], 4),
        'donation_best_params': grid.best_params_,
        'donation_cv_r2': round(grid.best_score_, 4),
        'donation_test_r2': round(don_test_r2, 4),
        'n_samples': len(df),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f'[TRAIN] Saved donation model → {don_model_path}')
    print(f'[TRAIN] Saved engagement model → {eng_model_path}')
    print(f'[TRAIN] Saved features → {features_path}')
    print(f'[TRAIN] Saved metadata → {meta_path}')


if __name__ == '__main__':
    run()
