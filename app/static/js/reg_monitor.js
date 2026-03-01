document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const statusSelect = document.getElementById('status');
    const cancelBtn = document.getElementById('cancel-btn');

    function filterAdmins() {
        const searchText = searchInput.value.toLowerCase().trim();
        const statusFilter = statusSelect.value;

        document.querySelectorAll('#admins-table-body tr[data-id]').forEach(row => {
            const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const fullName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const isActive = row.querySelector('.toggle-active').checked;

            const matchesSearch = email.includes(searchText) || fullName.includes(searchText);
            const matchesStatus = statusFilter === '' ||
                (statusFilter === 'active' && isActive) ||
                (statusFilter === 'inactive' && !isActive);

            row.style.display = matchesSearch && matchesStatus ? '' : 'none';
        });
    }

    searchInput.addEventListener('input', filterAdmins);
    statusSelect.addEventListener('change', filterAdmins);

    cancelBtn.addEventListener('click', () => {
        searchInput.value = '';
        statusSelect.value = '';
        filterAdmins();
    });

    document.querySelectorAll('.toggle-active').forEach(checkbox => {
        checkbox.addEventListener('change', async function () {
            const userId = this.dataset.id;
            const newState = this.checked;
            const originalState = !newState;

            try {
                const res = await fetch(`/api/admin/${userId}/toggle-active`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                if (data.success) {
                    showToast('success', 'Статус изменён');
                } else {
                    showToast('danger', data.error || 'Ошибка');
                    this.checked = originalState;
                }
            } catch (err) {
                showToast('danger', 'Ошибка соединения');
                this.checked = originalState;
            }
        });
    });
});