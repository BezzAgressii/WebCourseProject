/**
 * Workflow diagram: reveal steps and dashed lines on scroll.
 */
export function initWorkflowScroll() {
  const section = document.querySelector('.workflow');

  if (!section || section.dataset.workflowReady === 'true') {
    return;
  }

  section.dataset.workflowReady = 'true';

  const title = section.querySelector('.workflow__title');
  const steps = [...section.querySelectorAll('.workflow__step')];
  const lines = [...section.querySelectorAll('.workflow__line')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealAll = () => {
    title?.classList.add('is-inview');
    steps.forEach((step) => step.classList.add('is-inview'));
    lines.forEach((line) => line.classList.add('is-inview'));
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const target = entry.target;
        target.classList.add('is-inview');

        if (target.classList.contains('workflow__step')) {
          const index = steps.indexOf(target);
          // Line before this step (connects previous → current)
          if (index > 0 && lines[index - 1]) {
            lines[index - 1].classList.add('is-inview');
          }
        }

        observer.unobserve(target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  if (title) {
    observer.observe(title);
  }

  steps.forEach((step) => observer.observe(step));
}

initWorkflowScroll();
