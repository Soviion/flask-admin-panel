// students.js
document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    const PAGE_SIZE = 25;

    let offset = 0;
    let hasMore = true;
    let loading = false;

    // чтобы отменять старые запросы при reset/быстрых кликах
    let controller = null;

    // ────────────────────────────────────────────────
    // DOM
    // ────────────────────────────────────────────────
=======
>>>>>>> 9eacfee (ren depl)
    const tableBody = document.getElementById('students-table-body');
    const verifiedCountEl = document.getElementById('verified-count');
    const searchBtn = document.getElementById('search-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const showUnverified = document.getElementById('show-unverified');
    const toggleAdvanced = document.getElementById('toggle-advanced');
    const advancedFilters = document.getElementById('advanced-filters');

    // sentinel внизу таблицы
    const sentinelRow = document.createElement('tr');
    sentinelRow.id = 'students-sentinel';
    sentinelRow.innerHTML = `<td colspan="12" class="px-3 py-6 text-center text-gray-500">Загрузка...</td>`;

<<<<<<< HEAD
    // ────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────
    function buildParams() {
        return new URLSearchParams({
            fio: document.getElementById('fio')?.value.trim() || '',
            group: document.getElementById('group')?.value.trim() || '',
            faculty: document.getElementById('faculty')?.value.trim() || '',
            form: document.getElementById('form')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            scholarship: document.getElementById('scholarship')?.value || '',
            show_unverified: showUnverified?.checked ? 'true' : 'false',
            limit: String(PAGE_SIZE),
            offset: String(offset),
=======
    function loadStudents() {
        const params = new URLSearchParams({
            fio: document.getElementById('fio').value.trim(),
            group: document.getElementById('group').value.trim(),
            faculty: document.getElementById('faculty').value.trim(),
            form: document.getElementById('form')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            scholarship: document.getElementById('scholarship')?.value || '',
            show_unverified: showUnverified.checked
>>>>>>> 9eacfee (ren depl)
        });
    }

    function clearTable() {
        while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);
    }

    function showEmpty() {
        clearTable();
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
      <td colspan="12" class="px-3 py-10 text-center text-gray-500 italic">
        Нет данных
      </td>`;
        tableBody.appendChild(emptyRow);
    }

    function ensureSentinel() {
        if (!tableBody.contains(sentinelRow)) tableBody.appendChild(sentinelRow);
        sentinelRow.style.display = hasMore ? '' : 'none';
    }

    function renderRows(students) {
        students.forEach((student) => {
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
                style="cursor:pointer;"
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
            // ключевое: вставляем перед sentinel, чтобы sentinel всегда оставался последним
            tableBody.insertBefore(row, sentinelRow);
        });
    }

    // ────────────────────────────────────────────────
    // Infinite loader
    // ────────────────────────────────────────────────
    const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        if (loading || !hasMore) return;
        loadStudents({ reset: false });
    }, { root: null, rootMargin: '300px 0px', threshold: 0 });

    function loadStudents({ reset = false } = {}) {
        if (loading && !reset) return;

        if (reset) {
            // отменяем предыдущий запрос (если был)
            controller?.abort();
            controller = new AbortController();

            offset = 0;
            hasMore = true;
            loading = false;

            clearTable();
            ensureSentinel();

            observer.disconnect();
            observer.observe(sentinelRow);
        }

        if (loading || !hasMore) return;
        loading = true;

        const params = buildParams();

        fetch(`/api/students?${params.toString()}`, { signal: controller?.signal })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    clearTable();
                    tableBody.innerHTML = `<tr><td colspan="12" class="text-red-500 text-center py-10">${data.error}</td></tr>`;
                    hasMore = false;
                    ensureSentinel();
                    return;
                }

<<<<<<< HEAD
                verifiedCountEl.textContent = data.verified_count ?? 0;

                const list = data.students || [];

                if (reset && list.length === 0) {
                    hasMore = false;
                    showEmpty();
                    ensureSentinel();
                    return;
=======
                while (tableBody.firstChild) {
                    tableBody.removeChild(tableBody.firstChild);
>>>>>>> 9eacfee (ren depl)
                }

                renderRows(list);

                offset = data.next_offset ?? (offset + list.length);
                hasMore = Boolean(data.has_more);

                ensureSentinel();
            })
            .catch(err => {
                // abort — это норма при reset
                if (err?.name === 'AbortError') return;

                clearTable();
                tableBody.innerHTML = `<tr><td colspan="12" class="text-red-500 text-center py-10">Ошибка: ${err}</td></tr>`;
                hasMore = false;
                ensureSentinel();
            })
            .finally(() => {
                loading = false;
            });
    }

    // ────────────────────────────────────────────────
    // Init
    // ────────────────────────────────────────────────
    ensureSentinel();
    observer.observe(sentinelRow);
    loadStudents({ reset: true });

<<<<<<< HEAD
    // ────────────────────────────────────────────────
    // Filters / UI
    // ────────────────────────────────────────────────
    if (searchBtn) searchBtn.onclick = () => loadStudents({ reset: true });

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            const fio = document.getElementById('fio');
            const grp = document.getElementById('group');
            const fac = document.getElementById('faculty');
            const form = document.getElementById('form');
            const phone = document.getElementById('phone');
            const schol = document.getElementById('scholarship');

            if (fio) fio.value = '';
            if (grp) grp.value = '';
            if (fac) fac.value = '';
            if (form) form.value = '';
            if (phone) phone.value = '';
            if (schol) schol.value = '';
            if (showUnverified) showUnverified.checked = false;
=======
    loadStudents();

    if (searchBtn) searchBtn.onclick = loadStudents;

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            document.getElementById('fio').value = '';
            document.getElementById('group').value = '';
            document.getElementById('faculty').value = '';
            document.getElementById('form').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('scholarship').value = '';
            showUnverified.checked = false;
>>>>>>> 9eacfee (ren depl)
            if (advancedFilters) advancedFilters.classList.remove('open');

            loadStudents({ reset: true });
        };
    }

    if (showUnverified) {
        showUnverified.addEventListener('change', () => loadStudents({ reset: true }));
    }

    if (toggleAdvanced && advancedFilters) {
        toggleAdvanced.onclick = () => {
            advancedFilters.classList.toggle('open');
        };
    }

    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
        filterContainer.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadStudents({ reset: true });
            }
        });
    }

    const fioInput = document.getElementById('fio');
    if (fioInput) {
        fioInput.addEventListener('input', () => {
            fioInput.value = fioInput.value.replace(/[0-9]/g, '');
        });
    }

    const groupInput = document.getElementById('group');
    if (groupInput) {
        groupInput.addEventListener('input', () => {
            groupInput.value = groupInput.value.replace(/\D/g, '').slice(0, 6);
        });
    }

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

<<<<<<< HEAD
    // ────────────────────────────────────────────────
    // Modal actions (оставил твою логику, но refresh делаем reset=true)
    // ────────────────────────────────────────────────
=======
>>>>>>> 9eacfee (ren depl)
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('edit-modal');
        if (!modal) return;

        const gear = e.target.closest('.gear');
        if (gear) {
            document.getElementById('edit-telegram-id').value = gear.dataset.id || '';
            document.getElementById('edit-username').value = gear.dataset.username || '';
            document.getElementById('edit-fullname').value = gear.dataset.fullname || '';
            document.getElementById('edit-group').value = gear.dataset.group || '';
            document.getElementById('edit-faculty').value = gear.dataset.facultyCode || '';
            document.getElementById('edit-form').value = gear.dataset.form_educ || '';
            document.getElementById('edit-scholarship').value = gear.dataset.scholarship || 'false';
            document.getElementById('edit-phone').value = gear.dataset.mobile_number || '';

            document.getElementById('edit-username').disabled = true;
            document.getElementById('edit-username').readOnly = true;

            modal.classList.remove('hidden');
            return;
        }

<<<<<<< HEAD
        if (
            e.target.id === 'close-modal' ||
            e.target.closest('#close-modal') ||
            (!modal.classList.contains('hidden') && !e.target.closest('.modal-content'))
        ) {
=======
        if (e.target.id === 'close-modal' || e.target.closest('#close-modal') ||
            (!modal.classList.contains('hidden') && !e.target.closest('.modal-content'))) {
>>>>>>> 9eacfee (ren depl)
            modal.classList.add('hidden');
            return;
        }

        if (e.target.id === 'save-btn') {
            const telegramIdStr = document.getElementById('edit-telegram-id').value.trim();
<<<<<<< HEAD
=======

>>>>>>> 9eacfee (ren depl)
            if (!telegramIdStr || isNaN(Number(telegramIdStr))) {
                alert('Ошибка: Telegram ID не найден или неверный');
                return;
            }

            const telegramId = Number(telegramIdStr);

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

<<<<<<< HEAD
=======
            console.log('Отправляем данные:', data);

>>>>>>> 9eacfee (ren depl)
            if (!confirm('Сохранить изменения?')) return;

            fetch('/api/students/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(res => {
<<<<<<< HEAD
                    if (res.success) {
                        modal.classList.add('hidden');
                        alert('Изменения сохранены!');
                        loadStudents({ reset: true }); // ✅ чтобы заново с 25 и с фильтрами
=======
                    console.log('Ответ сервера:', res);
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
>>>>>>> 9eacfee (ren depl)
                    } else {
                        alert('Ошибка: ' + (res.error || 'Неизвестно'));
                    }
                })
<<<<<<< HEAD
                .catch(() => alert('Ошибка соединения'));
=======
                .catch(err => {
                    console.error('Ошибка fetch:', err);
                    alert('Ошибка соединения');
                });
>>>>>>> 9eacfee (ren depl)

            return;
        }

        if (e.target.id === 'delite-btn') {
            const telegramId = document.getElementById('edit-telegram-id').value.trim();
            if (!telegramId) {
                alert('Ошибка: ID студента не найден');
                return;
            }

            if (!confirm('Удалить студента? Это действие нельзя отменить.')) return;

<<<<<<< HEAD
            fetch(`/api/students/${telegramId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        modal.classList.add('hidden');
                        alert('Студент удалён');
                        loadStudents({ reset: true }); // ✅
=======
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
>>>>>>> 9eacfee (ren depl)
                    } else {
                        alert('Ошибка: ' + (res.error || 'Неизвестно'));
                    }
                })
<<<<<<< HEAD
                .catch(() => alert('Ошибка удаления'));
=======
                .catch(err => {
                    console.error(err);
                    alert('Ошибка удаления');
                });
>>>>>>> 9eacfee (ren depl)
        }
    });
});