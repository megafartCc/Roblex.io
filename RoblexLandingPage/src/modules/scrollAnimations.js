export function initScrollAnimations() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const header = document.querySelector('.main-header');
  if (header) {
    gsap.from(header, {
      opacity: 0,
      y: -40,
      duration: 0.65,
      ease: 'power2.out',
    });
  }

  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    const heroItems = heroContent.querySelectorAll(':scope > *');
    if (heroItems.length) {
      gsap.set(heroItems, { opacity: 0, y: 32 });
      gsap.to(heroItems, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: heroContent,
          start: 'top 80%',
          once: true,
        },
      });
    }

    gsap.fromTo(
      heroContent,
      { yPercent: 0 },
      {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.main-content',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }

  const splineLayer = document.querySelector('.spline-background');
  if (splineLayer) {
    gsap.to(splineLayer, {
      scale: 1.1,
      y: -90,
      ease: 'none',
      scrollTrigger: {
        trigger: '.scroll-spacer',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      },
    });
  }

  ScrollTrigger.refresh();
}
