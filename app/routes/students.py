# students.py
from flask import Blueprint, render_template
from flask_login import login_required

students_bp = Blueprint('students', __name__)

@students_bp.route('/students')
@login_required
def list():
    return render_template('students.html')