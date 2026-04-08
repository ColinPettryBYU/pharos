import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROJECT_ROOT / 'artifacts'
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError(
        'DATABASE_URL environment variable not set. '
        'Format: postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres'
    )
