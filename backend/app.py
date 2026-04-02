import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

"""
================================================================================
ExpenseFlow Backend API
================================================================================
A Flask-based REST API built for the Odoo Hackathon.
This serves as the core backend for the Expense Management System.
================================================================================
"""

def create_app():
    app = Flask(__name__)


    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES
    app.config["UPLOAD_FOLDER"] = Config.UPLOAD_FOLDER


    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)


    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)


    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.expenses import expenses_bp, uploads_bp
    from routes.approval_rules import approval_rules_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(uploads_bp)
    app.register_blueprint(approval_rules_bp)

    # Root route — shows API info page in browser
    @app.route("/", methods=["GET"])
    def index():
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>ExpenseFlow API</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #e0e0e0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 48px; max-width: 520px; width: 90%; text-align: center; }
                h1 { font-size: 28px; margin-bottom: 8px; background: linear-gradient(90deg, #e94560, #ff6b9d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .badge { display: inline-block; background: #059669; color: white; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 12px 0 24px; }
                p { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
                .endpoints { text-align: left; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; font-size: 13px; }
                .endpoints h3 { color: #e94560; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
                .ep { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .ep:last-child { border: none; }
                .method { color: #059669; font-weight: 600; font-family: monospace; }
                .path { color: #93c5fd; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>⚡ ExpenseFlow API</h1>
                <div class="badge">● Server Running</div>
                <p>The backend API is running. Connect your frontend to this server or use the endpoints below.</p>
                <div class="endpoints">
                    <h3>API Endpoints</h3>
                    <div class="ep"><span class="method">GET</span><span class="path">/api/health</span></div>
                    <div class="ep"><span class="method">POST</span><span class="path">/api/auth/signup</span></div>
                    <div class="ep"><span class="method">POST</span><span class="path">/api/auth/login</span></div>
                    <div class="ep"><span class="method">GET</span><span class="path">/api/auth/me</span></div>
                    <div class="ep"><span class="method">GET/POST</span><span class="path">/api/users</span></div>
                    <div class="ep"><span class="method">GET/POST</span><span class="path">/api/expenses</span></div>
                    <div class="ep"><span class="method">GET/POST</span><span class="path">/api/approval-rules</span></div>
                </div>
            </div>
        </body>
        </html>
        """

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "service": "ExpenseFlow API"}

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 50)
    print("  ExpenseFlow API Server")
    print("  http://localhost:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
