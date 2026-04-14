// main.js — Entry point: wires everything, starts game

import { getState, mutate, resetState, resetTodayResults, load, clearSave } from './state.js';
import { initScreens, showScreen, registerScreen } from './screens.js';
import { generateWeather } from './weather.js';
import { updateDailyOverview } from './ui.js';
import { enterMarket, setupMarketHandlers } from './market.js';
import { runTandemDay } from './tandem.js';
import { rollForEvent, showEventModal } from './events.js';
import { calculateScore } from './economy.js';

// ── Initialization ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initScreens();
  setupScreenHooks();
  setupEventDelegation();
  setupMarketHandlers();

  // Check for saved game
  const hasSave = load();
  if (hasSave) {
    const btn = document.querySelector('[data-action="continue"]');
    if (btn) btn.hidden = false;
  }

  showScreen('menu');
});

// ── Screen lifecycle hooks ──────────────────────────────────────

function setupScreenHooks() {
  registerScreen('menu', () => {
    const hasSave = load();
    const continueBtn = document.querySelector('[data-action="continue"]');
    if (continueBtn) continueBtn.hidden = !hasSave;
  });

  registerScreen('daily-overview', () => {
    updateDailyOverview();
  });

  registerScreen('day-summary', () => {
    renderDaySummary();
  });

  registerScreen('end-game', () => {
    renderEndGame();
  });
}

// ── Event delegation ────────────────────────────────────────────

function setupEventDelegation() {
  document.getElementById('game').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    // Prevent double-clicks during async actions
    if (btn.dataset.busy === 'true') return;

    handleAction(btn.dataset.action, btn);
  });
}

async function handleAction(action, btn) {
  switch (action) {
    case 'new-game':
      startNewGame();
      break;
    case 'continue':
      continueGame();
      break;
    case 'how-to-play':
      showScreen('how-to-play');
      break;
    case 'back-to-menu':
      showScreen('menu');
      break;
    case 'tandem':
      await startTandemDay();
      break;
    case 'market':
      await startMarketDay();
      break;
    case 'rest':
      await startRestDay();
      break;
    case 'next-day':
      advanceDay();
      break;
    case 'play-again':
      clearSave();
      showScreen('menu');
      break;
  }
}

// ── Game flow ───────────────────────────────────────────────────

function startNewGame() {
  const select = document.getElementById('run-length');
  const runLength = select ? parseInt(select.value) : 20;
  resetState(runLength);
  generateWeather();
  showScreen('daily-overview');
}

function continueGame() {
  showScreen('daily-overview');
}

async function startTandemDay() {
  const s = getState();

  if (s.fuel < 2) {
    return; // Button should be disabled, but guard anyway
  }

  // Collect event effects for the day
  let eventEffects = {};
  const event = rollForEvent('tandem', s);
  if (event) {
    await showEventModal(event, s);
    eventEffects = event.effects || {};
  }

  showScreen('tandem');
  await runTandemDay(eventEffects);
  // tandem.js calls finalizeTandemDay which shows day-summary
}

async function startMarketDay() {
  const s = getState();

  let eventEffects = {};
  const event = rollForEvent('market', s);
  if (event) {
    await showEventModal(event, s);
    eventEffects = event.effects || {};
  }

  resetTodayResults();
  mutate(st => { st.todayAction = 'market'; });
  enterMarket(eventEffects);
  showScreen('market');
}

async function startRestDay() {
  const s = getState();

  const event = rollForEvent('rest', s);
  if (event) {
    await showEventModal(event, s);
  }

  resetTodayResults();
  mutate(st => {
    st.todayAction = 'rest';
    st.reputation = Math.max(0, st.reputation - 1);
    st.todayResults.repChange = -1;
    st.stats.daysRested++;
  });

  showScreen('day-summary');
}

function advanceDay() {
  const s = getState();

  if (s.day >= s.runLength) {
    showScreen('end-game');
    return;
  }

  mutate(st => {
    st.day++;
  });
  resetTodayResults();
  generateWeather();
  showScreen('daily-overview');
}

// ── Day summary rendering ───────────────────────────────────────

