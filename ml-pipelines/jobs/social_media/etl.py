"""
Social Media Optimizer ETL — Reads social_media_posts and donations from the
live DB and builds the modelling DataFrame with cyclical hour encoding,
boolean flags, and categorical features.
"""
import numpy as np
import pandas as pd
import joblib

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import read_table


def run():
    print('[ETL] Loading tables from database …')
    posts = read_table('social_media_posts')
    donations = read_table('donations')

    posts['created_at'] = pd.to_datetime(posts['created_at'])

    posts['engagement_rate'] = pd.to_numeric(posts['engagement_rate'], errors='coerce').fillna(0)
    posts['donation_referrals'] = pd.to_numeric(posts['donation_referrals'], errors='coerce').fillna(0)
    posts['post_hour'] = pd.to_numeric(posts['post_hour'], errors='coerce').fillna(12).astype(int)
    posts['caption_length'] = pd.to_numeric(posts['caption_length'], errors='coerce').fillna(0)
    posts['num_hashtags'] = pd.to_numeric(posts['num_hashtags'], errors='coerce').fillna(0)
    posts['mentions_count'] = pd.to_numeric(posts['mentions_count'], errors='coerce').fillna(0)
    posts['boost_budget_php'] = pd.to_numeric(posts['boost_budget_php'], errors='coerce').fillna(0)
    posts['follower_count_at_post'] = pd.to_numeric(posts['follower_count_at_post'], errors='coerce').fillna(0)

    posts['has_call_to_action'] = posts['has_call_to_action'].astype(int)
    posts['features_resident_story'] = posts['features_resident_story'].astype(int)
    posts['is_boosted'] = posts['is_boosted'].astype(int)

    # Cyclical hour encoding
    posts['hour_sin'] = np.sin(2 * np.pi * posts['post_hour'] / 24)
    posts['hour_cos'] = np.cos(2 * np.pi * posts['post_hour'] / 24)

    # Weekend flag
    posts['is_weekend'] = posts['day_of_week'].isin(['Saturday', 'Sunday']).astype(int)

    # DonateNow CTA flag
    posts['has_donate_cta'] = (posts['call_to_action_type'] == 'DonateNow').astype(int)

    df = posts.copy()

    out_path = ARTIFACTS_DIR / 'social_media_etl.pkl'
    joblib.dump(df, out_path)
    print(f'[ETL] Saved modelling DataFrame ({df.shape}) → {out_path}')
    return df


if __name__ == '__main__':
    run()
