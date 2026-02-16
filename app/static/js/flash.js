// static/js/flash.js — toast-уведомления в правом верхнем углу

document.addEventListener('DOMContentLoaded', () => {
    // Создаём контейнер для toast (один раз)
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm';
        document.body.appendChild(toastContainer);
    }

    // Функция показа одного toast
    function showToast(category, message) {
        const toast = document.createElement('div');
        toast.className = `toast flash-${category} p-4 pr-12 rounded-xl shadow-2xl text-white flex items-center gap-3 backdrop-blur-md border border-opacity-30 animate-slide-in-right relative`;

        // Иконки + цвет по категории
        let bgClass = '';
        let icon = '';

        if (category === 'success') {
            bgClass = 'bg-green-600/90 border-green-400';
            icon = '<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
        } else if (category === 'danger' || category === 'error') {
            bgClass = 'bg-red-600/90 border-red-400';
            icon = '<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        } else if (category === 'warning') {
            bgClass = 'bg-amber-600/90 border-amber-400';
            icon = '<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
        } else {
            bgClass = 'bg-indigo-600/90 border-indigo-400';
            icon = '<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        }

        toast.classList.add(bgClass);
        toast.innerHTML = `
            ${icon}
            <span class="flex-1">${message}</span>
            <button class="absolute top-3 right-3 text-white/70 hover:text-white focus:outline-none" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        // Автозакрытие через 4.5 секунды
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-4', 'transition-all', 'duration-500');
            setTimeout(() => toast.remove(), 500);
        }, 4500);
    }

    // Берём flash из hidden div
    const flashData = document.querySelector('#flash-data');
    if (flashData) {
        try {
            const flashes = JSON.parse(flashData.textContent || '[]');
            flashes.forEach(([category, message]) => {
                showToast(category, message);
            });
        } catch (e) {
            console.error('Ошибка парсинга flash:', e);
        }
        flashData.remove();
    }

    // Анимация появления справа
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100%); }
            to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
            animation: slideInRight 0.4s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
});