function renderDaySummary() {
  const s = getState();
  const container = document.querySelector('.summary-details');
  if (!container) return;

  const r = s.todayResults;
  let html = `<div class="summary-header">Day ${s.day} of ${s.runLength}</div>`;

  if (s.todayAction === 'tandem') {
    html += `
      <div class="summary-stat"><span>Flights completed</span><span>${r.flights}</span></div>
      <div class="summary-stat"><span>Earnings</span><span class="positive">$${r.earnings}</span></div>
      ${r.tips > 0 ? `<div class="summary-stat"><span>Tips</span><span class="positive">$${r.tips}</span></div>` : ''}
      <div class="summary-stat"><span>Reputation</span><span class="${r.repChange >= 0 ? 'positive' : 'negative'}">${r.repChange >= 0 ? '+' : ''}${r.repChange}</span></div>
    `;

    // Customer breakdown
    if (r.customers.length > 0) {
      html += '<div class="summary-customers"><h3>Customers</h3>';
      r.customers.forEach(c => {
        const icon = c.accepted ? '&#10003;' : c.turnedAway ? '&#10007;' : '&#8594;';
        const cls = c.accepted ? 'positive' : 'negative';
        html += `<div class="summary-customer ${cls}">
          <span>${icon} ${c.name} (${c.type})</span>
          <span>${c.accepted ? '$' + (c.tip > 0 ? c.tip + ' tip' : c.price) : c.turnedAway ? 'Turned away' : 'Declined'}</span>
        </div>`;
      });
      html += '</div>';
    }
  } else if (s.todayAction === 'market') {
    html += `
      <div class="summary-stat"><span>Day spent at the market</span><span></span></div>
      <div class="summary-stat"><span>Current cash</span><span>$${s.cash.toLocaleString()}</span></div>
      <div class="summary-stat"><span>Fuel</span><span>${s.fuel} gal</span></div>
    `;
  } else if (s.todayAction === 'rest') {
    html += `
      <div class="summary-stat"><span>You took a rest day</span><span></span></div>
      <div class="summary-stat"><span>Reputation</span><span class="negative">-1</span></div>
    `;
  }

  if (r.events.length > 0) {
    html += '<div class="summary-events"><h3>Events</h3>';
    r.events.forEach(evt => {
      html += `<div class="summary-event">${evt.title}: ${evt.description}</div>`;
    });
    html += '</div>';
  }

  // Current totals
  html += `
    <div class="summary-totals">
      <div class="summary-stat"><span>Cash</span><span>$${s.cash.toLocaleString()}</span></div>
      <div class="summary-stat"><span>Reputation</span><span>${s.reputation}/100</span></div>
      <div class="summary-stat"><span>Fuel</span><span>${s.fuel} gal</span></div>
    </div>
  `;

  container.innerHTML = html;

  // Update button text
  const nextBtn = document.querySelector('[data-action="next-day"]');
  if (nextBtn) {
    nextBtn.textContent = s.day >= s.runLength ? 'See Final Score' : 'Next Day';
  }
}

// ── End game rendering ──────────────────────────────────────────

function renderEndGame() {
  const s = getState();

  const scoreEl = document.querySelector('.final-score');
  const statsEl = document.querySelector('.final-stats');
  if (!scoreEl || !statsEl) return;

  const score = calculateScore(s);

  let grade = 'D';
  if (score > 15000) grade = 'S';
  else if (score > 12000) grade = 'A';
  else if (score > 9000) grade = 'B';
  else if (score > 6000) grade = 'C';

  scoreEl.innerHTML = `
    <div class="score-label">Final Score</div>
    <div class="score-value">${score.toLocaleString()}</div>
    <div class="score-grade grade-${grade.toLowerCase()}">${grade}</div>
  `;

  statsEl.innerHTML = `
    <div class="summary-stat"><span>Final Cash</span><span>$${s.cash.toLocaleString()}</span></div>
    <div class="summary-stat"><span>Final Reputation</span><span>${s.reputation}/100</span></div>
    <div class="summary-stat"><span>Total Flights</span><span>${s.stats.totalFlights}</span></div>
    <div class="summary-stat"><span>Total Earnings</span><span>$${s.stats.totalEarnings.toLocaleString()}</span></div>
    <div class="summary-stat"><span>Total Tips</span><span>$${s.stats.totalTips.toLocaleString()}</span></div>
    <div class="summary-stat"><span>Customers Served</span><span>${s.stats.customersServed}</span></div>
    <div class="summary-stat"><span>Customers Turned Away</span><span>${s.stats.customersTurnedAway}</span></div>
    <div class="summary-stat"><span>Best Single Day</span><span>$${s.stats.bestSingleDay.toLocaleString()}</span></div>
    <div class="summary-stat"><span>Days Worked</span><span>${s.stats.daysWorked}</span></div>
    <div class="summary-stat"><span>Days Rested</span><span>${s.stats.daysRested}</span></div>
    <div class="summary-stat"><span>Gear Upgrades</span><span>${s.stats.gearUpgrades}</span></div>
  `;
}
