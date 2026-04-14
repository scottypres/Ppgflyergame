// data.js — Static data tables: gear, events, customer types, balance constants

// ── Balance constants ───────────────────────────────────────────

export const STARTING_CASH = 500;
export const STARTING_REP = 50;
export const STARTING_FUEL = 10;
export const MAX_FUEL = 20;
export const FUEL_PER_FLIGHT_MIN = 2;
export const FUEL_PER_FLIGHT_MAX = 3;
export const BASE_ACCEPTANCE = 60;
export const MIN_ACCEPTANCE = 15;
export const MAX_ACCEPTANCE = 95;
export const TIP_BASE_CHANCE = 20;
export const TIP_MIN = 20;
export const TIP_MAX = 60;
export const EVENT_CHANCE = 0.20;

// ── Pricing tiers ───────────────────────────────────────────────

export const PRICES = {
  low:    { amount: 80,  acceptMod: 30,  label: 'Budget ($80)' },
  medium: { amount: 150, acceptMod: 0,   label: 'Standard ($150)' },
  high:   { amount: 250, acceptMod: -25, label: 'Premium ($250)' },
};

// ── Gear definitions ────────────────────────────────────────────

export const GEAR = {
  wing: [
    { tier: 0, name: 'Rental Wing',      acceptBonus: 0,  tipBonus: 0,  flightBonus: 0, basePrice: 0 },
    { tier: 1, name: 'Sport Wing',       acceptBonus: 8,  tipBonus: 5,  flightBonus: 0, basePrice: 450 },
    { tier: 2, name: 'Premium Wing',     acceptBonus: 15, tipBonus: 10, flightBonus: 1, basePrice: 1100 },
  ],
  motor: [
    { tier: 0, name: 'Old Paramotor',    acceptBonus: 0,  tipBonus: 0,  flightBonus: 0, basePrice: 0 },
    { tier: 1, name: 'Reliable Motor',   acceptBonus: 5,  tipBonus: 3,  flightBonus: 0, basePrice: 550 },
    { tier: 2, name: 'Pro Paramotor',    acceptBonus: 10, tipBonus: 8,  flightBonus: 1, basePrice: 1300 },
  ],
  accessory: [
    { tier: 0, name: 'No Accessory',     acceptBonus: 0,  tipBonus: 0,  flightBonus: 0, basePrice: 0 },
    { tier: 1, name: 'GoPro Mount',      acceptBonus: 5,  tipBonus: 8,  flightBonus: 0, basePrice: 200 },
    { tier: 2, name: 'Deluxe Comfort Kit', acceptBonus: 10, tipBonus: 15, flightBonus: 0, basePrice: 550 },
  ],
};

// ── Weather effects ─────────────────────────────────────────────

export const WIND_EFFECTS = {
  low:    { acceptMod: 5,  flightShift: 1,  label: 'Calm', icon: '🍃' },
  medium: { acceptMod: 0,  flightShift: 0,  label: 'Moderate', icon: '💨' },
  high:   { acceptMod: -10, flightShift: -1, label: 'Strong', icon: '🌬️' },
};

export const AIR_EFFECTS = {
  smooth: { acceptMod: 5,   flightShift: 1,  label: 'Smooth', icon: '☀️' },
  active: { acceptMod: 0,   flightShift: 0,  label: 'Active', icon: '⛅' },
  gusty:  { acceptMod: -15, flightShift: -2, label: 'Gusty', icon: '🌪️' },
};

// ── Flight outcomes ─────────────────────────────────────────────

export const FLIGHT_OUTCOMES = [
  { name: 'Perfect',  baseWeight: 25, earningsMult: 1.0, repDelta: 3, message: 'An absolutely incredible flight! Your passenger is thrilled!' },
  { name: 'Good',     baseWeight: 45, earningsMult: 1.0, repDelta: 1, message: 'A solid, enjoyable flight. Happy passenger!' },
  { name: 'Okay',     baseWeight: 20, earningsMult: 1.0, repDelta: 0, message: 'A decent flight. Nothing special, but no complaints.' },
  { name: 'Rough',    baseWeight: 8,  earningsMult: 1.0, repDelta: -2, message: 'A bumpy ride. Your passenger looks a bit green...' },
  { name: 'Bad',      baseWeight: 2,  earningsMult: 0.5, repDelta: -5, message: 'A terrible experience. You had to refund half the price.' },
];

// ── Reputation brackets ─────────────────────────────────────────

export const REP_BRACKETS = [
  { min: 0,  max: 20,  customersBase: 1, customersMax: 2, label: 'Sketchy',   description: 'Word is you\'re dangerous' },
  { min: 21, max: 40,  customersBase: 2, customersMax: 3, label: 'Unknown',   description: 'People are skeptical' },
  { min: 41, max: 60,  customersBase: 3, customersMax: 4, label: 'Decent',    description: 'Decent reputation' },
  { min: 61, max: 80,  customersBase: 4, customersMax: 5, label: 'Popular',   description: 'People seek you out' },
  { min: 81, max: 100, customersBase: 5, customersMax: 7, label: 'Legendary', description: 'You\'re the local legend' },
];

// ── Customer types ──────────────────────────────────────────────

