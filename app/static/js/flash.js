// static/js/flash.js — чистый, современный, поверх всего

document.addEventListener('DOMContentLoaded', () => {
    const createContainer = () => {
        let c = document.querySelector('.flash-container');
        if (!c) {
            c = document.createElement('div');
            c.className = 'flash-container fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-[340px] pointer-events-none';
            document.body.appendChild(c);
        }
        return c;
    };


    const container = createContainer();

    function showToast(category, message) {

        const toast = document.createElement('div');
        toast.className = `flash-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl backdrop-blur-lg border border-opacity-20 transition-all duration-300 pointer-events-auto`;

        let bg = 'bg-neutral-900/90 border-neutral-700/50';
        let icon = '';

        if (category === 'success') {
            bg = 'bg-green-900/90 border-green-700/50';
            icon = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
        } else if (category === 'danger' || category === 'error') {
            bg = 'bg-red-900/90 border-red-700/50';
            icon = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.01M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg>';
        } else if (category === 'warning') {
            bg = 'bg-amber-900/90 border-amber-700/50';
            icon = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z"/></svg>';
        } else {
            bg = 'bg-indigo-900/90 border-indigo-700/50';
            icon = '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
        }

        toast.className += ' ' + bg;

        toast.innerHTML = `
            ${icon}
            <span class="flex-1">${message}</span>
            <button class="ml-1 text-white/70 hover:text-white text-xl leading-none" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            toast.style.transition = 'all 0.35s ease-out';
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 350);
        }, 3800);
    }

    const flashData = document.querySelector('#flash-data');
    if (flashData) {
        try {
            const flashes = JSON.parse(flashData.textContent || '[]');
            flashes.forEach(([cat, msg]) => showToast(cat, msg));
        } catch (e) {
            console.error('[FLASH] Ошибка парсинга:', e);
        }
        flashData.remove();
    } else {
    }
});