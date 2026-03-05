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

    try:
        limit = int(request.args.get('limit', 25))
    except ValueError:
        limit = 25
    limit = max(1, min(limit, 100))  # защита

    try:
        offset = int(request.args.get('offset', 0))
    except ValueError:
        offset = 0
    offset = max(0, offset)

    faculty_map = {
        "ФИБ": "FIB",
        "ФИТУ": "FITU",
        "ФКП": "FKP",
        "ФКСиС": "FKSiS",
        "ИЭФ": "IEF",
        "ФРЭ": "FRE"
    }

    reverse_map = {v: k for k, v in faculty_map.items()}

    query = """
        SELECT
            telegram_id,
            row_number() OVER (ORDER BY full_name ASC NULLS LAST, created_at ASC) AS num,
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

    query += " ORDER BY full_name ASC NULLS LAST, created_at ASC LIMIT :limit OFFSET :offset"
    params['limit'] = limit
    params['offset'] = offset

    try:
        result = db.session.execute(text(query), params).fetchall()

        students = []
        for row in result:
            student = row._asdict()
            student["faculty_code"] = student["faculty"]  # сохраняем оригинальный код
            student["faculty"] = reverse_map.get(student["faculty"], student["faculty"])
            students.append(student)

        verified_count = db.session.execute(
            text("SELECT COUNT(*) FROM users WHERE is_verified = true")
        ).scalar()

        has_more = len(students) == limit

        return jsonify({
            "students": students,
            "verified_count": verified_count,
            "has_more": has_more,
            "next_offset": offset + len(students)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@students_bp.route('/api/students/update', methods=['PATCH'])
@login_required
def update_student():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Нет данных"}), 400

    if not data or 'telegram_id' not in data:
        return jsonify({"error": "telegram_id обязателен"}), 400

    try:
        telegram_id = int(data["telegram_id"])
    except (ValueError, TypeError):
        return jsonify({"error": "telegram_id должен быть числом"}), 400


    faculty_map = {
        "ФИБ": "FIB",
        "ФИТУ": "FITU",
        "ФКП": "FKP",
        "ФКСиС": "FKSiS",
        "ИЭФ": "IEF",
        "ФРЭ": "FRE"
    }

    reverse_map = {v: k for k, v in faculty_map.items()}

    if not data or 'telegram_id' not in data:
        return jsonify({"error": "telegram_id обязателен"}), 400

    query = """
        UPDATE users
        SET 
            username = COALESCE(:username, username),
            full_name = COALESCE(:full_name, full_name),
            group_number = COALESCE(:group_number, group_number),
            stud_number = COALESCE(:stud_number, stud_number),
            faculty = COALESCE(:faculty, faculty),
            form_educ = COALESCE(:form_educ, form_educ),
            scholarship = COALESCE(:scholarship, scholarship),
            mobile_number = COALESCE(:mobile_number, mobile_number),
            updated_at = NOW()
        WHERE telegram_id = :telegram_id
        RETURNING telegram_id, username, full_name, group_number, stud_number, faculty, form_educ, scholarship, mobile_number, is_verified, created_at, updated_at
    """

    try:
        result = db.session.execute(text(query), {
            "telegram_id": data["telegram_id"],
            "username": data.get("username"),
            "full_name": data.get("full_name"),
            "group_number": data.get("group_number"),
            "stud_number": data.get("stud_number"),
            "faculty": data.get("faculty"),
            "form_educ": data.get("form_educ"),
            "scholarship": data.get("scholarship") == "true" if "scholarship" in data else None,
            "mobile_number": data.get("mobile_number"),
        }).fetchone()

        db.session.commit()

        if result:
            updated = dict(result._mapping)
            # Если нужно перевести faculty в название
            updated["faculty"] = reverse_map.get(updated["faculty"], updated["faculty"])
            return jsonify({
                "success": True, 
                "student": updated
            })
        else:
            return jsonify({"error": "Студент не найден"}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@students_bp.route('/api/students/<telegram_id>', methods=['DELETE'])
@login_required
def delete_student(telegram_id):

    try:
        telegram_id = int(telegram_id)  # ← принудительно в число
    except ValueError:
        return jsonify({"error": "telegram_id должен быть числом"}), 400

    try:
        db.session.execute(text("DELETE FROM users WHERE telegram_id = :telegram_id"), {"telegram_id": telegram_id})
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500