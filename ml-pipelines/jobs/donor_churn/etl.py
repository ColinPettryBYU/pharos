"""
Donor Churn ETL — Reads supporters, donations, donation_allocations from the
live DB and builds the modelling DataFrame with engineered features.
"""
import numpy as np
import pandas as pd
import joblib

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import read_table


def _compute_donation_features(donor_donations, donor_monetary, donor_ids, ref_date):
    records = []
    for sid in donor_ids:
        d = donor_donations[donor_donations['supporter_id'] == sid]
        m = donor_monetary[donor_monetary['supporter_id'] == sid]

        total_donations = len(d)
        total_monetary_amount = m['amount'].sum() if len(m) > 0 else 0
        avg_donation_amount = m['amount'].mean() if len(m) > 0 else 0
        max_donation_amount = m['amount'].max() if len(m) > 0 else 0

        if len(d) > 1:
            dates_sorted = d['donation_date'].sort_values()
            gaps = dates_sorted.diff().dt.days.dropna()
            donation_frequency_days = gaps.mean()
        else:
            donation_frequency_days = np.nan

        days_since_last = (ref_date - d['donation_date'].max()).days if len(d) > 0 else 9999

        num_campaigns = d['campaign_name'].dropna().nunique()
        has_recurring = int(d['is_recurring'].any()) if len(d) > 0 else 0
        donation_type_diversity = d['donation_type'].nunique()
        channel_diversity = d['channel_source'].nunique()
        pct_monetary = len(m) / len(d) if len(d) > 0 else 0
        social_referred = d['referral_post_id'].notna().sum()

        if len(m) > 2:
            m_sorted = m.sort_values('donation_date')
            x = np.arange(len(m_sorted))
            y = m_sorted['amount'].values.astype(float)
            slope = np.polyfit(x, y, 1)[0]
        else:
            slope = 0

        primary_channel = d['channel_source'].mode().iloc[0] if len(d) > 0 else 'Unknown'

        records.append({
            'supporter_id': sid,
            'total_donations': total_donations,
            'total_monetary_amount': total_monetary_amount,
            'avg_donation_amount': avg_donation_amount,
            'max_donation_amount': max_donation_amount,
            'donation_frequency_days': donation_frequency_days,
            'days_since_last_donation': days_since_last,
            'num_campaigns': num_campaigns,
            'has_recurring': has_recurring,
            'donation_type_diversity': donation_type_diversity,
            'channel_diversity': channel_diversity,
            'pct_monetary': pct_monetary,
            'social_referred_count': social_referred,
            'donation_trend_slope': slope,
            'primary_channel': primary_channel,
        })
    return pd.DataFrame(records)


def run():
    print('[ETL] Loading tables from database …')
    supporters = read_table('supporters')
    donations = read_table('donations')
    allocations = read_table('donation_allocations')

    supporters['first_donation_date'] = pd.to_datetime(supporters['first_donation_date'], utc=True).dt.tz_localize(None)
    donations['donation_date'] = pd.to_datetime(donations['donation_date'], utc=True).dt.tz_localize(None)

    reference_date = donations['donation_date'].max()
    cutoff_date = reference_date - pd.Timedelta(days=180)

    donor_ids = donations['supporter_id'].unique()

    post_cutoff = donations[donations['donation_date'] > cutoff_date]
    active_donors = set(post_cutoff['supporter_id'].unique())
    churn_labels = pd.DataFrame({
        'supporter_id': donor_ids,
        'churned': [0 if sid in active_donors else 1 for sid in donor_ids],
    })

    pre_cutoff_donations = donations[donations['donation_date'] <= cutoff_date].copy()
    monetary = pre_cutoff_donations[pre_cutoff_donations['donation_type'] == 'Monetary'].copy()

    print('[ETL] Computing donation features …')
    donation_features = _compute_donation_features(pre_cutoff_donations, monetary, donor_ids, cutoff_date)

    donor_gaps = donations.sort_values(['supporter_id', 'donation_date']).groupby('supporter_id').apply(
        lambda g: g['donation_date'].diff().dt.days.median()
    ).reset_index()
    donor_gaps.columns = ['supporter_id', 'median_gap_days']

    donation_features = donation_features.merge(donor_gaps, on='supporter_id', how='left')
    donation_features['median_gap_days'] = donation_features['median_gap_days'].fillna(
        donation_features['median_gap_days'].median())
    donation_features['is_likely_annual'] = (donation_features['median_gap_days'] > 150).astype(int)

    supp_features = supporters[['supporter_id', 'supporter_type', 'relationship_type',
                                'acquisition_channel', 'country', 'first_donation_date']].copy()
    supp_features['tenure_days'] = (cutoff_date - supp_features['first_donation_date']).dt.days
    supp_features['is_international'] = (supp_features['country'] != 'Philippines').astype(int)
    supp_features.drop(columns=['first_donation_date', 'country'], inplace=True)

    pre_alloc = allocations.merge(
        pre_cutoff_donations[['donation_id', 'supporter_id']], on='donation_id', how='inner')
    alloc_features = pre_alloc.groupby('supporter_id').agg(
        num_safehouses_supported=('safehouse_id', 'nunique'),
        num_program_areas=('program_area', 'nunique'),
    ).reset_index()

    df = donation_features.merge(supp_features, on='supporter_id', how='left')
    df = df.merge(alloc_features, on='supporter_id', how='left')
    df = df.merge(churn_labels, on='supporter_id', how='inner')

    df['donation_frequency_days'] = df['donation_frequency_days'].fillna(df['donation_frequency_days'].median())
    df['num_safehouses_supported'] = df['num_safehouses_supported'].fillna(0)
    df['num_program_areas'] = df['num_program_areas'].fillna(0)
    df['tenure_days'] = df['tenure_days'].fillna(df['tenure_days'].median())

    out_path = ARTIFACTS_DIR / 'donor_churn_etl.pkl'
    joblib.dump(df, out_path)
    print(f'[ETL] Saved modelling DataFrame ({df.shape}) → {out_path}')
    return df


if __name__ == '__main__':
    run()
