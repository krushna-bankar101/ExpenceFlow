# 🚀 ExpenseFlow
**A Next-Generation Reimbursement & Expense Management Platform** *Built for the Odoo Hackathon*

---

## 💡 The Problem
In many organizations, expense reimbursement is a broken, frustrating process. Employees struggle with manual data entry and lost paper receipts. Managers waste time chasing down context in endless email threads. Finance teams lack real-time visibility and are burdened by inflexible, manual approval hierarchies.

## 🎯 The Solution
**ExpenseFlow** transforms the chaotic expense management lifecycle into a streamlined, automated, and transparent experience. By combining **Smart Receipt Parsing (OCR)**, a **Dynamic Multi-Tier Workflow Engine**, and **Role-Based Dashboards**, ExpenseFlow ensures that employees get reimbursed faster while giving administrators complete control over financial compliance.

---

## ✨ Key Features & Capabilities

### 👥 Role-Based Portals
ExpenseFlow delivers a customized experience based on user roles (Authentication secured via JWT):
* **Employee (The Submitter):** A clean, intuitive dashboard to submit expenses, drag-and-drop receipts, and track approval status in real-time.
* **Manager (The Reviewer):** A centralized team view to quickly review pending requests, inspect attached receipts, and approve or reject with mandatory feedback.
* **Admin / Finance (The Controller):** A comprehensive overview of all company expenses, data visualizations of spending trends, and the ability to define complex system rules.

### 🧠 The Workflow Engine (Core Innovation)
The backbone of ExpenseFlow is a highly configurable approval engine designed to handle real-world corporate hierarchies:
* **Sequential Approvals:** Strict, multi-step chains (e.g., Manager -> Finance -> Director).
* **Conditional Logic:** Configurable rules such as threshold limits (e.g., "Expenses over $500 require CFO approval") or percentage-based consensus.
* **Automated Escalation & Skipping:** If a high-level override occurs, the system intelligently marks lower-level pending approvals as resolved/skipped.

### 🧾 Smart Receipt Processing
* **Client-Side OCR Integration:** Utilizing Tesseract.js, the platform can scan uploaded receipt images to automatically extract merchant names, dates, and amounts, dramatically reducing manual data entry for employees.
* **Inline Document Viewer:** Native support for both images (JPG/PNG) and PDFs, allowing managers to verify expenses without downloading files.

### 💬 Transparent Communication
* **Automated Rejection Context:** When a claim is rejected, the workflow halts and requires the approver to provide a specific reason. This feedback is instantly highlighted in red on the employee's dashboard, eliminating the "black box" of expense processing.

---

## 🛠 Technical Architecture & Stack

ExpenseFlow is built using a modern, decoupled Full-Stack architecture.

**Frontend (Client-Side)**
* **Framework:** React 18 powered by Vite for lightning-fast HMR and optimized builds.
* **Language:** TypeScript for type safety and predictable state management.
* **Styling:** Tailwind CSS integrated with Radix UI primitives for a highly accessible, glassmorphic, and responsive user interface.
* **Data Visualization:** Recharts for dynamic administrative dashboards.
* **Utility Tools:** React Router (Routing), Sonner (Toast notifications), Tesseract.js (OCR).

**Backend (REST API)**
* **Framework:** Python / Flask (Lightweight and highly modular via Blueprints).
* **Authentication:** Flask-JWT-Extended for secure, stateless user sessions.
* **Database Driver:** PyMySQL for direct, efficient database queries.

**Database (Storage Layer)**
* **RDBMS:** MySQL
* **Design:** A robust, fully normalized relational schema encompassing Users, Companies, Expenses, Approval Rules, and a granular Expense_Approvals workflow log.

---

## 🏁 Getting Started (Local Development)

Follow these instructions to run the ExpenseFlow environment on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/downloads/) (v3.10+)
* MySQL Server (v8.0+)

### 2. Database Configuration
1. Open your local MySQL instance and execute: `CREATE DATABASE odoo_hack;`
2. Locate the `database_schema.sql` file in the root directory and execute it against your new database to generate the tables.
3. Navigate to the `backend/` directory and duplicate `.env.example`. Rename it to `.env` and update it with your local MySQL credentials and a secure JWT secret.

### 3. Initialize the Flask Backend
Open a terminal, navigate to the `backend` directory, and start the API:

    cd backend
    pip install -r requirements.txt
    python app.py

*The REST API will launch on `http://localhost:5000`*

### 4. Initialize the React Frontend
Open a **new** terminal window, navigate to the `frontend` directory, and spin up the Vite development server:

    cd frontend
    npm install
    npm run dev

*The client application will be available at `http://localhost:5173`. Open this URL in your browser to begin testing.*

---

## 🚀 Future Roadmap
* **Mobile App:** A React Native companion app for snapping receipts on the go.
* **Accounting Integrations:** Webhooks to export approved expenses directly into enterprise accounting software (like Odoo ERP, QuickBooks, or Xero).
* **AI Fraud Detection:** Machine learning algorithms to flag duplicate receipts or anomalies in spending patterns.

---
*Developed with ❤️ for the Odoo Hackathon.*
