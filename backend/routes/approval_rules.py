from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models.approval_rule import (
    get_rules_by_company, get_rule_by_id,
    create_rule, update_rule, delete_rule,
)

approval_rules_bp = Blueprint("approval_rules", __name__, url_prefix="/api/approval-rules")


def _get_company_id():
    claims = get_jwt()
    return claims.get("company_id")


@approval_rules_bp.route("", methods=["GET"])
@jwt_required()
def list_rules():
    company_id = _get_company_id()
    rules = get_rules_by_company(company_id)
    return jsonify(rules), 200


@approval_rules_bp.route("/<rule_id>", methods=["GET"])
@jwt_required()
def get_single_rule(rule_id):
    rule = get_rule_by_id(rule_id)
    if not rule:
        return jsonify({"error": "Rule not found"}), 404
    return jsonify(rule), 200


@approval_rules_bp.route("", methods=["POST"])
@jwt_required()
def create_new_rule():
    company_id = _get_company_id()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Rule name is required"}), 400

    rule = create_rule(
        company_id=company_id,
        name=name,
        description=data.get("description"),
        is_active=data.get("isActive", True),
        is_manager_approver_first=data.get("isManagerApproverFirst", False),
        approvers=data.get("approvers", []),
        conditional_rule=data.get("conditionalRule"),
        min_amount=data.get("minAmount"),
        max_amount=data.get("maxAmount"),
        categories=data.get("categories", []),
    )

    return jsonify(rule), 201


@approval_rules_bp.route("/<rule_id>", methods=["PUT"])
@jwt_required()
def update_existing_rule(rule_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    rule = update_rule(rule_id, **data)
    if not rule:
        return jsonify({"error": "Rule not found"}), 404

    return jsonify(rule), 200


@approval_rules_bp.route("/<rule_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_rule(rule_id):
    delete_rule(rule_id)
    return jsonify({"success": True}), 200
