"""
Social Media Optimizer Inference — Brute-forces the optimal posting
configuration per platform/post_type combo and upserts recommendations
to the ml_social_media_recommendations table.
"""
import numpy as np
import joblib
import pandas as pd
from datetime import datetime, timezone

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import read_table, upsert_dataframe

PRED_NUM_FEATURES = [
    'caption_length', 'num_hashtags', 'mentions_count', 'has_call_to_action',
    'features_resident_story', 'is_boosted', 'boost_budget_php',
    'hour_sin', 'hour_cos', 'is_weekend', 'follower_count_at_post', 'has_donate_cta',
]
PRED_CAT_FEATURES = ['platform', 'post_type', 'media_type', 'content_topic', 'sentiment_tone']


def run():
    model = joblib.load(ARTIFACTS_DIR / 'social_media_donation_model.sav')
    posts = read_table('social_media_posts')

    platforms = posts['platform'].dropna().unique()
    post_types = posts['post_type'].dropna().unique()
    hours = [8, 10, 12, 17, 19, 20]
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    all_features = PRED_NUM_FEATURES + PRED_CAT_FEATURES
    recommendations = []

    for platform in platforms:
        for ptype in post_types:
            best_donations = -1
            best_config = None

            for hour in hours:
                for day in days:
                    is_weekend = 1 if day in ('Saturday', 'Sunday') else 0
                    sample = {
                        'caption_length': 200,
                        'num_hashtags': 5,
                        'mentions_count': 0,
                        'has_call_to_action': 1,
                        'features_resident_story': 1,
                        'is_boosted': 0,
                        'boost_budget_php': 0,
                        'hour_sin': np.sin(2 * np.pi * hour / 24),
                        'hour_cos': np.cos(2 * np.pi * hour / 24),
                        'is_weekend': is_weekend,
                        'follower_count_at_post': 5000,
                        'has_donate_cta': 1,
                        'platform': platform,
                        'post_type': ptype,
                        'media_type': 'Photo',
                        'content_topic': 'DonorImpact',
                        'sentiment_tone': 'Hopeful',
                    }
                    df_sample = pd.DataFrame([sample])[all_features]
                    pred = model.predict(df_sample)[0]
                    if pred > best_donations:
                        best_donations = pred
                        best_config = {
                            'platform': platform,
                            'post_type': ptype,
                            'recommended_hour': hour,
                            'recommended_day': day,
                            'include_resident_story': True,
                            'include_call_to_action': True,
                            'predicted_donations': round(float(pred), 2),
                        }

            if best_config:
                recommendations.append(best_config)

    rec_df = pd.DataFrame(recommendations)
    rec_df['computed_at'] = datetime.now(timezone.utc)

    out = rec_df[[
        'platform', 'post_type', 'recommended_hour', 'recommended_day',
        'include_resident_story', 'include_call_to_action',
        'predicted_donations', 'computed_at',
    ]]
    print(f'[INFERENCE] Upserting {len(out)} rows → ml_social_media_recommendations')
    upsert_dataframe(out, 'ml_social_media_recommendations')
    print('[INFERENCE] Done.')


if __name__ == '__main__':
    run()
