// screens.js — Screen manager: show/hide sections, lifecycle hooks

const screens = {};
const hooks = {};
let currentScreen = null;

export function initScreens() {
  document.querySelectorAll('[data-screen]').forEach(el => {
    screens[el.dataset.screen] = el;
  });
}

export function registerScreen(name, onEnter, onExit) {
  hooks[name] = { onEnter: onEnter || null, onExit: onExit || null };
}

export function showScreen(name) {
  // Exit current screen
  if (currentScreen && screens[currentScreen]) {
    hooks[currentScreen]?.onExit?.(screens[currentScreen]);
    screens[currentScreen].classList.remove('active');
  }

  // Enter new screen
  const target = screens[name];
  if (!target) {
    console.error(`Screen "${name}" not found`);
    return;
  }

  currentScreen = name;
  hooks[name]?.onEnter?.(target);
  // Small delay to allow CSS transition
  requestAnimationFrame(() => {
    target.classList.add('active');
  });
}

export function getCurrentScreen() {
  return currentScreen;
}
