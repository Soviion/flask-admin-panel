# app/routes/events.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app import db
from sqlalchemy import text

system_monitor_bp = Blueprint('system_monitor', __name__)

@system_monitor_bp.route('/system_monitor')
@login_required
def list():
    return render_template('system_monitor.html', is_system_monitor=True)