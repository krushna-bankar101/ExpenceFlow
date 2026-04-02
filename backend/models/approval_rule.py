import uuid
import json
from db import execute_query, get_connection


def _rule_row_to_dict(row, steps=None):
    """Convert DB row to camelCase dict matching frontend ApprovalRule interface."""
    if row is None:
        return None

    categories = row.get("categories")
    if isinstance(categories, str):
        categories = json.loads(categories)

    conditional_rule = None
    ctype = row.get("conditional_type")
    if ctype:
        conditional_rule = {
            "type": ctype.lower(),
            "percentage": int(row["conditional_percentage"]) if row.get("conditional_percentage") else None,
            "specificApproverId": row.get("specific_approver_id") or None,
        }
        # Fetch specific approver name if set
        if conditional_rule["specificApproverId"]:
            approver = execute_query(
                "SELECT name FROM users WHERE id = %s",
                (conditional_rule["specificApproverId"],),
                fetchone=True,
            )
            conditional_rule["specificApproverName"] = approver["name"] if approver else None

    # Build approvers list from steps
    approvers = []
    if steps is not None:
        for s in steps:
            approvers.append({
                "order": s["step_order"],
                "userId": s["user_id"],
                "userName": s.get("user_name", ""),
                "userRole": s.get("user_role", ""),
            })
    else:
        approvers = _get_rule_steps(row["id"])

    return {
        "id": row["id"],
        "companyId": row["company_id"],
        "name": row["name"],
        "description": row.get("description") or "",
        "isActive": bool(row.get("is_active", True)),
        "isManagerApproverFirst": bool(row.get("is_manager_approver_first", False)),
        "approvers": approvers,
        "conditionalRule": conditional_rule,
        "minAmount": float(row["min_amount"]) if row.get("min_amount") is not None else None,
        "maxAmount": float(row["max_amount"]) if row.get("max_amount") is not None else None,
        "categories": categories or [],
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else "",
    }


def _get_rule_steps(rule_id):
    """Get approval steps for a rule with user info."""
    rows = execute_query(
        """SELECT ars.*, u.name as user_name, u.role as user_role
           FROM approval_rule_steps ars
           JOIN users u ON u.id = ars.user_id
           WHERE ars.rule_id = %s
           ORDER BY ars.step_order""",
        (rule_id,),
        fetchall=True,
    )
    return [
        {
            "order": r["step_order"],
            "userId": r["user_id"],
            "userName": r["user_name"],
            "userRole": r["user_role"].lower(),
        }
        for r in rows
    ]


def get_rules_by_company(company_id):
    rows = execute_query(
        "SELECT * FROM approval_rules WHERE company_id = %s ORDER BY created_at DESC",
        (company_id,),
        fetchall=True,
    )
    return [_rule_row_to_dict(r) for r in rows]


def get_rule_by_id(rule_id):
    row = execute_query(
        "SELECT * FROM approval_rules WHERE id = %s", (rule_id,), fetchone=True
    )
    return _rule_row_to_dict(row)


def create_rule(company_id, name, description, is_active, is_manager_approver_first,
                approvers, conditional_rule, min_amount, max_amount, categories):
    rule_id = str(uuid.uuid4())

    ctype = None
    cpct = None
    specific_id = None
    if conditional_rule and conditional_rule.get("type") and conditional_rule["type"] != "none":
        ctype = conditional_rule["type"].upper()
        cpct = conditional_rule.get("percentage")
        specific_id = conditional_rule.get("specificApproverId")

    cats_json = json.dumps(categories) if categories else None

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO approval_rules
               (id, company_id, name, description, is_active, is_manager_approver_first,
                min_amount, max_amount, categories, conditional_type, conditional_percentage,
                specific_approver_id)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (rule_id, company_id, name, description or None,
             1 if is_active else 0, 1 if is_manager_approver_first else 0,
             min_amount, max_amount, cats_json, ctype, cpct, specific_id),
        )

        # Insert steps
        for approver in (approvers or []):
            step_id = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO approval_rule_steps (id, rule_id, step_order, user_id)
                   VALUES (%s, %s, %s, %s)""",
                (step_id, rule_id, approver["order"], approver["userId"]),
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

    return get_rule_by_id(rule_id)


def update_rule(rule_id, **kwargs):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Build SET clause for the rule itself
        sets = []
        params = []

        simple_fields = {
            "name": "name",
            "description": "description",
            "isActive": "is_active",
            "is_active": "is_active",
            "isManagerApproverFirst": "is_manager_approver_first",
            "is_manager_approver_first": "is_manager_approver_first",
            "minAmount": "min_amount",
            "min_amount": "min_amount",
            "maxAmount": "max_amount",
            "max_amount": "max_amount",
        }

        for key, col in simple_fields.items():
            if key in kwargs:
                val = kwargs[key]
                if col in ("is_active", "is_manager_approver_first"):
                    val = 1 if val else 0
                sets.append(f"{col} = %s")
                params.append(val)

        if "categories" in kwargs:
            cats = kwargs["categories"]
            sets.append("categories = %s")
            params.append(json.dumps(cats) if cats else None)

        if "conditionalRule" in kwargs:
            cr = kwargs["conditionalRule"]
            if cr and cr.get("type") and cr["type"] != "none":
                sets.append("conditional_type = %s")
                params.append(cr["type"].upper())
                sets.append("conditional_percentage = %s")
                params.append(cr.get("percentage"))
                sets.append("specific_approver_id = %s")
                params.append(cr.get("specificApproverId"))
            else:
                sets.append("conditional_type = %s")
                params.append(None)
                sets.append("conditional_percentage = %s")
                params.append(None)
                sets.append("specific_approver_id = %s")
                params.append(None)

        if sets:
            params.append(rule_id)
            cursor.execute(
                f"UPDATE approval_rules SET {', '.join(sets)} WHERE id = %s",
                tuple(params),
            )

        # Update steps if provided
        if "approvers" in kwargs:
            cursor.execute("DELETE FROM approval_rule_steps WHERE rule_id = %s", (rule_id,))
            for approver in (kwargs["approvers"] or []):
                step_id = str(uuid.uuid4())
                cursor.execute(
                    """INSERT INTO approval_rule_steps (id, rule_id, step_order, user_id)
                       VALUES (%s, %s, %s, %s)""",
                    (step_id, rule_id, approver["order"], approver["userId"]),
                )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

    return get_rule_by_id(rule_id)


def delete_rule(rule_id):
    execute_query("DELETE FROM approval_rules WHERE id = %s", (rule_id,), commit=True)
    return True
