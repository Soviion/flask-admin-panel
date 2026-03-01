# app/routes/auth.py
from datetime import datetime, timedelta, timezone
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from app import db, mail
from werkzeug.security import generate_password_hash
from app.models import AdminUser, PendingRegistration, PendingEmailChange, PendingPasswordChange
import random
import string

auth_bp = Blueprint('auth', __name__)


def _wants_json():
    return request.headers.get('X-Requested-With') == 'XMLHttpRequest'


def _respond(message, category="success", redirect_url=None, success=True, extra=None, status=200):
    if _wants_json():
        payload = {"success": success, "message": message}
        if extra:
            payload.update(extra)
        return jsonify(payload), status

    if message:
        flash(message, category)
    return redirect(redirect_url or request.referrer or url_for('dashboard.index'))


def _is_dev_mode():
    return bool(current_app.debug or current_app.testing)


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
                if not user.is_active:
                    flash('Доступ запрещен.', 'error')
                    return render_template('auth/login.html')
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

        if not email or not full_name or not password or not password2:
            flash("Заполните все поля", "danger")
            return redirect(url_for('auth.register'))

        if password != password2:
            flash("Пароли не совпадают", "danger")
            return redirect(url_for('auth.register'))

        if AdminUser.query.filter_by(email=email).first():
            flash("Email уже зарегистрирован", "danger")
            return redirect(url_for('auth.register'))

        # Удаляем старую заявку
        old = PendingRegistration.query.filter_by(email=email).first()
        if old:
            db.session.delete(old)
            db.session.commit()

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

        try:
            msg = Message(
                subject='Код подтверждения',
                recipients=[email]
            )
            msg.body = f"Ваш код подтверждения: {code}\nКод действует 5 минут."

            mail.send(msg)
            flash("Код отправлен на почту. Проверьте папку «Спам», если не пришёл", "success")
            return redirect(url_for('auth.confirm_code', email=email))

        except Exception as e:
            db.session.delete(pending)
            db.session.commit()
            flash(f"Ошибка отправки почты: {str(e)}", "danger")
            return redirect(url_for('auth.register'))

    return render_template('auth/register.html')


# ================= CONFIRM =================
@auth_bp.route('/confirm/<email>', methods=['GET', 'POST'])
def confirm_code(email):
    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        flash("Заявка не найдена или уже обработана", "danger")
        return redirect(url_for('auth.register'))

    # РџСЂРёРІРѕРґРёРј expires_at Рє aware UTC
    expires_at = pending.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    current_time = datetime.now(timezone.utc)

    if current_time > expires_at:
        db.session.delete(pending)
        db.session.commit()
        flash("Код истёк. Пройдите регистрацию заново", "danger")
        return redirect(url_for('auth.register'))

    if request.method == 'POST':
        code_input = request.form.get('code', '').strip()

        if not code_input:
            flash("Введите код", "danger")
        elif code_input == pending.code:
            user = AdminUser(
                email=pending.email,
                full_name=pending.full_name,
                password_hash=pending.password_hash
            )

            db.session.add(user)
            db.session.delete(pending)
            db.session.commit()

            flash("Регистрация успешно завершена! Теперь можете войти", "success")
            return redirect(url_for('auth.login'))
        else:
            flash("Неверный код. Попробуйте снова", "danger")

    return render_template('auth/confirm_code.html', email=email)


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.', 'info')
    return redirect(url_for('auth.login'))


# ================= PROFILE =================
@auth_bp.route('/profile/update-name', methods=['POST'])
@login_required
def update_profile_name():
    full_name = request.form.get('full_name', '').strip()
    if not full_name:
        return _respond('ФИО обязательно для заполнения.', 'error', success=False, status=400)

    current_user.full_name = full_name
    db.session.commit()
    return _respond('ФИО обновлено.', 'success')


