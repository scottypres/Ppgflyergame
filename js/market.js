// market.js — Market day: gear listings, price fluctuation, buy/sell

import { getState, mutate } from './state.js';
import { GEAR, MARKET_PRICE_VARIANCE, FUEL_PRICE_MIN, FUEL_PRICE_MAX, MAX_FUEL } from './data.js';
import { showScreen } from './screens.js';

let activeEvent = null;

// ── Enter market: generate prices and render ────────────────────

export function enterMarket(eventEffects = {}) {
  activeEvent = eventEffects;
  generateMarketPrices(eventEffects);
  renderMarket();
}

// ── Generate randomized market prices ───────────────────────────

function generateMarketPrices(eventEffects = {}) {
  const priceMultiplier = eventEffects.priceMultiplier || 1;
  const fuelDiscount = eventEffects.fuelDiscount || 1;

  mutate(s => {
    s.market.wings = generateGearListings('wing', priceMultiplier);
    s.market.motors = generateGearListings('motor', priceMultiplier);
    s.market.accessories = generateGearListings('accessory', priceMultiplier);
    s.market.fuelPrice = Math.round(
      (FUEL_PRICE_MIN + Math.random() * (FUEL_PRICE_MAX - FUEL_PRICE_MIN)) * fuelDiscount
    );
  });
}

function generateGearListings(category, multiplier) {
  return GEAR[category]
    .filter(g => g.tier > 0) // Don't sell tier 0 (starter gear)
    .map(g => {
      const variance = 1 + (Math.random() * 2 - 1) * MARKET_PRICE_VARIANCE;
      const price = Math.round(g.basePrice * variance * multiplier);
      return {
        tier: g.tier,
        name: g.name,
        price,
        acceptBonus: g.acceptBonus,
        tipBonus: g.tipBonus,
        flightBonus: g.flightBonus,
        category,
      };
    });
}

// ── Render market UI ────────────────────────────────────────────

function renderMarket() {
  const s = getState();

  // Fuel section
  renderFuelSection(s);

  // Gear sections
  renderGearSection('wing', s.market.wings, s.gear.wing, s);
  renderGearSection('motor', s.market.motors, s.gear.motor, s);
  renderGearSection('accessory', s.market.accessories, s.gear.accessory, s);

  // Update cash display
  const cashEl = document.getElementById('market-cash');
  if (cashEl) cashEl.textContent = `$${s.cash.toLocaleString()}`;

  // Update fuel display
  const fuelEl = document.getElementById('market-fuel');
  if (fuelEl) fuelEl.textContent = `${s.fuel} / ${MAX_FUEL} gal`;
}

function renderFuelSection(s) {
  const container = document.getElementById('fuel-listings');
  if (!container) return;

  const canBuy = s.fuel < MAX_FUEL;
  const buyAmount = Math.min(5, MAX_FUEL - s.fuel);
  const cost = s.market.fuelPrice * buyAmount;

  container.innerHTML = `
    <div class="market-item">
      <div class="market-item-info">
        <span class="market-item-name">Aviation Fuel</span>
        <span class="market-item-price">$${s.market.fuelPrice}/gal</span>
      </div>
      <div class="market-item-detail">Current: ${s.fuel} / ${MAX_FUEL} gal</div>
      ${canBuy && s.cash >= s.market.fuelPrice ? `
        <button class="btn btn-small" data-buy-fuel="${buyAmount}">
          Buy ${buyAmount} gal ($${cost})
        </button>
      ` : `
        <span class="market-item-detail">${!canBuy ? 'Tank full' : 'Not enough cash'}</span>
      `}
    </div>
  `;
}

