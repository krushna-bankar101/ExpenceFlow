import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    # MySQL
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "odoo_hack")

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Uploads
    UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        os.getenv("UPLOAD_FOLDER", "uploads"),
    )
