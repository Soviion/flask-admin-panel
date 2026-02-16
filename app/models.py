# app/models.py
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash, generate_password_hash, check_password_hash
from app import db
from datetime import datetime, timedelta, timezone

class AdminUser(db.Model, UserMixin):
    __tablename__ = 'admin_users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)  # ← теперь работает

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)  # ← тоже работает

    def __repr__(self):
        return f'<AdminUser {self.email}>'
    
class PendingRegistration(db.Model):
    __tablename__ = 'pending_registrations'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(100))
    password_hash = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    
    # Добавляем timezone=True — даты будут осведомлёнными (UTC)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(minutes=5))

    def __repr__(self):
        return f'<Pending {self.email}>'