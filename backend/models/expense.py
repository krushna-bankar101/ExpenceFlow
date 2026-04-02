import uuid
import json
from datetime import datetime
from db import execute_query, get_connection


def _expense_row_to_dict(row, approvals=None):
    """Convert DB row to camelCase dict matching frontend Expense interface."""
    if row is None:
        return None

    ocr_data = row.get("ocr_data")
    if isinstance(ocr_data, str):
        ocr_data = json.loads(ocr_data)

    # Get employee name
    employee = execute_query(
        "SELECT name FROM users WHERE id = %s", (row["employee_id"],), fetchone=True
    )

    # Get approvals if not passed
    if approvals is None:
        approvals = _get_expense_approvals(row["id"])

    return {
        "id": row["id"],
        "employeeId": row["employee_id"],
        "employeeName": employee["name"] if employee else "",
        "companyId": row["company_id"],
        "title": row["title"],
        "amount": float(row["amount"]),
        "currency": row["currency"],
        "currencySymbol": row.get("currency_symbol") or "",
        "exchangeRate": float(row["exchange_rate"]) if row.get("exchange_rate") else 1.0,
        "amountInCompanyCurrency": float(row["amount_in_company_currency"]),
        "category": row["category"],
        "description": row.get("description") or "",
        "date": row["date"].isoformat() if row.get("date") else "",
        "receiptDataUrl": row.get("receipt_image_url") or "",
        "ocrData": ocr_data,
        "status": row["status"].lower(),
        "approvalRuleId": row.get("approval_rule_id") or "",
        "currentApproverStep": row.get("current_approver_step", 0) or 0,
        "approvals": approvals,
        "adminOverrideBy": row.get("admin_override_by") or "",
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else "",
        "updatedAt": row["updated_at"].isoformat() if row.get("updated_at") else "",
    }


def _get_expense_approvals(expense_id):
    """Get approval records for an expense."""
    rows = execute_query(
        """SELECT ea.*, u.name as approver_name
           FROM expense_approvals ea
           JOIN users u ON u.id = ea.approver_id
           WHERE ea.expense_id = %s
           ORDER BY ea.step""",
        (expense_id,),
        fetchall=True,
    )
    return [
        {
            "approverId": r["approver_id"],
            "approverName": r["approver_name"],
            "step": r["step"],
            "status": r["status"].lower(),
            "comment": r.get("comment") or "",
            "timestamp": r["action_timestamp"].isoformat() if r.get("action_timestamp") else "",
        }
        for r in rows
    ]


def get_expenses_by_company(company_id, employee_id=None, status=None):
    query = "SELECT * FROM expenses WHERE company_id = %s"
    params = [company_id]

    if employee_id:
        query += " AND employee_id = %s"
        params.append(employee_id)

    if status:
        query += " AND status = %s"
        params.append(status.upper())

    query += " ORDER BY created_at DESC"
    rows = execute_query(query, tuple(params), fetchall=True)
    return [_expense_row_to_dict(r) for r in rows]


def get_expense_by_id(expense_id):
    row = execute_query(
        "SELECT * FROM expenses WHERE id = %s", (expense_id,), fetchone=True
    )
    return _expense_row_to_dict(row)


def create_expense(employee_id, company_id, title, amount, currency, currency_symbol,
                   exchange_rate, amount_in_company_currency, category, description,
                   date, receipt_image_url, ocr_data, status, approval_rule_id,
                   current_approver_step, approvals):
    """Create an expense with its approval records."""
    expense_id = str(uuid.uuid4())
    ocr_json = json.dumps(ocr_data) if ocr_data else None

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO expenses
               (id, employee_id, company_id, title, amount, currency, currency_symbol,
                exchange_rate, amount_in_company_currency, category, description, date,
                receipt_image_url, ocr_data, status, approval_rule_id, current_approver_step)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (expense_id, employee_id, company_id, title, amount, currency, currency_symbol,
             exchange_rate, amount_in_company_currency, category, description or None, date,
             receipt_image_url, ocr_json, status.upper(), approval_rule_id,
             current_approver_step or 0),
        )

        # Insert approval records
        for approval in (approvals or []):
            aid = str(uuid.uuid4())
            cursor.execute(
                """INSERT INTO expense_approvals
                   (id, expense_id, approver_id, step, status, comment)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (aid, expense_id, approval["approverId"], approval["step"],
                 approval.get("status", "PENDING").upper(), approval.get("comment")),
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

    return get_expense_by_id(expense_id)


def update_expense(expense_id, **kwargs):
    """Update expense fields."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sets = []
        params = []

        field_map = {
            "status": "status",
            "currentApproverStep": "current_approver_step",
            "current_approver_step": "current_approver_step",
            "adminOverrideBy": "admin_override_by",
            "admin_override_by": "admin_override_by",
            "receiptDataUrl": "receipt_image_url",
            "receipt_image_url": "receipt_image_url",
        }

        for key, col in field_map.items():
            if key in kwargs:
                val = kwargs[key]
                if col == "status" and val:
                    val = val.upper()
                sets.append(f"{col} = %s")
                params.append(val)

        if sets:
            params.append(expense_id)
            cursor.execute(
                f"UPDATE expenses SET {', '.join(sets)} WHERE id = %s",
                tuple(params),
            )

        # Update approvals if provided
        if "approvals" in kwargs:
            for approval in kwargs["approvals"]:
                cursor.execute(
                    """UPDATE expense_approvals
                       SET status = %s, comment = %s, action_timestamp = %s
                       WHERE expense_id = %s AND step = %s""",
                    (
                        approval["status"].upper(),
                        approval.get("comment"),
                        approval.get("timestamp") or (datetime.utcnow().isoformat() if approval["status"].lower() != "pending" else None),
                        expense_id,
                        approval["step"],
                    ),
                )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

    return get_expense_by_id(expense_id)


def get_pending_for_approver(approver_id, company_id):
    """Get all expenses pending approval for a specific approver."""
    rows = execute_query(
        """SELECT e.* FROM expenses e
           JOIN expense_approvals ea ON ea.expense_id = e.id
           WHERE e.company_id = %s
             AND e.status = 'PENDING'
             AND ea.approver_id = %s
             AND ea.status = 'PENDING'
             AND ea.step = e.current_approver_step
           ORDER BY e.created_at DESC""",
        (company_id, approver_id),
        fetchall=True,
    )
    return [_expense_row_to_dict(r) for r in rows]


def get_team_expenses(manager_id, company_id):
    """Get expenses from employees who report to this manager."""
    rows = execute_query(
        """SELECT e.* FROM expenses e
           JOIN users u ON u.id = e.employee_id
           WHERE e.company_id = %s AND u.manager_id = %s
           ORDER BY e.created_at DESC""",
        (company_id, manager_id),
        fetchall=True,
    )
    return [_expense_row_to_dict(r) for r in rows]
