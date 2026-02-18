document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('students-table-body');
    const verifiedCountEl = document.getElementById('verified-count');
    const searchBtn = document.getElementById('search-btn');
    const cancelBtn = document.getElementById('cancel-btn'); // кнопка очистки
    const showUnverified = document.getElementById('show-unverified');
    const toggleAdvanced = document.getElementById('toggle-advanced');
    const advancedFilters = document.getElementById('advanced-filters');

    function loadStudents() {
        const params = new URLSearchParams({
            fio: document.getElementById('fio').value.trim(),
            group: document.getElementById('group').value.trim(),
            faculty: document.getElementById('faculty').value.trim(),
            form: document.getElementById('form')?.value.trim() || '',          
            phone: document.getElementById('phone')?.value.trim() || '',        
            scholarship: document.getElementById('scholarship')?.value || '',
            show_unverified: showUnverified.checked
        });

        fetch(`/api/students?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    tableBody.innerHTML = `<tr><td colspan="9" class="text-red-500 text-center py-10">${data.error}</td></tr>`;
                    return;
                }

                tableBody.innerHTML = data.students.map(student => `
                    <tr class="hover:bg-gray-800/50 transition">
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
                            <span class="gear cursor-pointer text-gray-400 hover:text-green-400" 
                                data-id="${student.telegram_id}"
                                data-name="${student.full_name}"
                                data-group="${student.group_number}"
                                data-form="${student.form_educ}">
                                ⚙
                            </span>
                        </td>
                    </tr>
                `).join('') || `<tr><td colspan="13" class="px-3 py-10 text-center text-gray-500 italic">Нет данных</td></tr>`;

                verifiedCountEl.textContent = data.verified_count;
            })
            .catch(err => {
                tableBody.innerHTML = `<tr><td colspan="9" class="text-red-500 text-center py-10">Ошибка: ${err}</td></tr>`;
            });
    }

    // Первая загрузка
    loadStudents();

    // Поиск по кнопке "Найти"
    searchBtn.onclick = loadStudents;

    // Очистка фильтров по кнопке "Очистить"
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            // Очищаем ВСЕ поля фильтров
            document.getElementById('fio').value = '';
            document.getElementById('group').value = '';
            document.getElementById('faculty').value = '';
            document.getElementById('form').value = '';          // форма обучения
            document.getElementById('phone').value = '';         // телефон
            document.getElementById('scholarship').value = '';   // стипендия

            // Снимаем чекбокс
            showUnverified.checked = false;

            // Закрываем дополнительные фильтры, если открыты
            if (advancedFilters) advancedFilters.classList.remove('open');

            // Сразу обновляем таблицу (только верифицированные)
            loadStudents();
        };
    }

    // Мгновенное обновление при смене чекбокса
    showUnverified.addEventListener('change', loadStudents);

    // Toggle дополнительных параметров
    if (toggleAdvanced && advancedFilters) {
        toggleAdvanced.onclick = () => {
            advancedFilters.classList.toggle('open');
        };
    }

    // Обработка клика по шестерёнке (редактирование) — оставил как было
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('gear')) {
            document.getElementById('edit-telegram-id').value = e.target.dataset.id;
            document.getElementById('edit-fullname').value = e.target.dataset.name || '';
            document.getElementById('edit-group').value = e.target.dataset.group || '';
            document.getElementById('edit-form').value = e.target.dataset.form || '';

            modal.classList.remove('hidden');
        }
    });

    document.getElementById('close-modal').onclick = () => {
        modal.classList.add('hidden');
    };
});