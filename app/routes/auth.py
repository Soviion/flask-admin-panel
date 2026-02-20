# app/routes/auth.py
from datetime import datetime, timedelta, timezone
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from app import db, mail
from werkzeug.security import generate_password_hash
from app.models import AdminUser, PendingRegistration
import random
import string

auth_bp = Blueprint('auth', __name__)


# ================= LOGIN =================
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    errors = []
    email = request.form.get('email', '').strip().lower()
    password = request.form.get('password', '')

    if request.method == 'POST':
        if not email or not password:
            errors.append("Заполните все поля")

        if not errors:
            user = AdminUser.query.filter_by(email=email).first()
            if user and user.check_password(password):
                login_user(user)
                flash('Успешный вход!', 'success')
                return redirect(url_for('dashboard.index'))
            else:
                flash('Неверный email или пароль!', 'error')

    return render_template('auth/login.html')


# ================= REGISTER =================
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        full_name = request.form.get('full_name', '').strip()
        password = request.form.get('password')
        password2 = request.form.get('password2')

        # Проверки
        if not email or not full_name or not password or not password2:
            flash("Заполните все поля", "danger")
            return redirect(url_for('auth.register'))

        if password != password2:
            flash("Пароли не совпадают", "danger")
            return redirect(url_for('auth.register'))

        if AdminUser.query.filter_by(email=email).first():
            flash("Email уже зарегистрирован", "danger")
            return redirect(url_for('auth.register'))

        # Удаляем старую заявку (если есть)
        old = PendingRegistration.query.filter_by(email=email).first()
        if old:
            db.session.delete(old)
            db.session.commit()

        # Генерируем код
        code = ''.join(random.choices(string.digits, k=6))

        pending = PendingRegistration(
            email=email,
            full_name=full_name,
            password_hash=generate_password_hash(password),
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5)
        )

        db.session.add(pending)
        db.session.commit()

        # Отправляем письмо
        try:
            msg = Message(
                subject='Код подтверждения',
                recipients=[email]
            )
            msg.body = f"Ваш код подтверждения: {code}\nКод действует 5 минут."

            mail.send(msg)

            flash("Код отправлен на почту", "success")
            return redirect(url_for('auth.confirm_code', email=email))

        except Exception as e:
            db.session.delete(pending)
            db.session.commit()
            flash(f"Ошибка отправки почты: {e}", "danger")
            return redirect(url_for('auth.register'))

    return render_template('auth/register.html')


# ================= CONFIRM =================
@auth_bp.route('/confirm/<email>', methods=['GET', 'POST'])
def confirm_code(email):
    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        flash("Заявка не найдена", "danger")
        return redirect(url_for('auth.register'))

    # Приводим expires_at к aware UTC (если она naive)
    expires_at = pending.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    current_time = datetime.now(timezone.utc)

    if current_time > expires_at:
        db.session.delete(pending)
        db.session.commit()
        flash("Код истёк", "danger")
        return redirect(url_for('auth.register'))

    if request.method == 'POST':
        code_input = request.form.get('code')

        if code_input == pending.code:
            user = AdminUser(
                email=pending.email,
                full_name=pending.full_name,
                password_hash=pending.password_hash
            )

            db.session.add(user)
            db.session.delete(pending)
            db.session.commit()

            flash("Регистрация завершена", "success")
            return redirect(url_for('auth.login'))
        else:
            flash("Неверный код", "danger")

    return render_template('auth/confirm_code.html', email=email)


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.', 'info')
    print("[DEBUG] Flash создана: 'Вы вышли из системы.'")
    return redirect(url_for('auth.login'))
