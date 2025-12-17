import './style.css';

const API_BASE = 'https://backendroblex.up.railway.app';

const words = ['Safe', 'Fast', 'Reliable', 'Cheap'];
let wordElement = null;

function dispatchLayoutChange() {
  window.dispatchEvent(new Event('headerlayoutchange'));
}

function showAuthCard(cardId) {
  const authCard = document.getElementById('auth-card');
  const verifyCard = document.getElementById('verify-card');
  const authMessage = document.getElementById('auth-message');
  const verifyMessage = document.getElementById('verify-message');
  if (!authCard || !verifyCard) return;

  authCard.style.display = 'none';
  verifyCard.style.display = 'none';
  if (authMessage) authMessage.textContent = '';
  if (verifyMessage) verifyMessage.textContent = '';

  if (cardId === 'register' || cardId === 'login') {
    authCard.style.display = 'block';
  } else if (cardId === 'verify') {
    verifyCard.style.display = 'block';
  }
}

function initHeaderAnimation() {
  const header = document.querySelector('.header-container');
  if (!header || !window.gsap) return;

  const enterThreshold = 56;
  const exitThreshold = 16;
  const dropDuration = 0.35;
  const shortenDuration = 0.6;
  const waitBetween = 0.22;
  const raiseDelay = 0.18;
  const exitWait = 0.15;

  const dropY = '14px';
  const fullMaxWidth = '1150px';
  const fullPadding = '18px 20px';
  const clippedMaxWidth = '1020px';
  const clippedPadding = '16px 18px';

  let isActive = null;
  let timeline = null;

  gsap.set(header, { y: '0px', maxWidth: fullMaxWidth, padding: fullPadding });

  function playEnter() {
    if (isActive === true) return;
    isActive = true;
    if (timeline) timeline.kill();

    header.classList.add('header-floating');

    timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onUpdate: dispatchLayoutChange,
      onComplete: dispatchLayoutChange,
    });

    timeline.to(header, { duration: dropDuration, y: dropY, ease: 'power2.out' }, 0);
    timeline.to(
      header,
      { duration: shortenDuration, maxWidth: clippedMaxWidth, padding: clippedPadding, ease: 'power2.inOut' },
      `+=${waitBetween}`
    );
  }

  function playExit() {
    if (isActive === false) return;
    isActive = false;
    if (timeline) timeline.kill();

    timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onUpdate: dispatchLayoutChange,
      onComplete: () => {
        header.classList.remove('header-floating');
        dispatchLayoutChange();
      },
    });

    timeline.to(
      header,
      { duration: shortenDuration, maxWidth: fullMaxWidth, padding: fullPadding, ease: 'power2.inOut' },
      exitWait
    );
    timeline.to(header, { duration: dropDuration, y: '0px', ease: 'power2.out' }, `+=${raiseDelay}`);
  }

  function handleScroll() {
    const y = window.scrollY;
    const next = isActive ? !(y < exitThreshold) : y > enterThreshold;
    if (next === isActive) return;
    next ? playEnter() : playExit();
  }

  window.addEventListener(
    'scroll',
    () => {
      window.requestAnimationFrame(handleScroll);
    },
    { passive: true }
  );

  isActive = window.scrollY > enterThreshold;
  if (isActive) {
    header.classList.add('header-floating');
    gsap.set(header, { y: dropY, maxWidth: clippedMaxWidth, padding: clippedPadding });
  } else {
    header.classList.remove('header-floating');
    gsap.set(header, { y: '0px', maxWidth: fullMaxWidth, padding: fullPadding });
  }
  dispatchLayoutChange();
}

function initNavHoverHighlight() {
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

  window.addEventListener('headerlayoutchange', () => {
    if (!highlight.classList.contains('is-visible')) return;
    if (!currentTarget) return;
    moveTo(currentTarget);
  });
}

function initWordAnimation() {
  if (!wordElement) return;
  let wordIndex = 0;
  const animationInterval = 1500;

  function animateWordChange() {
    wordElement.classList.remove('word-animate');

    setTimeout(() => {
      wordElement.textContent = words[wordIndex];
      wordIndex = (wordIndex + 1) % words.length;
      wordElement.classList.add('word-animate');
    }, 50);
  }

  setInterval(animateWordChange, animationInterval);
  animateWordChange();
}

