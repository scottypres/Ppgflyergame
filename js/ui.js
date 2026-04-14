// ui.js — DOM helpers, stat bar updates, dialog rendering

import { getState } from './state.js';
import { getWeatherLabel, getWeatherIcons } from './weather.js';
import { GEAR, REP_BRACKETS } from './data.js';

// ── Update the daily overview screen ────────────────────────────

export function updateDailyOverview() {
  const s = getState();

  // Day number
  setText('#day-num', s.day);
  setText('#day-total', s.runLength);

  // Stats
  setText('#stat-cash', `$${s.cash.toLocaleString()}`);
  setText('#stat-rep', s.reputation);
  setText('#stat-fuel', `${s.fuel} gal`);

  // Rep bar width
  const repBar = document.querySelector('.rep-bar-fill');
  if (repBar) repBar.style.width = `${s.reputation}%`;

  // Rep label
  const bracket = REP_BRACKETS.find(b => s.reputation >= b.min && s.reputation <= b.max);
  setText('#rep-label', bracket ? bracket.label : '');

  // Weather
  const labels = getWeatherLabel(s.weather);
  const icons = getWeatherIcons(s.weather);
  setText('#weather-wind', `${icons.wind} ${labels.wind}`);
  setText('#weather-air', `${icons.air} ${labels.air}`);

  // Weather warning
  const warningEl = document.getElementById('weather-warning');
  if (warningEl) {
    if (s.weather.wind === 'high' || s.weather.airQuality === 'gusty') {
      warningEl.textContent = 'Tough conditions today — fewer customers and riskier flights.';
      warningEl.hidden = false;
    } else if (s.weather.wind === 'low' && s.weather.airQuality === 'smooth') {
      warningEl.textContent = 'Perfect flying weather! Expect more customers.';
      warningEl.hidden = false;
    } else {
      warningEl.hidden = true;
    }
  }

  // Gear summary
  updateGearSummary();

  // Fuel warning
  const fuelWarn = document.getElementById('fuel-warning');
  if (fuelWarn) {
    fuelWarn.hidden = s.fuel >= 4;
    if (s.fuel < 2) {
      fuelWarn.textContent = 'No fuel! You need to visit the market.';
    } else {
      fuelWarn.textContent = 'Fuel is running low.';
    }
  }

  // Disable tandem button if no fuel
  const tandemBtn = document.querySelector('[data-action="tandem"]');
  if (tandemBtn) {
    tandemBtn.disabled = s.fuel < 2;
    if (s.fuel < 2) {
      tandemBtn.title = 'Not enough fuel to fly';
    } else {
      tandemBtn.title = '';
    }
  }
}

function updateGearSummary() {
  const s = getState();
  const wingName = GEAR.wing[s.gear.wing?.tier || 0]?.name || 'None';
  const motorName = GEAR.motor[s.gear.motor?.tier || 0]?.name || 'None';
  const accName = s.gear.accessory ? GEAR.accessory[s.gear.accessory.tier]?.name : 'None';

  setText('#gear-wing', wingName);
  setText('#gear-motor', motorName);
  setText('#gear-accessory', accName);
}

// ── Tandem HUD update ───────────────────────────────────────────

export function updateTandemHUD() {
  const s = getState();
  setText('#hud-cash', `$${s.cash.toLocaleString()}`);
  setText('#hud-fuel', `${Math.round(s.fuel * 10) / 10} gal`);
  setText('#hud-flights', s.todayResults.flights);
  setText('#hud-earnings', `$${s.todayResults.earnings}`);
  setText('#hud-rep', s.reputation);
}

// ── Helper ──────────────────────────────────────────────────────

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}
