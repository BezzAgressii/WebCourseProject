(function () {
  var burger = document.querySelector('.header__burger');
  var mobileNav = document.getElementById('mobile-nav');

  if (!burger || !mobileNav) {
    return;
  }

  burger.addEventListener('click', function () {
    var isOpen = burger.getAttribute('aria-expanded') === 'true';

    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.classList.toggle('header__burger--open', !isOpen);
    mobileNav.hidden = isOpen;
  });

  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      burger.setAttribute('aria-expanded', 'false');
      burger.classList.remove('header__burger--open');
      mobileNav.hidden = true;
    });
  });
})();