export const CUSTOMER_TYPES = [
  { type: 'nervous',    color: '#a8d8ea', size: 'small',  acceptMod: -10, tipMod: 5,   label: 'Nervous',   phrases: ['Is this safe?', 'How high do we go?', 'I\'m a little scared...'] },
  { type: 'confident',  color: '#ff6b6b', size: 'medium', acceptMod: 10,  tipMod: 0,   label: 'Confident', phrases: ['Let\'s do this!', 'I\'ve always wanted to fly!', 'Send it!'] },
  { type: 'excited',    color: '#ffd93d', size: 'medium', acceptMod: 5,   tipMod: 10,  label: 'Excited',   phrases: ['Oh my gosh, yes!', 'This is going to be amazing!', 'Take my money!'] },
  { type: 'skeptical',  color: '#6c5b7b', size: 'large',  acceptMod: -15, tipMod: -5,  label: 'Skeptical', phrases: ['How long have you been doing this?', 'What\'s your safety record?', 'Hmm, I\'m not sure...'] },
  { type: 'tourist',    color: '#88d8b0', size: 'medium', acceptMod: 0,   tipMod: 15,  label: 'Tourist',   phrases: ['We heard about you online!', 'Can we get photos?', 'This is on our bucket list!'] },
  { type: 'local',      color: '#c9b1ff', size: 'medium', acceptMod: 5,   tipMod: -5,  label: 'Local',     phrases: ['I see you out here every day.', 'My friend flew with you.', 'Give me the local discount!'] },
];

export const CUSTOMER_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn',
  'Avery', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Jamie',
  'Kendall', 'Logan', 'Marley', 'Noel', 'Parker', 'Reese', 'Sage', 'Tatum',
  'Val', 'Wren', 'Skyler', 'Drew', 'Jules', 'Robin', 'Kai', 'Ellis',
];

// ── Random events ───────────────────────────────────────────────

export const EVENTS = {
  tandem: [
    { id: 'perfect_sunset', title: 'Golden Hour', description: 'The sunset is absolutely stunning tonight. Passengers are in awe!', effects: { repBonus: 3 }, weight: 2 },
    { id: 'influencer', title: 'Influencer Alert', description: 'A social media influencer wants a flight. Great exposure if it goes well!', effects: { repBonus: 5, cashBonus: 50 }, weight: 1 },
    { id: 'festival', title: 'Local Festival', description: 'There\'s a festival nearby. More people are interested in flying today!', effects: { extraCustomers: 2 }, weight: 2 },
    { id: 'wind_shift', title: 'Sudden Wind Shift', description: 'Wind picks up unexpectedly. You lose one potential customer.', effects: { lostCustomers: 1 }, weight: 2 },
    { id: 'motor_hiccup', title: 'Motor Trouble', description: 'Your motor sputters during preflight check. You lose time fixing it.', effects: { lostCustomers: 1, fuelLoss: 1 }, weight: 1 },
    { id: 'repeat_customer', title: 'Repeat Customer', description: 'A previous passenger returns and brings a friend! They\'re easy to please.', effects: { extraCustomers: 1, repBonus: 2 }, weight: 2 },
    { id: 'perfect_air', title: 'Magic Air', description: 'Thermals are glass-smooth today. Every flight is incredible.', effects: { flightBoost: 2 }, weight: 1 },
    { id: 'camera_crew', title: 'Camera Crew', description: 'A local news crew wants to film your operation. Free publicity!', effects: { repBonus: 4 }, weight: 1 },
  ],
  market: [
    { id: 'clearance', title: 'Clearance Sale!', description: 'A shop is closing down. Everything is 40% off!', effects: { priceMultiplier: 0.6 }, weight: 2 },
    { id: 'rare_wing', title: 'Rare Find', description: 'A pilot is selling a barely-used premium wing at a great price.', effects: { priceMultiplier: 0.7 }, weight: 1 },
    { id: 'price_surge', title: 'Supply Shortage', description: 'Everyone\'s buying gear today. Prices are inflated.', effects: { priceMultiplier: 1.4 }, weight: 2 },
    { id: 'fuel_deal', title: 'Fuel Deal', description: 'A trucker has extra aviation fuel. Cheap gas today!', effects: { fuelDiscount: 0.5 }, weight: 2 },
    { id: 'scam_warning', title: 'Sketchy Seller', description: 'Watch out — someone is selling knockoff gear at full price.', effects: {} , weight: 1 },
    { id: 'networking', title: 'Pilot Meetup', description: 'You meet experienced pilots who share tips. Your reputation grows.', effects: { repBonus: 3 }, weight: 2 },
  ],
  rest: [
    { id: 'viral_video', title: 'Viral Video', description: 'An old passenger\'s video goes viral online!', effects: { repBonus: 5 }, weight: 2 },
    { id: 'bad_review', title: 'Bad Review', description: 'Someone posted a negative review about you online.', effects: { repBonus: -3 }, weight: 1 },
    { id: 'word_of_mouth', title: 'Word of Mouth', description: 'Locals are talking about your flights. Your name is getting around.', effects: { repBonus: 2 }, weight: 2 },
    { id: 'maintenance', title: 'Maintenance Day', description: 'You spend the day maintaining your gear. Everything runs smoother.', effects: { fuelSave: 1 }, weight: 2 },
  ],
};

// ── Market price fluctuation ranges ─────────────────────────────

export const MARKET_PRICE_VARIANCE = 0.35; // ±35% from base price
export const FUEL_PRICE_MIN = 3;
export const FUEL_PRICE_MAX = 8;
