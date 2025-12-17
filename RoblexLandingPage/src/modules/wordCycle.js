const DEFAULT_WORDS = ['Safe', 'Fast', 'Reliable', 'Cheap'];

export function initWordAnimation(target, words = DEFAULT_WORDS) {
  if (!target || !words.length) return;
  let wordIndex = 0;
  const animationInterval = 1500;

  function animateWordChange() {
    target.classList.remove('word-animate');
    setTimeout(() => {
      target.textContent = words[wordIndex];
      wordIndex = (wordIndex + 1) % words.length;
      target.classList.add('word-animate');
    }, 50);
  }

  setInterval(animateWordChange, animationInterval);
  animateWordChange();
}
