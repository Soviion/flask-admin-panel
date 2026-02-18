# app/routes/students.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from app import db
from sqlalchemy import text

students_bp = Blueprint('students', __name__)

@students_bp.route('/students')
@login_required
def list():
    return render_template('students.html', is_students=True)

@students_bp.route('/api/students')
@login_required
def api_students():
    search_fio = request.args.get('fio', '').strip()
    search_group = request.args.get('group', '').strip()
    search_studn = request.args.get('studn', '').strip()
    search_faculty = request.args.get('faculty', '').strip()
    search_form = request.args.get('form', '').strip()
    search_phone = request.args.get('phone', '').strip()
    search_scholarship = request.args.get('scholarship', '').strip()
    show_unverified = request.args.get('show_unverified', 'false').lower() == 'true'

    faculty_map = {
        "ФИБ": "FIB",
        "ФИТУ": "FITU",
        "ФКП": "FKP",
        "ФКСиС": "FKSiS",
        "ИЭФ": "IEF",
        "ФРЭ": "FRE"
    }

    query = """
        SELECT 
            row_number() OVER (ORDER BY created_at ASC) AS num,
            username,
            full_name,
            group_number,
            stud_number,
            faculty,
            form_educ,
            scholarship,
            mobile_number,
            is_verified,
            created_at,
            updated_at
        FROM users
        WHERE 1=1
    """

    params = {}

    if search_fio:
        query += " AND full_name ILIKE :fio"
        params['fio'] = f"%{search_fio}%"

    if search_group:
        query += " AND group_number ILIKE :group"
        params['group'] = f"%{search_group}%"

    if search_studn:
        query += " AND stud_number ILIKE :studn"
        params['studn'] = f"%{search_studn}%"

    if search_faculty and search_faculty in faculty_map:
        query += " AND faculty = :faculty"
        params['faculty'] = faculty_map[search_faculty]

    if search_form:
        query += " AND form_educ ILIKE :form"
        params['form'] = f"%{search_form}%"

    if search_phone:
        query += " AND mobile_number ILIKE :phone"
        params['phone'] = f"%{search_phone}%"

    if search_scholarship == "yes":
        query += " AND scholarship = true"
    elif search_scholarship == "no":
        query += " AND scholarship = false"

    if not show_unverified:
        query += " AND is_verified = true"

    query += " LIMIT 200"

    try:
        result = db.session.execute(text(query), params).fetchall()

        reverse_map = {v: k for k, v in faculty_map.items()}

        students = []
        for row in result:
            student = row._asdict()
            student["faculty"] = reverse_map.get(student["faculty"], student["faculty"])
            students.append(student)

        verified_count = db.session.execute(
            text("SELECT COUNT(*) FROM users WHERE is_verified = true")
        ).scalar()

        return jsonify({
            "students": students,
            "verified_count": verified_count
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@students_bp.route('/api/students/update', methods=['POST'])
@login_required
def update_student():
    data = request.json

    query = """
        UPDATE users
        SET 
            username = :username,
            full_name = :full_name,
            group_number = :group_number,
            search_studn = :search_studn,
            faculty = :faculty,
            form_educ = :form_educ,
            scholarship = :scholarship,
            mobile_number = :mobile_number,
            updated_at = NOW()
        WHERE telegram_id = :telegram_id
    """

    db.session.execute(text(query), {
        "telegram_id": data["telegram_id"],
        "username": data["username"],
        "full_name": data["full_name"],
        "group_number": data["group_number"],
        "search_studn": data["search_studn"],
        "faculty": data["faculty"],
        "form_educ": data["form_educ"],
        "scholarship": data["scholarship"] == "true",
        "mobile_number": data["mobile_number"],
    })

    db.session.commit()

    return jsonify({"success": True})
