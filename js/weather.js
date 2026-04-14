// weather.js — Weather generation and effect lookups

import { mutate } from './state.js';

const WIND_OPTIONS = ['low', 'medium', 'high'];
const AIR_OPTIONS = ['smooth', 'active', 'gusty'];

// Weighted random — bias toward moderate weather
const WIND_WEIGHTS = [35, 45, 20];
const AIR_WEIGHTS = [30, 45, 25];

function weightedPick(options, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return options[i];
  }
  return options[options.length - 1];
}

export function generateWeather() {
  mutate(s => {
    s.weather.wind = weightedPick(WIND_OPTIONS, WIND_WEIGHTS);
    s.weather.airQuality = weightedPick(AIR_OPTIONS, AIR_WEIGHTS);
  });
}

export function getWeatherLabel(weather) {
  const windLabels = { low: 'Calm', medium: 'Moderate', high: 'Strong' };
  const airLabels = { smooth: 'Smooth', active: 'Active', gusty: 'Gusty' };
  return {
    wind: windLabels[weather.wind] || weather.wind,
    air: airLabels[weather.airQuality] || weather.airQuality,
  };
}

export function getWeatherIcons(weather) {
  const windIcons = { low: '🍃', medium: '💨', high: '🌬️' };
  const airIcons = { smooth: '☀️', active: '⛅', gusty: '🌪️' };
  return {
    wind: windIcons[weather.wind] || '',
    air: airIcons[weather.airQuality] || '',
  };
}
