"""
Create demo users for testing the Reimbursement Management System
Run: python backend/create_demo_users.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from models.user import create_user
from models.company import create_company, get_company_by_name
from db import execute_query
from werkzeug.security import generate_password_hash

def create_demo_data():
    print("Creating demo data...\n")
    
    # Check if demo company exists
    company = get_company_by_name("Demo Corporation")
    
    if not company:
        # Create demo company
        company = create_company(
            name="Demo Corporation",
            country="United States",
            country_code="US",
            currency="USD",
            currency_symbol="$",
            currency_name="US Dollar",
            admin_id="temp"
        )
        print("✓ Demo company created")
    else:
        print("✓ Demo company already exists")
    
    company_id = company["id"]
    
    # Create demo users
    demo_users = [
        {"email": "admin@demo.com", "name": "Admin User", "role": "ADMIN"},
        {"email": "manager@demo.com", "name": "John Manager", "role": "MANAGER"},
        {"email": "employee@demo.com", "name": "Jane Employee", "role": "EMPLOYEE"},
        {"email": "finance@demo.com", "name": "Finance Manager", "role": "MANAGER"}
    ]
    
    user_ids = []
    for user_data in demo_users:
        # Check if user exists
        existing = execute_query(
            "SELECT id FROM users WHERE email = %s",
            (user_data["email"],),
            fetchone=True
        )
        
        if not existing:
            user = create_user(
                company_id=company_id,
                email=user_data["email"],
                password="demo123",
                name=user_data["name"],
                role=user_data["role"]
            )
            user_ids.append(user["id"])
            print(f"✓ Created user: {user_data['email']}")
        else:
            user_ids.append(existing["id"])
            print(f"✓ User already exists: {user_data['email']}")
    
    # Update company admin_id
    execute_query(
        "UPDATE companies SET admin_id = %s WHERE id = %s",
        (user_ids[0], company_id),
        commit=True
    )
    
    # Set manager relationships
    execute_query(
        "UPDATE users SET manager_id = %s, is_manager_approver = 1 WHERE email = %s",
        (user_ids[1], "employee@demo.com"),
        commit=True
    )
    
    print("\n✅ Demo users created successfully!\n")
    print("Demo Credentials:")
    print("─────────────────────────────────────")
    print("Admin:    admin@demo.com / demo123")
    print("Manager:  manager@demo.com / demo123")
    print("Employee: employee@demo.com / demo123")
    print("Finance:  finance@demo.com / demo123")
    print("─────────────────────────────────────\n")

if __name__ == "__main__":
    try:
        create_demo_data()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
