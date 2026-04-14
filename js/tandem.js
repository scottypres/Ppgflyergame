// tandem.js — Tandem day: customer pipeline (spawn → walk → dialog → fly → result)

import { getState, mutate, resetTodayResults } from './state.js';
import { calculateCustomerCount, customerDecision, simulateFlight } from './economy.js';
import { CUSTOMER_TYPES, CUSTOMER_NAMES } from './data.js';
import { animateWalk, animateFadeOut, animateFlyAcross, delay } from './animation.js';
import { updateTandemHUD } from './ui.js';
import { showScreen } from './screens.js';

let currentEvent = null; // Store active event effects for the day
let abortDay = false;

// ── Main entry: run a full tandem day ───────────────────────────

export async function runTandemDay(eventEffects = {}) {
  const s = getState();
  abortDay = false;

  resetTodayResults();
  mutate(st => { st.todayAction = 'tandem'; });

  updateTandemHUD();

  // Calculate customer count
  let customerCount = calculateCustomerCount(s.reputation, s.weather);

  // Event modifications
  if (eventEffects.extraCustomers) customerCount += eventEffects.extraCustomers;
  if (eventEffects.lostCustomers) customerCount -= eventEffects.lostCustomers;
  customerCount = Math.max(1, customerCount);

  const flightBoost = eventEffects.flightBoost || 0;

  // Show starting message
  showMessage(`Day ${s.day} — ${customerCount} potential customer${customerCount !== 1 ? 's' : ''} today!`);
  await delay(1500);
  hideMessage();

  // Process each customer sequentially
  for (let i = 0; i < customerCount; i++) {
    if (abortDay) break;

    const currentState = getState();
    if (currentState.fuel < 2) {
      showMessage('Out of fuel! No more flights today.');
      await delay(2000);
      hideMessage();
      break;
    }

    const customer = generateCustomer();
    await processCustomer(customer, i + 1, customerCount, flightBoost);
    await delay(800);
  }

  // Day complete
  showMessage('Day complete!');
  await delay(1500);
  hideMessage();

  // Flush today results
  finalizeTandemDay();
}

// ── Generate a random customer ──────────────────────────────────

function generateCustomer() {
  const type = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
  const phrase = type.phrases[Math.floor(Math.random() * type.phrases.length)];

  return {
    name,
    type: type.type,
    label: type.label,
    color: type.color,
    size: type.size,
    acceptMod: type.acceptMod,
    tipMod: type.tipMod,
    phrase,
  };
}

// ── Process a single customer ───────────────────────────────────

async function processCustomer(customer, index, total, flightBoost) {
  const lane = document.querySelector('.scene__customer-lane');
  if (!lane) return;

  // 1. Create customer element
  const el = createCustomerElement(customer);
  lane.appendChild(el);

  // 2. Walk to table
  const laneWidth = lane.offsetWidth;
  const tableX = Math.round(laneWidth * 0.65);
  await animateWalk(el, -80, tableX, 2500);

  // Show speech bubble
  showBubble(el, customer.phrase);
  await delay(1200);
  hideBubble(el);

  // 3. Show pricing dialog, wait for player choice
  updateTandemHUD();
  const choice = await showPricingDialog(customer, index, total);

  if (choice.action === 'turnAway') {
    // Turn away customer
    showBubble(el, 'Oh... okay.');
    mutate(s => {
      s.stats.customersTurnedAway++;
      s.reputation = Math.max(0, s.reputation - 1);
      s.todayResults.repChange -= 1;
      s.todayResults.customers.push({
        name: customer.name,
        type: customer.label,
        price: null,
        accepted: false,
        turnedAway: true,
        tip: 0,
        repDelta: -1,
      });
    });
    await delay(800);
    hideBubble(el);
    await animateFadeOut(el);
    updateTandemHUD();
    return;
  }

  // 4. Customer decides
  const accepts = customerDecision(customer, choice.price, getState());

  if (!accepts) {
    showBubble(el, getDeclineMessage(choice.price));
    mutate(s => {
      s.todayResults.customers.push({
        name: customer.name,
        type: customer.label,
        price: choice.price,
        accepted: false,
        turnedAway: false,
        tip: 0,
        repDelta: 0,
      });
    });
    await delay(1200);
    hideBubble(el);
    await animateWalk(el, tableX, -80, 2000);
    el.remove();
    return;
  }

  // 5. Customer accepts — fly!
  showBubble(el, "Let's fly!");
  await delay(800);
  hideBubble(el);

  // Flight animation
  await playFlightAnimation(el);

  // 6. Simulate flight result
  const result = simulateFlight(getState(), choice.price, flightBoost);

  // Apply results
  mutate(s => {
    s.cash += result.earnings + result.tip;
    s.fuel = Math.max(0, s.fuel - result.fuelUsed);
    s.reputation = Math.max(0, Math.min(100, s.reputation + result.repDelta));
    s.todayResults.flights++;
    s.todayResults.earnings += result.earnings;
    s.todayResults.tips += result.tip;
    s.todayResults.repChange += result.repDelta;
    s.todayResults.customers.push({
      name: customer.name,
      type: customer.label,
      price: choice.price,
      accepted: true,
      turnedAway: false,
      tip: result.tip,
      repDelta: result.repDelta,
      outcome: result.outcome,
    });
  });

  // Show flight result
  await showFlightResult(result, customer);
  updateTandemHUD();

  // Remove customer
  if (el.parentNode) {
    await animateFadeOut(el);
  }
}

// ── Create customer DOM element ─────────────────────────────────

