/* Navegação progressiva. O conteúdo permanece visível mesmo sem JavaScript. */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var button = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('menu-principal');

  if (!header || !button || !navigation || !window.matchMedia) return;

  var mobile = window.matchMedia('(max-width: 62rem)');

  function isOpen() {
    return button.getAttribute('aria-expanded') === 'true';
  }

  function closeMenu(restoreFocus) {
    navigation.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  }

  function synchronizeLayout() {
    var focusWasInNavigation = navigation.contains(document.activeElement);
    var buttonWasFocused = document.activeElement === button;
    closeMenu(mobile.matches && focusWasInNavigation);
    button.hidden = !mobile.matches;
    if (!mobile.matches && buttonWasFocused) {
      navigation.querySelector('a').focus();
    }
  }

  button.addEventListener('click', function () {
    var open = !isOpen();
    navigation.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && mobile.matches && isOpen()) closeMenu(true);
  });

  document.addEventListener('click', function (event) {
    if (mobile.matches && isOpen() && !header.contains(event.target)) closeMenu(false);
  });

  header.addEventListener('focusout', function (event) {
    if (mobile.matches && isOpen() && event.relatedTarget &&
        !header.contains(event.relatedTarget)) closeMenu(false);
  });

  navigation.addEventListener('click', function (event) {
    if (event.target.closest('a') && mobile.matches) closeMenu(false);
  });

  if (mobile.addEventListener) mobile.addEventListener('change', synchronizeLayout);
  else mobile.addListener(synchronizeLayout);

  synchronizeLayout();
  document.documentElement.classList.add('nav-enhanced');
  document.documentElement.classList.remove('no-js');
})();
