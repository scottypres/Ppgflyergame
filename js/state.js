// state.js — Single source of truth for all game state

const VERSION = 1;

const DEFAULT_STATE = {
  version: VERSION,
  runLength: 20,

  // Core stats
  day: 1,
  cash: 500,
  reputation: 50,
  fuel: 10,

  // Equipped gear (tier 0=basic, 1=improved, 2=premium)
  gear: {
    wing:      { tier: 0, name: 'Rental Wing' },
    motor:     { tier: 0, name: 'Old Paramotor' },
    accessory: null,
  },

  // Today's weather (regenerated each day)
  weather: {
    wind: 'low',
    airQuality: 'smooth',
  },

  // Current day action tracking
  todayAction: null,
  todayResults: {
    flights: 0,
    earnings: 0,
    tips: 0,
    repChange: 0,
    events: [],
    customers: [],
  },

  // Cumulative stats for end-game score
  stats: {
    totalFlights: 0,
    totalEarnings: 0,
    totalTips: 0,
    customersServed: 0,
    customersTurnedAway: 0,
    daysWorked: 0,
    daysRested: 0,
    gearUpgrades: 0,
    bestSingleDay: 0,
  },

  // Market state (regenerated on market visit)
  market: {
    wings: [],
    motors: [],
    accessories: [],
    fuelPrice: 5,
  },

  // One-time flags
  flags: {
    tutorialSeen: false,
    firstFlightDone: false,
    firstUpgrade: false,
  },
};

let state = structuredClone(DEFAULT_STATE);

export function getState() {
  return state;
}

export function mutate(fn) {
  fn(state);
  save();
}

export function resetState(runLength = 20) {
  state = structuredClone(DEFAULT_STATE);
  state.runLength = runLength;
  save();
}

export function resetTodayResults() {
  state.todayResults = {
    flights: 0,
    earnings: 0,
    tips: 0,
    repChange: 0,
    events: [],
    customers: [],
  };
}

function save() {
  try {
    localStorage.setItem('paramotor-hustle', JSON.stringify(state));
  } catch (e) {
    // localStorage might be full or unavailable
  }
}

export function load() {
  try {
    const raw = localStorage.getItem('paramotor-hustle');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === VERSION) {
        state = parsed;
        return true;
      }
    }
  } catch (e) {
    // Corrupted save, start fresh
  }
  return false;
}

export function clearSave() {
  localStorage.removeItem('paramotor-hustle');
}