@auth_bp.route('/profile/email/request-code', methods=['POST'])
@login_required
def request_email_change_code():
    new_email = request.form.get('new_email', '').strip().lower()
    current_password = request.form.get('current_password', '')

    if not new_email or not current_password:
        return _respond('Укажите новый email и текущий пароль.', 'error', success=False, status=400)

    if not current_user.check_password(current_password):
        return _respond('Неверный текущий пароль.', 'error', success=False, status=400)

    if AdminUser.query.filter_by(email=new_email).first():
        return _respond('Этот email уже используется.', 'error', success=False, status=400)

    PendingEmailChange.query.filter_by(user_id=current_user.id).delete()
    code = ''.join(random.choices(string.digits, k=6))

    pending = PendingEmailChange(
        user_id=current_user.id,
        new_email=new_email,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5)
    )
    db.session.add(pending)
    db.session.commit()

    try:
        msg = Message(
            subject='Код подтверждения почты',
            recipients=[new_email]
        )
        msg.body = f"Ваш код подтверждения: {code}\nКод действует 5 минут."
        mail.send(msg)
        return _respond('Код подтверждения отправлен на новый email.', 'success', extra={"next": "code"})
    except Exception:
        current_app.logger.exception('Failed to send email change code')
        if _is_dev_mode():
            return _respond(
                f'SMTP недоступен. Тестовый код: {code}',
                'warning',
                success=True,
                extra={"next": "code", "dev_fallback": True}
            )

        PendingEmailChange.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return _respond('Не удалось отправить письмо. Попробуйте позже.', 'error', success=False, status=502)


@auth_bp.route('/profile/email/confirm', methods=['POST'])
@login_required
def confirm_email_change():
    code_input = request.form.get('code', '').strip()
    pending = PendingEmailChange.query.filter_by(user_id=current_user.id).first()

    if not pending:
        return _respond('Нет активного запроса на смену почты.', 'error', success=False, status=400)

    expires_at = pending.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        db.session.delete(pending)
        db.session.commit()
        return _respond('Код истёк. Запросите новый.', 'error', success=False, status=400)

    if not code_input or code_input != pending.code:
        return _respond('Неверный код подтверждения.', 'error', success=False, status=400)

    current_user.email = pending.new_email
    db.session.delete(pending)
    db.session.commit()
    return _respond('Почта обновлена. Сейчас выйдем из аккаунта.', 'success', extra={"logout": True})


@auth_bp.route('/profile/password/request-code', methods=['POST'])
@login_required
def request_password_change_code():
    current_password = request.form.get('current_password', '')
    new_password = request.form.get('new_password', '')
    new_password2 = request.form.get('new_password2', '')

    if not current_password or not new_password or not new_password2:
        return _respond('Заполните все поля пароля.', 'error', success=False, status=400)

    if not current_user.check_password(current_password):
        return _respond('Неверный текущий пароль.', 'error', success=False, status=400)

    if new_password != new_password2:
        return _respond('Новые пароли не совпадают.', 'error', success=False, status=400)

    PendingPasswordChange.query.filter_by(user_id=current_user.id).delete()
    code = ''.join(random.choices(string.digits, k=6))

    pending = PendingPasswordChange(
        user_id=current_user.id,
        new_password_hash=generate_password_hash(new_password),
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5)
    )
    db.session.add(pending)
    db.session.commit()

    try:
        msg = Message(
            subject='Код подтверждения смены пароля',
            recipients=[current_user.email]
        )
        msg.body = f"Ваш код подтверждения: {code}\nКод действует 5 минут."
        mail.send(msg)
        return _respond('Код подтверждения отправлен на вашу почту.', 'success', extra={"next": "code"})
    except Exception:
        current_app.logger.exception('Failed to send password change code')
        if _is_dev_mode():
            return _respond(
                f'SMTP недоступен. Тестовый код: {code}',
                'warning',
                success=True,
                extra={"next": "code", "dev_fallback": True}
            )

        PendingPasswordChange.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        return _respond('Не удалось отправить письмо. Попробуйте позже.', 'error', success=False, status=502)


@auth_bp.route('/profile/password/confirm', methods=['POST'])
@login_required
def confirm_password_change():
    code_input = request.form.get('code', '').strip()
    pending = PendingPasswordChange.query.filter_by(user_id=current_user.id).first()

    if not pending:
        return _respond('Нет активного запроса на смену пароля.', 'error', success=False, status=400)

    expires_at = pending.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        db.session.delete(pending)
        db.session.commit()
        return _respond('Код истёк. Запросите новый.', 'error', success=False, status=400)

    if not code_input or code_input != pending.code:
        return _respond('Неверный код подтверждения.', 'error', success=False, status=400)

    current_user.password_hash = pending.new_password_hash
    db.session.delete(pending)
    db.session.commit()
    return _respond('Пароль обновлён. Сейчас выйдем из аккаунта.', 'success', extra={"logout": True})

