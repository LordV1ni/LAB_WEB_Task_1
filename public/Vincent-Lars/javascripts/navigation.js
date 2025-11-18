'use strict';

(function () {
    const burger = document.getElementById('burger-menu');
    const desktopNav = document.getElementById('desktop-nav');

    if (!burger || !desktopNav) {
        return;
    }

    const ensureDesktopNavVisible = () => {
        if (window.innerWidth > 1000) {
            desktopNav.classList.remove('hidden');
        }
    };

    burger.addEventListener('click', () => {
        desktopNav.classList.toggle('hidden');
    });

    window.addEventListener('resize', ensureDesktopNavVisible);
    ensureDesktopNavVisible();
})();