function createCustomerElement(customer) {
  const el = document.createElement('div');
  el.className = `customer customer--${customer.type}`;

  const sizeMap = { small: 50, medium: 60, large: 70 };
  const height = sizeMap[customer.size] || 60;

  el.innerHTML = `
    <div class="customer__body" style="background-color: ${customer.color}; height: ${height}px;">
      <div class="customer__head" style="background-color: ${customer.color};"></div>
    </div>
    <div class="customer__name">${customer.name}</div>
    <div class="customer__bubble" hidden></div>
  `;

  el.style.position = 'absolute';
  el.style.bottom = '0';
  el.style.willChange = 'transform';

  return el;
}

// ── Speech bubbles ──────────────────────────────────────────────

function showBubble(el, text) {
  const bubble = el.querySelector('.customer__bubble');
  if (bubble) {
    bubble.textContent = text;
    bubble.hidden = false;
  }
}

function hideBubble(el) {
  const bubble = el.querySelector('.customer__bubble');
  if (bubble) bubble.hidden = true;
}

// ── Pricing dialog ──────────────────────────────────────────────

function showPricingDialog(customer, index, total) {
  return new Promise(resolve => {
    const dialog = document.querySelector('.tandem-dialog');
    if (!dialog) { resolve({ action: 'turnAway' }); return; }

    dialog.querySelector('.dialog-customer-name').textContent = customer.name;
    dialog.querySelector('.dialog-customer-type').textContent = customer.label;
    dialog.querySelector('.dialog-customer-type').style.color = customer.color;
    dialog.querySelector('.dialog-counter').textContent = `Customer ${index} of ${total}`;

    dialog.hidden = false;

    const handler = (e) => {
      const priceBtn = e.target.closest('[data-price]');
      const turnAwayBtn = e.target.closest('[data-turn-away]');

      if (priceBtn) {
        dialog.hidden = true;
        dialog.removeEventListener('click', handler);
        resolve({ action: 'offer', price: priceBtn.dataset.price });
      } else if (turnAwayBtn) {
        dialog.hidden = true;
        dialog.removeEventListener('click', handler);
        resolve({ action: 'turnAway' });
      }
    };

    dialog.addEventListener('click', handler);
  });
}

// ── Flight animation ────────────────────────────────────────────

async function playFlightAnimation(customerEl) {
  const scene = document.querySelector('.scene');
  if (!scene) return;

  // Create paramotor element
  const pm = document.createElement('div');
  pm.className = 'paramotor-flight';
  pm.innerHTML = `<div class="paramotor-icon">🪂</div>`;
  pm.style.position = 'absolute';
  pm.style.bottom = '40%';
  pm.style.left = '-60px';
  pm.style.fontSize = '2.5rem';
  pm.style.zIndex = '10';
  scene.appendChild(pm);

  // Hide customer during flight
  customerEl.style.opacity = '0.3';

  // Fly across
  await animateFlyAcross(pm, 2500);
  pm.remove();

  // Show customer again
  customerEl.style.opacity = '1';
}

// ── Flight result display ───────────────────────────────────────

function showFlightResult(result, customer) {
  return new Promise(resolve => {
    const resultEl = document.querySelector('.tandem-result');
    if (!resultEl) { resolve(); return; }

    const outcomeClass = result.outcome === 'Perfect' || result.outcome === 'Good' ? 'positive'
      : result.outcome === 'Rough' || result.outcome === 'Bad' ? 'negative' : '';

    let html = `
      <div class="result-outcome ${outcomeClass}">${result.outcome} Flight!</div>
      <div class="result-message">${result.message}</div>
      <div class="result-earnings">Earned: $${result.earnings}</div>
    `;
    if (result.tip > 0) {
      html += `<div class="result-tip positive">Tip: +$${result.tip}!</div>`;
    }
    html += `<div class="result-rep ${result.repDelta >= 0 ? 'positive' : 'negative'}">Rep: ${result.repDelta >= 0 ? '+' : ''}${result.repDelta}</div>`;
    html += `<div class="result-fuel">Fuel used: ${result.fuelUsed} gal</div>`;
    html += `<button class="btn btn-primary" data-dismiss-result>Continue</button>`;

    resultEl.innerHTML = html;
    resultEl.hidden = false;

    const handler = (e) => {
      if (e.target.closest('[data-dismiss-result]')) {
        resultEl.hidden = true;
        resultEl.removeEventListener('click', handler);
        resolve();
      }
    };
    resultEl.addEventListener('click', handler);
  });
}

// ── Decline messages ────────────────────────────────────────────

function getDeclineMessage(priceLevel) {
  const messages = {
    low: "Hmm, even that's too much for me.",
    medium: "That's more than I wanted to spend.",
    high: "Way too expensive! No thanks.",
  };
  return messages[priceLevel] || "I'll pass.";
}

// ── Message display ─────────────────────────────────────────────

function showMessage(text) {
  const msg = document.querySelector('.tandem-message');
  if (msg) {
    msg.textContent = text;
    msg.hidden = false;
  }
}

function hideMessage() {
  const msg = document.querySelector('.tandem-message');
  if (msg) msg.hidden = true;
}

// ── Finalize day ────────────────────────────────────────────────

function finalizeTandemDay() {
  const s = getState();
  mutate(st => {
    st.stats.totalFlights += st.todayResults.flights;
    st.stats.totalEarnings += st.todayResults.earnings;
    st.stats.totalTips += st.todayResults.tips;
    st.stats.customersServed += st.todayResults.customers.filter(c => c.accepted).length;
    if (st.todayResults.earnings > st.stats.bestSingleDay) {
      st.stats.bestSingleDay = st.todayResults.earnings;
    }
    st.stats.daysWorked++;
  });

  showScreen('day-summary');
}
