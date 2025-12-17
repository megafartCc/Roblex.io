import { HEADER_LAYOUT_EVENT } from './constants';

export function initNavHoverHighlight() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('.nav-link'));
  if (links.length === 0) return;

  const highlight = document.createElement('div');
  highlight.className = 'nav-highlight';
  nav.prepend(highlight);

  let currentTarget = null;

  function moveTo(target) {
    currentTarget = target;
    const navRect = nav.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const x = rect.left - navRect.left;
    const y = rect.top - navRect.top;
    const h = rect.height;

    highlight.style.setProperty('--x', `${x}px`);
    highlight.style.setProperty('--y', `${y}px`);
    highlight.style.height = `${h}px`;
    highlight.style.width = `${rect.width}px`;
  }

  function show(target) {
    moveTo(target);
    highlight.classList.add('is-visible');
  }

  function hide() {
    highlight.classList.remove('is-visible');
    currentTarget = null;
  }

  for (const link of links) {
    link.addEventListener('mouseenter', () => show(link));
    link.addEventListener('focus', () => show(link));
  }

  nav.addEventListener('mouseleave', hide);
  nav.addEventListener('focusout', (event) => {
    if (!nav.contains(event.relatedTarget)) hide();
  });

  window.addEventListener('resize', () => {
    if (!highlight.classList.contains('is-visible')) return;
    if (!currentTarget) return;
    moveTo(currentTarget);
  });

  window.addEventListener(HEADER_LAYOUT_EVENT, () => {
    if (!highlight.classList.contains('is-visible')) return;
    if (!currentTarget) return;
    moveTo(currentTarget);
  });
}
