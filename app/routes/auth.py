# auth.py
from datetime import datetime, timedelta, timezone
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from app import db, mail
from werkzeug.security import generate_password_hash, check_password_hash, generate_password_hash, check_password_hash
from app.models import AdminUser, PendingRegistration
from app.forms import RegistrationForm, LoginForm, CodeConfirmForm  # добавим форму ниже
import random
import string

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = AdminUser.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard.index'))
        flash('Неверный email или пароль', 'danger')
    return render_template('auth/login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    form = RegistrationForm()
    if form.validate_on_submit():
        email = form.email.data

        # Проверяем, нет ли уже заявки или пользователя
        if AdminUser.query.filter_by(email=email).first():
            flash('Этот email уже зарегистрирован', 'danger')
            return redirect(url_for('auth.register'))

        if PendingRegistration.query.filter_by(email=email).first():
            flash('Код уже отправлен, проверьте почту', 'warning')
            return redirect(url_for('auth.confirm_code', email=email))

        # Генерируем код
        code = ''.join(random.choices(string.digits, k=6))

        # Хэшируем пароль заранее
        password_hash = generate_password_hash(form.password.data)

        # Сохраняем временную заявку
        pending = PendingRegistration(
            email=email,
            full_name=form.full_name.data,
            password_hash=password_hash,
            code=code
        )
        db.session.add(pending)
        db.session.commit()

        # Отправляем письмо
        msg = Message('Код подтверждения регистрации', recipients=[email])
        msg.body = f'Ваш код: {code}\n\nДействует 5 минут.'
        mail.send(msg)

        flash('Код отправлен на почту. Введите его для завершения регистрации.', 'success')
        return redirect(url_for('auth.confirm_code', email=email))

    return render_template('auth/register.html', form=form)

@auth_bp.route('/confirm/<email>', methods=['GET', 'POST'])
def confirm_code(email):
    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        flash('Заявка не найдена или истекла', 'danger')
        return redirect(url_for('auth.register'))

    current_time = datetime.now(timezone.utc)
    expires_time = pending.expires_at

    # Если дата в БД наивная — приводим её к UTC
    if expires_time.tzinfo is None:
        expires_time = expires_time.replace(tzinfo=timezone.utc)

    if current_time > expires_time:
        db.session.delete(pending)
        db.session.commit()
        flash('Код истёк. Зарегистрируйтесь заново.', 'danger')
        return redirect(url_for('auth.register'))

    form = CodeConfirmForm()
    if form.validate_on_submit():
        if form.code.data == pending.code:
            user = AdminUser(
                email=pending.email,
                full_name=pending.full_name,
                password_hash=pending.password_hash
            )
            db.session.add(user)
            db.session.delete(pending)
            db.session.commit()

            flash('Регистрация завершена! Теперь войдите.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Неверный код', 'danger')

    return render_template('auth/confirm_code.html', form=form, email=email)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/resend-code/<email>')
def resend_code(email):
    pending = PendingRegistration.query.filter_by(email=email).first()
    if pending:
        # Генерируем новый код
        code = ''.join(random.choices(string.digits, k=6))
        pending.code = code
        pending.expires_at = datetime.utcnow() + datetime.timedelta(minutes=5)
        db.session.commit()

        msg = Message('Новый код подтверждения', recipients=[email])
        msg.body = f'Ваш новый код: {code}\nДействует 5 минут.'
        mail.send(msg)

        flash('Новый код отправлен', 'success')
    else:
        flash('Заявка не найдена', 'danger')

    return redirect(url_for('auth.confirm_code', email=email))


@auth_bp.route('/test-mail')
def test_mail():
    try:
        msg = Message('Тест из Flask', recipients=['monitoringtechnicalsup@gmail.com'])
        msg.body = 'Это письмо из сайта Flask'
        mail.send(msg)
        return "Письмо отправлено успешно!"
    except Exception as e:
        return f"Ошибка: {str(e)}"