function renderGearSection(category, listings, currentGear, s) {
  const container = document.getElementById(`${category}-listings`);
  if (!container) return;

  const currentTier = currentGear?.tier || 0;
  const currentName = GEAR[category][currentTier]?.name || 'None';

  let html = `<div class="market-current">Current: <strong>${currentName}</strong></div>`;

  if (listings.length === 0) {
    html += '<div class="market-item-detail">Nothing available</div>';
  }

  listings.forEach(item => {
    const isUpgrade = item.tier > currentTier;
    const isDowngrade = item.tier < currentTier;
    const isSame = item.tier === currentTier;
    const canAfford = s.cash >= item.price;

    // Sell value for current gear if downgrading
    const currentGearDef = GEAR[category][currentTier];
    const sellValue = currentTier > 0 ? Math.round(currentGearDef.basePrice * 0.4) : 0;

    html += `
      <div class="market-item ${isUpgrade ? 'market-item--upgrade' : ''} ${isDowngrade ? 'market-item--downgrade' : ''}">
        <div class="market-item-info">
          <span class="market-item-name">${item.name}</span>
          <span class="market-item-price">$${item.price.toLocaleString()}</span>
        </div>
        <div class="market-item-stats">
          +${item.acceptBonus}% acceptance &middot; +${item.tipBonus}% tips
          ${item.flightBonus ? ` &middot; +${item.flightBonus} flight capacity` : ''}
        </div>
        ${isSame ? '<span class="market-item-detail">Already equipped</span>' : ''}
        ${isUpgrade && canAfford ? `<button class="btn btn-small btn-success" data-buy-gear='${JSON.stringify({ category, tier: item.tier, price: item.price })}'>Buy & Equip</button>` : ''}
        ${isUpgrade && !canAfford ? '<span class="market-item-detail negative">Not enough cash</span>' : ''}
        ${isDowngrade ? `<span class="market-item-detail">Downgrade</span>` : ''}
      </div>
    `;
  });

  // Sell current gear option
  if (currentTier > 0) {
    const sellValue = Math.round(GEAR[category][currentTier].basePrice * 0.4);
    html += `
      <div class="market-item market-item--sell">
        <div class="market-item-info">
          <span class="market-item-name">Sell ${currentName}</span>
          <span class="market-item-price positive">+$${sellValue}</span>
        </div>
        <button class="btn btn-small btn-warning" data-sell-gear='${JSON.stringify({ category, tier: currentTier, value: sellValue })}'>Sell</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ── Market event handlers ───────────────────────────────────────

export function setupMarketHandlers() {
  const marketEl = document.querySelector('[data-screen="market"]');
  if (!marketEl) return;

  marketEl.addEventListener('click', (e) => {
    // Buy fuel
    const fuelBtn = e.target.closest('[data-buy-fuel]');
    if (fuelBtn) {
      const amount = parseInt(fuelBtn.dataset.buyFuel);
      buyFuel(amount);
      return;
    }

    // Buy gear
    const buyBtn = e.target.closest('[data-buy-gear]');
    if (buyBtn) {
      const data = JSON.parse(buyBtn.dataset.buyGear);
      buyGear(data.category, data.tier, data.price);
      return;
    }

    // Sell gear
    const sellBtn = e.target.closest('[data-sell-gear]');
    if (sellBtn) {
      const data = JSON.parse(sellBtn.dataset.sellGear);
      sellGear(data.category, data.tier, data.value);
      return;
    }

    // Leave market
    const leaveBtn = e.target.closest('[data-action="leave-market"]');
    if (leaveBtn) {
      leaveMarket();
      return;
    }
  });
}

function buyFuel(amount) {
  const s = getState();
  const cost = s.market.fuelPrice * amount;

  if (s.cash < cost) return;
  if (s.fuel + amount > MAX_FUEL) return;

  mutate(st => {
    st.cash -= cost;
    st.fuel = Math.min(MAX_FUEL, st.fuel + amount);
  });

  renderMarket();
}

function buyGear(category, tier, price) {
  const s = getState();
  if (s.cash < price) return;

  const gearDef = GEAR[category][tier];
  if (!gearDef) return;

  mutate(st => {
    st.cash -= price;
    if (category === 'accessory') {
      st.gear.accessory = { tier, name: gearDef.name };
    } else {
      st.gear[category] = { tier, name: gearDef.name };
    }
    st.stats.gearUpgrades++;
  });

  renderMarket();
}

function sellGear(category, tier, value) {
  mutate(st => {
    st.cash += value;
    if (category === 'accessory') {
      st.gear.accessory = null;
    } else {
      st.gear[category] = { tier: 0, name: GEAR[category][0].name };
    }
  });

  renderMarket();
}

function leaveMarket() {
  mutate(st => {
    st.stats.daysWorked++;
  });
  showScreen('day-summary');
}
