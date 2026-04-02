from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import get_user_by_email, get_user_by_id, create_user, check_password
from models.company import create_company, get_company_by_id

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    company_name = data.get("companyName", "").strip()
    country = data.get("country", "")
    country_code = data.get("countryCode", "")
    currency = data.get("currency", "")
    currency_symbol = data.get("currencySymbol", "")
    currency_name = data.get("currencyName", "")

    if not all([name, email, password, company_name, country, currency]):
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check if email already exists
    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "An account with this email already exists"}), 409

    # Create company first (admin_id has no FK constraint)
    import uuid
    temp_admin_id = str(uuid.uuid4())

    company = create_company(
        name=company_name,
        country=country,
        country_code=country_code,
        currency=currency,
        currency_symbol=currency_symbol,
        currency_name=currency_name,
        admin_id=temp_admin_id,
    )

    # Create user with real company_id
    user = create_user(
        company_id=company["id"],
        email=email,
        password=password,
        name=name,
        role="ADMIN",
    )

    # Update company with real admin_id
    from db import execute_query
    execute_query(
        "UPDATE companies SET admin_id = %s WHERE id = %s",
        (user["id"], company["id"]),
        commit=True,
    )
    company = get_company_by_id(company["id"])

    # Generate JWT
    token = create_access_token(
        identity=user["id"],
        additional_claims={"company_id": company["id"], "role": user["role"]},
    )

    return jsonify({
        "token": token,
        "user": user,
        "company": company,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Get raw user row (includes password_hash)
    user_row = get_user_by_email(email)
    if not user_row:
        return jsonify({"error": "No account found with this email"}), 401

    if not user_row.get("is_active", True):
        return jsonify({"error": "Account is inactive. Contact admin."}), 403

    if not check_password(password, user_row["password_hash"]):
        return jsonify({"error": "Incorrect password"}), 401

    user = get_user_by_id(user_row["id"])
    company = get_company_by_id(user_row["company_id"])

    token = create_access_token(
        identity=user["id"],
        additional_claims={"company_id": user["companyId"], "role": user["role"]},
    )

    return jsonify({
        "token": token,
        "user": user,
        "company": company,
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    company = get_company_by_id(user["companyId"])
    return jsonify({"user": user, "company": company}), 200
