import { HEADER_LAYOUT_EVENT } from './constants';

const dispatchLayoutChange = () => {
  window.dispatchEvent(new Event(HEADER_LAYOUT_EVENT));
};

export function initHeaderAnimation() {
  const header = document.querySelector('.header-container');
  const { gsap } = window;
  if (!header || !gsap) return;

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
