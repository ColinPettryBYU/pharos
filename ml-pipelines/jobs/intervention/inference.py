"""
Intervention Effectiveness Inference — Reads the saved OLS effectiveness
matrix and upserts it to the intervention_effectiveness table.
"""
import pandas as pd
from datetime import datetime

from jobs.config import ARTIFACTS_DIR
from jobs.utils_db import upsert_dataframe


def run():
    matrix_path = ARTIFACTS_DIR / 'intervention_effectiveness_matrix.csv'
    eff = pd.read_csv(matrix_path)

    out = eff[['outcome', 'intervention', 'coefficient', 'p_value', 'significant']].copy()

    print(f'[INFERENCE] Upserting {len(out)} rows → intervention_effectiveness')
    upsert_dataframe(out, 'intervention_effectiveness')
    print('[INFERENCE] Done.')


if __name__ == '__main__':
    run()
