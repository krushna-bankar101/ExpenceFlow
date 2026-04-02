import uuid
import bcrypt
from db import execute_query


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _row_to_dict(row):
    """Convert a DB row to a camelCase dict matching frontend User interface."""
    if row is None:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "role": row["role"].lower(),
        "companyId": row["company_id"],
        "managerId": row.get("manager_id") or "",
        "department": row.get("department") or "",
        "avatar": row.get("avatar") or "",
        "isActive": bool(row.get("is_active", True)),
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else "",
    }


def get_user_by_id(user_id):
    row = execute_query("SELECT * FROM users WHERE id = %s", (user_id,), fetchone=True)
    return _row_to_dict(row)


def get_user_by_email(email):
    row = execute_query(
        "SELECT * FROM users WHERE email = %s", (email.lower(),), fetchone=True
    )
    return row  # Return raw row to access password_hash


def get_users_by_company(company_id):
    rows = execute_query(
        "SELECT * FROM users WHERE company_id = %s ORDER BY created_at DESC",
        (company_id,),
        fetchall=True,
    )
    return [_row_to_dict(r) for r in rows]


def create_user(company_id, email, password, name, role="EMPLOYEE", manager_id=None, department=None, avatar=None):
    uid = str(uuid.uuid4())
    pw_hash = hash_password(password)
    execute_query(
        """INSERT INTO users (id, company_id, email, password_hash, name, role, manager_id, department, avatar)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        (uid, company_id, email.lower(), pw_hash, name, role.upper(), manager_id, department, avatar),
        commit=True,
    )
    return get_user_by_id(uid)


def update_user(user_id, **kwargs):
    """Update user fields. Accepts camelCase or snake_case keys."""
    field_map = {
        "name": "name",
        "email": "email",
        "role": "role",
        "managerId": "manager_id",
        "manager_id": "manager_id",
        "department": "department",
        "avatar": "avatar",
        "isActive": "is_active",
        "is_active": "is_active",
        "companyId": "company_id",
        "company_id": "company_id",
    }

    sets = []
    params = []
    for key, value in kwargs.items():
        if key == "password" and value:
            sets.append("password_hash = %s")
            params.append(hash_password(value))
        elif key in field_map:
            col = field_map[key]
            if col == "role" and value:
                value = value.upper()
            if col == "is_active":
                value = 1 if value else 0
            if col == "manager_id" and value == "":
                value = None
            sets.append(f"{col} = %s")
            params.append(value)

    if not sets:
        return get_user_by_id(user_id)

    params.append(user_id)
    execute_query(
        f"UPDATE users SET {', '.join(sets)} WHERE id = %s",
        tuple(params),
        commit=True,
    )
    return get_user_by_id(user_id)


def delete_user(user_id):
    execute_query("DELETE FROM users WHERE id = %s", (user_id,), commit=True)
    return True
