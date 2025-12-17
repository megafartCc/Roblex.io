import './style.css';
import { initHeaderAnimation } from './modules/headerAnimation';
import { initNavHoverHighlight } from './modules/navHighlight';
import { initWordAnimation } from './modules/wordCycle';
import { initAuthFlow, showAuthCard } from './modules/authFlow';
import { initScrollAnimations } from './modules/scrollAnimations';
import { initSplineEnhancer } from './modules/splineEnhancer';

document.addEventListener('DOMContentLoaded', () => {
  const changingWord = document.getElementById('changing-word');
  initHeaderAnimation();
  initNavHoverHighlight();
  initWordAnimation(changingWord);
  initAuthFlow();
  initScrollAnimations();
  initSplineEnhancer();
});

window.showAuthCard = showAuthCard;