function initAuthWithBase() {
  const authForm = document.getElementById('auth-form');
  const authMessage = document.getElementById('auth-message');
  const tabs = document.querySelectorAll('.auth-tab');
  const verifyForm = document.getElementById('verify-form');
  const verifyMessage = document.getElementById('verify-message');
  let registeredEmail = '';

  if (!authForm || !verifyForm || !tabs.length) return;

  let mode = 'login';

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.mode || 'login';
      authMessage.style.color = '#ff9b9b';
      authMessage.textContent = '';
    });
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authMessage.style.color = '#ff9b9b';
    authMessage.textContent = '';
    const email = authForm.email.value.trim();
    const password = authForm.password.value;
    const submitButton = authForm.querySelector('.auth-submit');

    if (!email || !password) {
      authMessage.textContent = 'Email and password required';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
      const res = await fetch(`${API_BASE}/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error && data.error.includes('verified')) {
          registeredEmail = email;
          const verifyEmailField = document.getElementById('verify-email');
          if (verifyEmailField) verifyEmailField.value = email;
          if (verifyMessage) {
            verifyMessage.textContent = 'Please enter the 6-digit code sent to your email.';
          }
          showAuthCard('verify');
          return;
        }

        authMessage.style.color = '#ff9b9b';
        authMessage.textContent = data.error || 'Request failed';
        return;
      }

      if (mode === 'register') {
        registeredEmail = email;
        const verifyEmailField = document.getElementById('verify-email');
        if (verifyEmailField) verifyEmailField.value = email;
        if (verifyMessage) {
          verifyMessage.innerHTML = `
                    <span class="success-instruction">バ. Registration Successful!</span>
                    <br>
                    <span class="success-instruction-detail">
                        A 6-digit code has been sent to your email. Please enter it below.
                    </span>
                `;
        }
        showAuthCard('verify');
        authForm.reset();
      } else if (mode === 'login') {
        authMessage.style.color = '#9bffa7';
        authMessage.textContent = 'Logged in! Redirecting to dashboard...';
      }
    } catch (err) {
      console.error(err);
      authMessage.style.color = '#ff9b9b';
      authMessage.textContent = 'Network error. Check console.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Continue';
    }
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifyMessage.style.color = '#ff9b9b';
    verifyMessage.textContent = '';

    const email = verifyForm.email.value || registeredEmail;
    const code = verifyForm.code.value;
    const submitButton = verifyForm.querySelector('#verify-submit');

    if (code.length !== 6 || isNaN(code)) {
      verifyMessage.textContent = 'Please enter a valid 6-digit code.';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Verifying...';

    try {
      const res = await fetch(`${API_BASE}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        verifyMessage.style.color = '#9bffa7';
        verifyMessage.textContent = 'バ. Verification complete! You can now log in.';
        verifyForm.reset();
        setTimeout(() => {
          showAuthCard('login');
        }, 2000);
      } else {
        verifyMessage.style.color = '#ff9b9b';
        verifyMessage.textContent = data.error || 'Invalid code or email. Please try again.';
      }
    } catch (err) {
      console.error(err);
      verifyMessage.style.color = '#ff9b9b';
      verifyMessage.textContent = 'Network error during verification.';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Verify Account';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wordElement = document.getElementById('changing-word');
  initHeaderAnimation();
  initNavHoverHighlight();
  initWordAnimation();
  initAuthWithBase();
});

window.showAuthCard = showAuthCard;

const splineViewer = document.querySelector('.spline-background spline-viewer');
if (splineViewer) {
  splineViewer.addEventListener('load', () => {
    try {
      const root = splineViewer.shadowRoot || splineViewer;
      const labels = root.querySelectorAll('[data-name=\"Text\"], [data-name=\"text\"]');
      labels.forEach((node) => {
        node.style.display = 'none';
      });
    } catch (err) {
      console.warn('Unable to hide Spline text nodes', err);
    }
  });
}
