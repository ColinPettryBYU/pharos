from sqlalchemy import create_engine, text
from jobs.config import DATABASE_URL
import pandas as pd


def get_engine():
    return create_engine(DATABASE_URL)


def read_table(table_name: str):
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(f'SELECT * FROM "{table_name}"', conn)


def read_query(query: str):
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(query, conn)


def upsert_dataframe(df, table_name: str):
    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text(f'DELETE FROM "{table_name}"'))
    df.to_sql(table_name, engine, if_exists='append', index=False)
