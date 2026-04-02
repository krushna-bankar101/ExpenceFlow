import uuid
from db import execute_query


def _row_to_dict(row):
    """Convert a DB row to a camelCase dict matching frontend interface."""
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "country": row["country"],
        "countryCode": row.get("country_code") or "",
        "currency": row["currency"],
        "currencySymbol": row.get("currency_symbol") or "",
        "currencyName": row.get("currency_name") or "",
        "adminId": row["admin_id"],
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else "",
    }


def get_company_by_id(company_id):
    row = execute_query(
        "SELECT * FROM companies WHERE id = %s", (company_id,), fetchone=True
    )
    return _row_to_dict(row)


def create_company(name, country, country_code, currency, currency_symbol, currency_name, admin_id):
    cid = str(uuid.uuid4())
    execute_query(
        """INSERT INTO companies (id, name, country, country_code, currency, currency_symbol, currency_name, admin_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (cid, name, country, country_code, currency, currency_symbol, currency_name, admin_id),
        commit=True,
    )
    return get_company_by_id(cid)
