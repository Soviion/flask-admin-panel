// students.js
document.addEventListener('DOMContentLoaded', () => {
    // ────────────────────────────────────────────────
    // Константы и элементы DOM
    // ────────────────────────────────────────────────
    const tableBody       = document.getElementById('students-table-body');
    const verifiedCountEl = document.getElementById('verified-count');
    const searchBtn       = document.getElementById('search-btn');
    const cancelBtn       = document.getElementById('cancel-btn');
    const showUnverified  = document.getElementById('show-unverified');
    const toggleAdvanced  = document.getElementById('toggle-advanced');
    const advancedFilters = document.getElementById('advanced-filters');


    // ────────────────────────────────────────────────
    // Основная функция загрузки таблицы
    // ────────────────────────────────────────────────
    function loadStudents() {
        const params = new URLSearchParams({
            fio:          document.getElementById('fio').value.trim(),
            group:        document.getElementById('group').value.trim(),
            faculty:      document.getElementById('faculty').value.trim(),
            form:         document.getElementById('form')?.value.trim() || '',
            phone:        document.getElementById('phone')?.value.trim() || '',
            scholarship:  document.getElementById('scholarship')?.value || '',
            show_unverified: showUnverified.checked
        });

        fetch(`/api/students?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    tableBody.innerHTML = `<tr><td colspan="12" class="text-red-500 text-center py-10">${data.error}</td></tr>`;
                    return;
                }

                // Очищаем tbody
                while (tableBody.firstChild) {
                    tableBody.removeChild(tableBody.firstChild);
                }

                if (data.students.length === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.innerHTML = `
                        <td colspan="12" class="px-3 py-10 text-center text-gray-500 italic">
                            Нет данных
                        </td>`;
                    tableBody.appendChild(emptyRow);
                } else {
                    data.students.forEach((student, index) => {
                        const row = document.createElement('tr');
                        row.className = 'hover:bg-gray-800/50 transition';
                        row.innerHTML = `
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.num}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.username || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.full_name || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.group_number || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.stud_number || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.faculty || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.form_educ || '—'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.scholarship ? 'Да' : 'Нет'}</td>
                            <td class="px-3 py-2.5 text-sm text-gray-300">${student.mobile_number || '—'}</td>
                            <td class="px-3 py-2.5 text-sm ${student.is_verified ? 'text-green-400' : 'text-red-400'}">
                                ${student.is_verified ? 'Да' : 'Нет'}
                            </td>
                            <td class="px-3 py-2.5 text-sm text-gray-400">
                                ${student.updated_at ? new Date(student.updated_at).toLocaleString('ru-RU') : '—'}
                            </td>
                            <td class="px-3 py-2.5 text-sm text-center">
                                <span class="gear text-gray-400 hover:text-green-400 transition-colors duration-200"
                                    style="cursor: pointer;"
                                    data-id="${student.telegram_id}"
                                data-id="${student.telegram_id}"
                                data-username="${student.username || ''}"
                                data-fullname="${student.full_name || ''}"
                                data-group="${student.group_number || ''}"
                                data-stud_number="${student.stud_number || ''}"
                                data-faculty-code="${student.faculty_code || ''}"
                                data-faculty="${student.faculty || ''}"
                                data-form_educ="${student.form_educ || ''}"
                                data-scholarship="${student.scholarship ? 'true' : 'false'}"
                                data-mobile_number="${student.mobile_number || ''}">
                                    ⚙
                                </span>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                }

                verifiedCountEl.textContent = data.verified_count;
            })
            .catch(err => {
                tableBody.innerHTML = `<tr><td colspan="12" class="text-red-500 text-center py-10">Ошибка: ${err}</td></tr>`;
            });
    }


    // ────────────────────────────────────────────────
    // Инициализация и обработчики
    // ────────────────────────────────────────────────

    // Первая загрузка таблицы
    loadStudents();

    // Кнопка "Найти"
    if (searchBtn) searchBtn.onclick = loadStudents;

    // Кнопка "Очистить"
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            document.getElementById('fio').value         = '';
            document.getElementById('group').value       = '';
            document.getElementById('faculty').value     = '';
            document.getElementById('form').value        = '';
            document.getElementById('phone').value       = '';
            document.getElementById('scholarship').value = '';
            showUnverified.checked = false;
            if (advancedFilters) advancedFilters.classList.remove('open');
            loadStudents();
        };
    }

    // Чекбокс "Показать не верифицированных"
    if (showUnverified) {
        showUnverified.addEventListener('change', loadStudents);
    }

    // Кнопка "Дополнительные параметры"
    if (toggleAdvanced && advancedFilters) {
        toggleAdvanced.onclick = () => {
            advancedFilters.classList.toggle('open');
        };
    }

    // Enter в фильтрах → поиск
    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
        filterContainer.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadStudents();
            }
        });
    }

    // Валидация ввода ФИО (только буквы)
    const fioInput = document.getElementById('fio');
    if (fioInput) {
        fioInput.addEventListener('input', () => {
            fioInput.value = fioInput.value.replace(/[0-9]/g, '');
        });
    }

    // Валидация группы (только цифры, макс 6)
    const groupInput = document.getElementById('group');
    if (groupInput) {
        groupInput.addEventListener('input', () => {
            groupInput.value = groupInput.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    // Телефон — автодополнение +375 и только цифры
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value.startsWith('+375')) {
                phoneInput.value = '+375';
            }
        });

        phoneInput.addEventListener('input', () => {
            let value = phoneInput.value;

            if (!value.startsWith('+375')) {
                value = '+375' + value.replace(/\D/g, '');
            }

            const numbers = value.slice(4).replace(/\D/g, '').slice(0, 9);
            phoneInput.value = '+375' + numbers;
        });
    }

    // ────────────────────────────────────────────────
    // Модальное окно (открытие + закрытие)
    // ────────────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('edit-modal');
        if (!modal) return;

        // Открытие по шестерёнке
        const gear = e.target.closest('.gear');
        if (gear) {
            // Заполняем все поля
            document.getElementById('edit-telegram-id').value   = gear.dataset.id || '';
            document.getElementById('edit-username').value      = gear.dataset.username || '';
            document.getElementById('edit-fullname').value      = gear.dataset.fullname || '';
            document.getElementById('edit-group').value         = gear.dataset.group || '';
            document.getElementById('edit-faculty').value       = gear.dataset.facultyCode || '';
            document.getElementById('edit-form').value          = gear.dataset.form_educ || '';
            document.getElementById('edit-scholarship').value   = gear.dataset.scholarship || 'false';
            document.getElementById('edit-phone').value         = gear.dataset.mobile_number || '';

            // Username — только просмотр
            document.getElementById('edit-username').disabled = true;
            document.getElementById('edit-username').readOnly = true;

            modal.classList.remove('hidden');
            return;
        }

        // Закрытие по кнопке "Отмена" или клику вне модалки
        if (e.target.id === 'close-modal' || e.target.closest('#close-modal') || 
            (!modal.classList.contains('hidden') && !e.target.closest('.modal-content'))) {
            modal.classList.add('hidden');
            return;
        }

        // Сохранение изменений
        if (e.target.id === 'save-btn') {
            const telegramIdStr = document.getElementById('edit-telegram-id').value.trim();

            // Проверяем, что ID вообще есть и это число
            if (!telegramIdStr || isNaN(Number(telegramIdStr))) {
                alert('Ошибка: Telegram ID не найден или неверный');
                console.error('Неверный telegramId:', telegramIdStr);
                return;
            }

            const telegramId = Number(telegramIdStr);  // ← безопасно приводим

            const data = {
                telegram_id: telegramId,
                username: document.getElementById('edit-username').value.trim() || null,
                full_name: document.getElementById('edit-fullname').value.trim() || null,
                group_number: document.getElementById('edit-group').value.trim() || null,
                stud_number: null,
                faculty: document.getElementById('edit-faculty').value || null,
                form_educ: document.getElementById('edit-form').value || null,
                scholarship: document.getElementById('edit-scholarship').value,
                mobile_number: document.getElementById('edit-phone').value.trim() || null
            };

            console.log('Отправляем данные:', data);  // ← для отладки

            if (!confirm('Сохранить изменения?')) return;

            fetch('/api/students/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(res => {
                console.log('Ответ сервера:', res);  // ← смотри в консоли
                if (res.success) {
                    const gear = document.querySelector(`.gear[data-id="${telegramId}"]`);
                    if (gear) {
                        const row = gear.closest('tr');
                        row.querySelector('td:nth-child(2)').textContent = res.student.username || '—';
                        row.querySelector('td:nth-child(3)').textContent = res.student.full_name || '—';
                        row.querySelector('td:nth-child(4)').textContent = res.student.group_number || '—';
                        row.querySelector('td:nth-child(5)').textContent = res.student.stud_number || '—';
                        row.querySelector('td:nth-child(6)').textContent = res.student.faculty || '—';
                        row.querySelector('td:nth-child(7)').textContent = res.student.form_educ || '—';
                        row.querySelector('td:nth-child(8)').textContent = res.student.scholarship ? 'Да' : 'Нет';
                        row.querySelector('td:nth-child(9)').textContent = res.student.mobile_number || '—';
                        row.querySelector('td:nth-child(11)').textContent = new Date(res.student.updated_at).toLocaleString('ru-RU');
                    }

                    modal.classList.add('hidden');
                    alert('Изменения сохранены!');
                    loadStudents();
                } else {
                    alert('Ошибка: ' + (res.error || 'Неизвестно'));
                }
            })
            .catch(err => {
                console.error('Ошибка fetch:', err);
                alert('Ошибка соединения');
            });

            return;
        }

        // Удаление студента
        if (e.target.id === 'delite-btn') {
            const telegramId = document.getElementById('edit-telegram-id').value.trim();
            if (!telegramId) {
                alert('Ошибка: ID студента не найден');
                return;
            }

            if (!confirm('Удалить студента? Это действие нельзя отменить.')) return;

            fetch(`/api/students/${telegramId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(res => {
                if (!res.ok) throw new Error('Ошибка сервера');
                return res.json();
            })
            .then(res => {
                if (res.success) {
                    const gear = document.querySelector(`.gear[data-id="${telegramId}"]`);
                    if (gear) gear.closest('tr').remove();
                    modal.classList.add('hidden');
                    alert('Студент удалён');
                } else {
                    alert('Ошибка: ' + (res.error || 'Неизвестно'));
                }
            })
            .catch(err => {
                console.error(err);
                alert('Ошибка удаления');
            });
        }


    });


});