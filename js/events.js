// events.js — Random event pool, weighted selection, effect application

import { EVENTS, EVENT_CHANCE } from './data.js';
import { mutate, getState } from './state.js';

// ── Roll for a random event ─────────────────────────────────────

export function rollForEvent(dayType, state) {
  if (Math.random() > EVENT_CHANCE) return null;

  const pool = EVENTS[dayType];
  if (!pool || pool.length === 0) return null;

  // Weighted random selection
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return pool[pool.length - 1];
}

// ── Show event modal and wait for player to dismiss ─────────────

export function showEventModal(event, state) {
  return new Promise(resolve => {
    const modal = document.getElementById('event-modal');
    if (!modal) { resolve(); return; }

    modal.querySelector('.event-title').textContent = event.title;
    modal.querySelector('.event-description').textContent = event.description;

    // Show effects summary
    const effectsEl = modal.querySelector('.event-effects');
    if (effectsEl) {
      effectsEl.innerHTML = formatEffects(event.effects);
    }

    modal.hidden = false;
    modal.classList.add('active');

    const dismiss = () => {
      modal.hidden = true;
      modal.classList.remove('active');
      applyEventEffects(event);
      resolve();
    };

    const btn = modal.querySelector('[data-action="dismiss-event"]');
    if (btn) {
      btn.addEventListener('click', dismiss, { once: true });
    } else {
      modal.addEventListener('click', dismiss, { once: true });
    }
  });
}

// ── Apply event effects to state ────────────────────────────────

function applyEventEffects(event) {
  const effects = event.effects;
  if (!effects) return;

  mutate(s => {
    if (effects.repBonus) {
      s.reputation = Math.max(0, Math.min(100, s.reputation + effects.repBonus));
      s.todayResults.repChange += effects.repBonus;
    }
    if (effects.cashBonus) {
      s.cash += effects.cashBonus;
    }
    if (effects.fuelLoss) {
      s.fuel = Math.max(0, s.fuel - effects.fuelLoss);
    }
    if (effects.fuelSave) {
      s.fuel = Math.min(20, s.fuel + effects.fuelSave);
    }
    s.todayResults.events.push({ title: event.title, description: event.description });
  });
}

// ── Format effects for display ──────────────────────────────────

function formatEffects(effects) {
  if (!effects) return '';
  const parts = [];

  if (effects.repBonus > 0) parts.push(`<span class="positive">+${effects.repBonus} Reputation</span>`);
  if (effects.repBonus < 0) parts.push(`<span class="negative">${effects.repBonus} Reputation</span>`);
  if (effects.cashBonus) parts.push(`<span class="positive">+$${effects.cashBonus}</span>`);
  if (effects.extraCustomers) parts.push(`<span class="positive">+${effects.extraCustomers} Customers today</span>`);
  if (effects.lostCustomers) parts.push(`<span class="negative">-${effects.lostCustomers} Customer today</span>`);
  if (effects.fuelLoss) parts.push(`<span class="negative">-${effects.fuelLoss} Fuel</span>`);
  if (effects.fuelSave) parts.push(`<span class="positive">+${effects.fuelSave} Fuel</span>`);
  if (effects.flightBoost) parts.push(`<span class="positive">Better flight outcomes today</span>`);
  if (effects.priceMultiplier && effects.priceMultiplier < 1) parts.push(`<span class="positive">Discounted prices!</span>`);
  if (effects.priceMultiplier && effects.priceMultiplier > 1) parts.push(`<span class="negative">Inflated prices!</span>`);
  if (effects.fuelDiscount) parts.push(`<span class="positive">Cheap fuel today!</span>`);

  return parts.join(' &middot; ');
}

// ── Get active event effects for current day ────────────────────

export function getActiveEventEffects(state) {
  // Return any event effects that modify day behavior
  const effects = {};
  for (const evt of state.todayResults.events) {
    // The actual effects were already applied; this is for checking
    // modifiers like extraCustomers and flightBoost during the day
  }
  return effects;
}
