CREATE DATABASE IF NOT EXISTS odoo_hack;
USE odoo_hack;

-- 1. Create Companies Table
CREATE TABLE companies (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10),
    currency VARCHAR(10) NOT NULL,
    currency_symbol VARCHAR(10),
    currency_name VARCHAR(100),
    admin_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Users Table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'EMPLOYEE') DEFAULT 'EMPLOYEE',
    manager_id CHAR(36) NULL,
    department VARCHAR(100),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create Approval Rules Table
CREATE TABLE approval_rules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_manager_approver_first BOOLEAN DEFAULT FALSE,
    min_amount DECIMAL(12, 2),
    max_amount DECIMAL(12, 2),
    categories JSON, -- Used JSON to store an array of category strings
    conditional_type ENUM('PERCENTAGE', 'SPECIFIC', 'HYBRID'),
    conditional_percentage INT,
    specific_approver_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (specific_approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Create Approval Rule Steps Table
CREATE TABLE approval_rule_steps (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    rule_id CHAR(36) NOT NULL,
    step_order INT NOT NULL,
    user_id CHAR(36) NOT NULL,
    UNIQUE(rule_id, step_order),
    FOREIGN KEY (rule_id) REFERENCES approval_rules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Create Expenses Table
CREATE TABLE expenses (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    currency_symbol VARCHAR(10),
    exchange_rate DECIMAL(10, 6),
    amount_in_company_currency DECIMAL(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    receipt_image_url VARCHAR(255),
    ocr_data JSON, -- Native JSON support for Tesseract output
    status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approval_rule_id CHAR(36) NULL,
    current_approver_step INT DEFAULT 0,
    admin_override_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (approval_rule_id) REFERENCES approval_rules(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_override_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Create Expense Approvals Table (The Workflow Log)
CREATE TABLE expense_approvals (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    expense_id CHAR(36) NOT NULL,
    approver_id CHAR(36) NOT NULL,
    step INT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED') DEFAULT 'PENDING',
    comment TEXT,
    action_timestamp TIMESTAMP NULL,
    UNIQUE(expense_id, step),
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
);
