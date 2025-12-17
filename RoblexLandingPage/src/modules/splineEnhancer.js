export function initSplineEnhancer() {
  const viewer = document.querySelector('.spline-background spline-viewer');
  if (!viewer) return;

  viewer.addEventListener('load', () => {
    try {
      const root = viewer.shadowRoot || viewer;
      const labels = root.querySelectorAll('[data-name="Text"], [data-name="text"]');
      labels.forEach((node) => {
        node.style.display = 'none';
      });
    } catch (error) {
      console.warn('Unable to hide Spline text nodes', error);
    }
  });
}
