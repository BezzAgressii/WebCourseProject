export function initBurgerMenu() {
  const burger = document.querySelector('.header__burger');
  const mobileNav = document.getElementById('mobile-nav');

  if (!burger || !mobileNav || burger.dataset.burgerBound === 'true') {
    return;
  }

  burger.dataset.burgerBound = 'true';

  const closeMenu = () => {
    burger.setAttribute('aria-expanded', 'false');
    burger.classList.remove('header__burger--open');
    mobileNav.hidden = true;
  };

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      closeMenu();
      return;
    }

    burger.setAttribute('aria-expanded', 'true');
    burger.classList.add('header__burger--open');
    mobileNav.hidden = false;
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}
