import mysql.connector
from mysql.connector import pooling
from config import Config

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="backend_pool",
            pool_size=10,
            pool_reset_session=True,
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            autocommit=False,
        )
    return _pool


def get_connection():
    """Get a connection from the pool."""
    return get_pool().get_connection()


def execute_query(query, params=None, fetchone=False, fetchall=False, commit=False):
    """
    Helper to run a query and return results.
    - fetchone: return a single dict
    - fetchall: return a list of dicts
    - commit: commit the transaction (for INSERT/UPDATE/DELETE)
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if commit:
            conn.commit()
            return cursor.lastrowid
        if fetchone:
            return cursor.fetchone()
        if fetchall:
            return cursor.fetchall()
        return None
    except Exception as e:
        print("======== DB ERROR ========")
        print(f"Error: {e}")
        print(f"Query: {query}")
        print(f"Params: {params}")
        print("==========================")
        if commit:
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


def execute_many(queries_and_params, return_last=False):
    """
    Execute multiple queries in a single transaction.
    queries_and_params: list of (query, params) tuples
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    result = None
    try:
        for query, params in queries_and_params:
            cursor.execute(query, params or ())
            result = cursor.lastrowid
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
