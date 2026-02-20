# app/routes/events.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app import db
from sqlalchemy import text

events_bp = Blueprint('events', __name__)

@events_bp.route('/events')
@login_required
def list():
    return render_template('events.html', is_events=True)