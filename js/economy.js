// economy.js — Pricing, customer decisions, flight simulation, scoring

import { PRICES, GEAR, WIND_EFFECTS, AIR_EFFECTS, FLIGHT_OUTCOMES,
         REP_BRACKETS, BASE_ACCEPTANCE, MIN_ACCEPTANCE, MAX_ACCEPTANCE,
         TIP_BASE_CHANCE, TIP_MIN, TIP_MAX, FUEL_PER_FLIGHT_MIN,
         FUEL_PER_FLIGHT_MAX } from './data.js';

// ── Customer count for a day ────────────────────────────────────

export function calculateCustomerCount(reputation, weather) {
  const bracket = REP_BRACKETS.find(b => reputation >= b.min && reputation <= b.max)
    || REP_BRACKETS[2];

  let count = bracket.customersBase + Math.floor(Math.random() * (bracket.customersMax - bracket.customersBase + 1));

  // Weather adjustments
  if (weather.wind === 'high') count--;
  if (weather.airQuality === 'gusty') count--;
  if (weather.wind === 'low' && weather.airQuality === 'smooth') count++;

  return Math.max(1, count);
}

// ── Customer decision on whether to accept ──────────────────────

export function customerDecision(customer, priceLevel, state) {
  const price = PRICES[priceLevel];
  const weather = state.weather;

  // Gear bonuses
  const wingGear = GEAR.wing[state.gear.wing?.tier || 0];
  const motorGear = GEAR.motor[state.gear.motor?.tier || 0];
  const accGear = state.gear.accessory ? GEAR.accessory[state.gear.accessory.tier] : GEAR.accessory[0];
  const gearBonus = (wingGear?.acceptBonus || 0) + (motorGear?.acceptBonus || 0) + (accGear?.acceptBonus || 0);

  // Weather effects
  const windEffect = WIND_EFFECTS[weather.wind]?.acceptMod || 0;
  const airEffect = AIR_EFFECTS[weather.airQuality]?.acceptMod || 0;

  // Customer type modifier
  const customerMod = customer.acceptMod || 0;

  // Calculate total acceptance chance
  let chance = BASE_ACCEPTANCE
    + (state.reputation - 50) * 0.5
    + gearBonus
    + windEffect
    + airEffect
    + price.acceptMod
    + customerMod;

  chance = Math.max(MIN_ACCEPTANCE, Math.min(MAX_ACCEPTANCE, chance));

  return Math.random() * 100 < chance;
}

// ── Flight simulation ───────────────────────────────────────────

export function simulateFlight(state, priceLevel, flightBoost = 0) {
  const price = PRICES[priceLevel];
  const weather = state.weather;

  // Adjust flight outcome weights based on weather and gear
  const windShift = WIND_EFFECTS[weather.wind]?.flightShift || 0;
  const airShift = AIR_EFFECTS[weather.airQuality]?.flightShift || 0;
  const totalShift = windShift + airShift + flightBoost;

  // Build adjusted weights
  const weights = FLIGHT_OUTCOMES.map((outcome, i) => {
    let w = outcome.baseWeight;
    // Positive shift favors good outcomes (lower indices)
    if (i === 0) w += totalShift * 5;  // Perfect
    if (i === 1) w += totalShift * 3;  // Good
    if (i === 3) w -= totalShift * 3;  // Rough
    if (i === 4) w -= totalShift * 5;  // Bad
    return Math.max(1, w);
  });

  // Weighted random pick
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let outcome = FLIGHT_OUTCOMES[FLIGHT_OUTCOMES.length - 1];
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      outcome = FLIGHT_OUTCOMES[i];
      break;
    }
  }

  // Calculate earnings
  const earnings = Math.round(price.amount * outcome.earningsMult);

  // Calculate tip
  const wingGear = GEAR.wing[state.gear.wing?.tier || 0];
  const motorGear = GEAR.motor[state.gear.motor?.tier || 0];
  const accGear = state.gear.accessory ? GEAR.accessory[state.gear.accessory.tier] : GEAR.accessory[0];
  let tipChance = TIP_BASE_CHANCE + (wingGear?.tipBonus || 0) + (motorGear?.tipBonus || 0) + (accGear?.tipBonus || 0);
  if (state.reputation > 70) tipChance += 10;
  if (outcome.name === 'Perfect') tipChance += 15;
  if (outcome.name === 'Bad' || outcome.name === 'Rough') tipChance = 0;

  let tip = 0;
  if (Math.random() * 100 < tipChance) {
    tip = TIP_MIN + Math.floor(Math.random() * (TIP_MAX - TIP_MIN + 1));
  }

  // Fuel used
  const fuelUsed = FUEL_PER_FLIGHT_MIN + Math.random() * (FUEL_PER_FLIGHT_MAX - FUEL_PER_FLIGHT_MIN);
  const fuelRounded = Math.round(fuelUsed * 10) / 10;

  return {
    outcome: outcome.name,
    message: outcome.message,
    earnings,
    tip,
    repDelta: outcome.repDelta,
    fuelUsed: fuelRounded,
  };
}

// ── End-game score ──────────────────────────────────────────────

export function calculateScore(state) {
  const gearTotal = (state.gear.wing?.tier || 0)
    + (state.gear.motor?.tier || 0)
    + (state.gear.accessory?.tier || 0);

  return Math.round(
    state.stats.totalEarnings
    + state.cash * 2
    + state.reputation * 50
    + state.stats.totalFlights * 25
    + gearTotal * 200
    - state.stats.customersTurnedAway * 30
  );
}
