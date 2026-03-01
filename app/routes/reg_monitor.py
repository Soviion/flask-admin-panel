from flask import Blueprint, flash, redirect, render_template, jsonify, request, url_for
from flask_login import login_required, current_user
from app import db
from app.models import AdminUser
from sqlalchemy import text
from datetime import datetime

reg_monitor_bp = Blueprint('reg_monitor', __name__)

@reg_monitor_bp.route('/reg_monitor')
@login_required
def list():
    if current_user.email != 'alexeyyakovchik09@gmail.com':
        flash("Доступ запрещён", "danger")
        return redirect(url_for('dashboard.index'))

    admins = AdminUser.query.order_by(AdminUser.created_at.desc()).all()
    return render_template('reg_monitor.html', admins=admins, is_reg_monitor=True)


@reg_monitor_bp.route('/api/admin/<int:user_id>/toggle-active', methods=['PATCH'])
@login_required
def toggle_active(user_id):
    if current_user.email != 'alexeyyakovchik09@gmail.com':
        return jsonify({"success": False, "error": "Доступ запрещён"}), 403

    user = AdminUser.query.get_or_404(user_id)

    if user.id == current_user.id:
        return jsonify({"success": False, "error": "Нельзя отключить себя"}), 400

    user.is_active = not user.is_active
    db.session.commit()

    return jsonify({"success": True, "is_active": user.is_active})


@reg_monitor_bp.route('/api/admin/<int:user_id>', methods=['PATCH'])
@login_required
def update_admin(user_id):
    if current_user.email != 'alexeyyakovchik09@gmail.com':
        return jsonify({"success": False, "error": "Доступ запрещён"}), 403

    user = AdminUser.query.get_or_404(user_id)

    data = request.json
    if 'full_name' in data:
        user.full_name = data['full_name'].strip()

    db.session.commit()

    return jsonify({
        "success": True,
        "admin": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    })