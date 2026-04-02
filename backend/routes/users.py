from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models.user import (
    get_users_by_company, get_user_by_id, get_user_by_email,
    create_user, update_user, delete_user,
)

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


def _get_company_id():
    claims = get_jwt()
    return claims.get("company_id")


@users_bp.route("", methods=["GET"])
@jwt_required()
def list_users():
    company_id = _get_company_id()
    users = get_users_by_company(company_id)
    return jsonify(users), 200


@users_bp.route("/<user_id>", methods=["GET"])
@jwt_required()
def get_single_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200


@users_bp.route("", methods=["POST"])
@jwt_required()
def create_new_user():
    company_id = _get_company_id()
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = data.get("role", "employee")
    manager_id = data.get("managerId") or None
    department = data.get("department") or None

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "A user with this email already exists"}), 409

    user = create_user(
        company_id=company_id,
        email=email,
        password=password,
        name=name,
        role=role,
        manager_id=manager_id,
        department=department,
    )

    return jsonify({"success": True, "user": user}), 201


@users_bp.route("/<user_id>", methods=["PUT"])
@jwt_required()
def update_existing_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    user = update_user(user_id, **data)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user), 200


@users_bp.route("/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_existing_user(user_id):
    delete_user(user_id)
    return jsonify({"success": True}), 200
