// animation.js — CSS transition wrappers returning Promises

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function animateWalk(el, fromX, toX, durationMs) {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, durationMs + 200);
    el.style.transform = `translateX(${fromX}px)`;
    el.offsetHeight; // force reflow
    el.style.transition = `transform ${durationMs}ms ease-out`;
    el.style.transform = `translateX(${toX}px)`;
    el.addEventListener('transitionend', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

export function animateFadeOut(el, durationMs = 500) {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      el.remove();
      resolve();
    }, durationMs + 200);
    el.style.transition = `opacity ${durationMs}ms ease-out`;
    el.style.opacity = '0';
    el.addEventListener('transitionend', () => {
      clearTimeout(timeout);
      el.remove();
      resolve();
    }, { once: true });
  });
}

export function animateSlideUp(el, durationMs = 400) {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, durationMs + 200);
    el.style.transition = `transform ${durationMs}ms ease-out, opacity ${durationMs}ms ease-out`;
    el.style.transform = 'translateY(-30px)';
    el.style.opacity = '0';
    el.addEventListener('transitionend', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

export function animatePulse(el) {
  el.classList.add('pulse');
  return delay(600).then(() => el.classList.remove('pulse'));
}

export function animateFlyAcross(el, durationMs = 2000) {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, durationMs + 200);
    el.style.transition = `transform ${durationMs}ms ease-in-out`;
    el.style.transform = 'translateX(120%) translateY(-80px)';
    el.addEventListener('transitionend', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}
