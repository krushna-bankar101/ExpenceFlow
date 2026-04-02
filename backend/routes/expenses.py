import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models.expense import (
    get_expenses_by_company, get_expense_by_id, create_expense,
    update_expense, get_pending_for_approver, get_team_expenses,
)
from models.user import get_users_by_company, get_user_by_id
from models.approval_rule import get_rules_by_company, get_rule_by_id

from utils.currency import convert_currency

expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

"""
================================================================================
EXPENSE ROUTING MODULE
================================================================================
Handles the core logic for expense submittal, the hardcoded Manager -> Admin 
approval hierarchy, and the receipt attachment mechanics. 
Crafted with <3 for the Odoo Hackathon!
================================================================================
"""
def _get_company_id():
    claims = get_jwt()
    return claims.get("company_id")


@expenses_bp.route("", methods=["GET"])
@jwt_required()
def list_expenses():
    company_id = _get_company_id()
    user_id = get_jwt_identity()

    # Query params
    employee_id = request.args.get("employeeId")
    status = request.args.get("status")
    scope = request.args.get("scope")  # "mine", "pending", "team", "all"

    if scope == "mine":
        expenses = get_expenses_by_company(company_id, employee_id=user_id, status=status)
    elif scope == "pending":
        expenses = get_pending_for_approver(user_id, company_id)
    elif scope == "team":
        expenses = get_team_expenses(user_id, company_id)
    else:
        expenses = get_expenses_by_company(company_id, employee_id=employee_id, status=status)

    return jsonify(expenses), 200


@expenses_bp.route("/<expense_id>", methods=["GET"])
@jwt_required()
def get_single_expense(expense_id):
    expense = get_expense_by_id(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify(expense), 200


@expenses_bp.route("", methods=["POST"])
@jwt_required()
def submit_expense():
    company_id = _get_company_id()
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    title = data.get("title", "").strip()
    amount = data.get("amount")
    currency = data.get("currency", "USD")
    currency_symbol = data.get("currencySymbol", "$")
    category = data.get("category", "")
    description = data.get("description", "")
    date = data.get("date")
    receipt_data_url = data.get("receiptDataUrl")
    ocr_data = data.get("ocrData")

    if not all([title, amount, category, date]):
        return jsonify({"error": "Title, amount, category, and date are required"}), 400

    amount = float(amount)

    # Get company info for currency conversion
    from models.company import get_company_by_id
    company = get_company_by_id(company_id)
    company_currency = company["currency"] if company else "USD"

    amount_in_company_currency = convert_currency(amount, currency, company_currency)
    exchange_rate = amount_in_company_currency / amount if amount > 0 else 1.0

    # Get current user and all rules
    current_user = get_user_by_id(user_id)
    all_users = get_users_by_company(company_id)
    approvals = []
    step = 0

    # Step 1: Manager
    if current_user.get("managerId"):
        manager = next((u for u in all_users if u["id"] == current_user["managerId"]), None)
        if manager:
            approvals.append({
                "approverId": manager["id"],
                "approverName": manager["name"],
                "step": step,
                "status": "pending"
            })
            step += 1

    # Step 2: Admin
    admins = [u for u in all_users if u.get("role", "").lower() == "admin"]
    if admins:
        admin = admins[0]
        approvals.append({
            "approverId": admin["id"],
            "approverName": admin["name"],
            "step": step,
            "status": "pending"
        })
        step += 1

    status = "pending" if len(approvals) > 0 else "approved"

    expense = create_expense(
        employee_id=user_id,
        company_id=company_id,
        title=title,
        amount=amount,
        currency=currency,
        currency_symbol=currency_symbol,
        exchange_rate=exchange_rate,
        amount_in_company_currency=amount_in_company_currency,
        category=category,
        description=description,
        date=date,
        receipt_image_url=receipt_data_url,
        ocr_data=ocr_data,
        status=status,
        approval_rule_id=None,
        current_approver_step=0,
        approvals=approvals,
    )

    return jsonify(expense), 201


@expenses_bp.route("/<expense_id>/approve", methods=["PUT"])
@jwt_required()
def approve_expense(expense_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    comment = data.get("comment", "")

    expense = get_expense_by_id(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    if expense["status"] != "pending":
        return jsonify({"error": "Expense is not pending"}), 400

    step = expense["currentApproverStep"]
    approvals = expense["approvals"]

    # Mark current step as approved
    updated_approvals = []
    for i, a in enumerate(approvals):
        if i == step:
            updated_approvals.append({
                **a,
                "status": "approved",
                "comment": comment,
                "timestamp": datetime.utcnow().isoformat(),
            })
        else:
            updated_approvals.append(a)

    # Check for conditional auto-approve
    rule_id = expense.get("approvalRuleId")
    rule = get_rule_by_id(rule_id) if rule_id else None

    new_status = "pending"
    next_step = step + 1

    if rule:
        is_auto = check_conditional_auto_approve(updated_approvals, rule, user_id)
        if is_auto:
            new_status = "approved"
            # Mark remaining as skipped
            for i, a in enumerate(updated_approvals):
                if i > step and a["status"] == "pending":
                    updated_approvals[i] = {**a, "status": "skipped"}

    if new_status == "pending" and next_step >= len(updated_approvals):
        new_status = "approved"

    result = update_expense(
        expense_id,
        approvals=updated_approvals,
        currentApproverStep=next_step,
        status=new_status,
    )

    return jsonify(result), 200


@expenses_bp.route("/<expense_id>/reject", methods=["PUT"])
@jwt_required()
def reject_expense(expense_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    comment = data.get("comment", "")

    expense = get_expense_by_id(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    step = expense["currentApproverStep"]
    approvals = expense["approvals"]

    updated_approvals = []
    for i, a in enumerate(approvals):
        if i == step:
            updated_approvals.append({
                **a,
                "status": "rejected",
                "comment": comment,
                "timestamp": datetime.utcnow().isoformat(),
            })
        elif i > step:
            updated_approvals.append({**a, "status": "skipped"})
        else:
            updated_approvals.append(a)

    result = update_expense(
        expense_id,
        approvals=updated_approvals,
        status="rejected",
    )

    return jsonify(result), 200


@expenses_bp.route("/<expense_id>/admin-override", methods=["PUT"])
@jwt_required()
def admin_override(expense_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    action = data.get("action")  # "approve" or "reject"

    if action not in ("approve", "reject"):
        return jsonify({"error": "Action must be 'approve' or 'reject'"}), 400

    new_status = "approved" if action == "approve" else "rejected"

    result = update_expense(
        expense_id,
        status=new_status,
        adminOverrideBy=user_id,
    )

    return jsonify(result), 200


@expenses_bp.route("/upload-receipt", methods=["POST"])
@jwt_required()
def upload_receipt():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Save file
    upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    url = f"/api/uploads/{filename}"
    return jsonify({"url": url, "filename": filename}), 201


# Serve uploaded files
uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/uploads")


@uploads_bp.route("/<filename>", methods=["GET"])
def serve_upload(filename):
    upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
    return send_from_directory(upload_dir, filename)
