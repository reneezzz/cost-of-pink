import { BOARD, CARDS, CARD_BY_ID, FINISH, CATEGORIES } from './game-data.js';
export const SAVE_VERSION = 1;
const copy = s => structuredClone(s);
const label = p => `${p.id} · ${p.name}`;
function log(s, text) { s.history.push({ turn: s.turn, text }); s.history = s.history.slice(-200); }
function requirePhase(s, phase) { if (s.phase !== phase) throw new Error(`Expected ${phase}, got ${s.phase}`); }
export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createGame(names = ['玩家 A', '玩家 B'], rng = Math.random) {
  const first = rng() < .5 ? 0 : 1;
  const players = names.slice(0, 2).map((name, index) => ({
    id: index ? 'B' : 'A', name: String(name).trim().slice(0, 18) || `玩家 ${index ? 'B' : 'A'}`,
    role: index === first ? 'blue' : 'pink', balance: 100, position: 0,
    income: 0, spent: 0, switches: 0,
  }));
  if (players.length !== 2) throw new Error('Two players required');
  const decks = {};
  for (const category of Object.keys(CATEGORIES).filter(c => c !== 'switch'))
    decks[category] = { pile: shuffle(CARDS.filter(c => c.category === category).map(c => c.id), rng), discard: [] };
  const s = { version: SAVE_VERSION, players, active: first, turn: 1, phase: 'roll', dice: null,
    decks, cardId: null, winner: null, endReason: null, history: [], lastResult: null, move: null };
  log(s, `${label(players[first])} 分配到 Blue，先行动。双方各有 $100。`);
  return s;
}
export function destination(position, steps) {
  if (!Number.isInteger(position) || position < 0 || position > FINISH || !Number.isInteger(steps) || steps < 0 || steps > FINISH)
    throw new Error('Invalid movement');
  const target = position + steps;
  return target > FINISH ? FINISH - (target - FINISH) : target;
}
export function rollTurn(state, rng = Math.random) {
  requirePhase(state, 'roll');
  const s = copy(state), p = s.players[s.active];
  s.dice = Math.floor(rng() * 6) + 1;
  const from = p.position;
  p.position = destination(from, s.dice);
  s.move = { from, to: p.position, bounced: from + s.dice > FINISH };
  s.lastResult = null;
  log(s, `${label(p)} 掷出 ${s.dice} 点${s.move.bounced ? '，超出终点后退回' : ''}，到达${p.position === FINISH ? '终点' : `第 ${p.position} 格`}。`);
  if (p.position === FINISH) {
    s.phase = 'over'; s.winner = s.active; s.endReason = 'finish';
    log(s, `${label(p)} 恰好到达终点，获胜！`);
  } else {
    s.phase = BOARD[p.position].category === 'switch' ? 'switch' : 'draw';
  }
  return s;
}
export function revealCard(state, rng = Math.random) {
  requirePhase(state, 'draw');
  const s = copy(state), category = BOARD[s.players[s.active].position].category, deck = s.decks[category];
  if (!deck.pile.length) { deck.pile = shuffle(deck.discard, rng); deck.discard = []; }
  if (!deck.pile.length) throw new Error('Empty category');
  s.cardId = deck.pile.pop(); s.phase = 'settle';
  return s;
}
export function settleCard(state) {
  requirePhase(state, 'settle');
  const s = copy(state), p = s.players[s.active], c = CARD_BY_ID[s.cardId], amount = c[p.role];
  const before = p.balance;
  p.balance = Math.max(0, before + amount);
  p.income += Math.max(0, amount); p.spent += Math.min(before, Math.max(0, -amount));
  s.lastResult = { name: c.name, amount, before, after: p.balance, role: p.role };
  s.decks[c.category].discard.push(c.id);
  log(s, `${label(p)}（${p.role === 'blue' ? 'Blue' : 'Pink'}）：${c.name}，${amount > 0 ? `收入 $${amount}` : amount < 0 ? `应付 $${-amount}` : '无需支付'}，余额 $${p.balance}。`);
  s.cardId = null;
  if (amount < 0 && before + amount <= 0) {
    s.phase = 'over'; s.winner = 1 - s.active; s.endReason = 'bankrupt';
    log(s, `${label(p)} ${before + amount < 0 ? '无法支付本次费用' : '余额耗尽'}，${label(s.players[s.winner])} 获胜。`);
  } else s.phase = 'next';
  return s;
}
export function exchangeRoles(state) {
  requirePhase(state, 'switch');
  const s = copy(state);
  for (const p of s.players) { p.role = p.role === 'blue' ? 'pink' : 'blue'; p.switches++; }
  log(s, `双方交换角色：A 现在是 ${s.players[0].role === 'blue' ? 'Blue' : 'Pink'}，B 现在是 ${s.players[1].role === 'blue' ? 'Blue' : 'Pink'}。位置和余额不变。`);
  s.lastResult = { name: '角色已交换', switch: true }; s.phase = 'next';
  return s;
}
export function nextTurn(state) {
  requirePhase(state, 'next');
  const s = copy(state); s.active = 1 - s.active; s.turn++; s.phase = 'roll'; s.cardId = null;
  s.dice = null; s.lastResult = null; s.move = null;
  return s;
}
export function isValidSave(s) {
  if (!s || s.version !== SAVE_VERSION || !Array.isArray(s.players) || s.players.length !== 2 || ![0, 1].includes(s.active)
    || !['roll', 'draw', 'settle', 'switch', 'next', 'over'].includes(s.phase) || !Number.isInteger(s.turn) || s.turn < 1) return false;
  if (!s.players.every((p, i) => p.id === (i ? 'B' : 'A') && typeof p.name === 'string' && p.name.length <= 18
    && ['blue', 'pink'].includes(p.role) && Number.isInteger(p.balance) && p.balance >= 0
    && Number.isInteger(p.position) && p.position >= 0 && p.position <= FINISH
    && ['income','spent','switches'].every(k => Number.isInteger(p[k]) && p[k] >= 0))) return false;
  if (s.players[0].role === s.players[1].role || !Array.isArray(s.history) || !s.history.every(h => typeof h.text === 'string' && Number.isInteger(h.turn))) return false;
  const category = BOARD[s.players[s.active].position].category;
  if (['draw','settle'].includes(s.phase) && !s.decks?.[category]) return false;
  if (s.phase === 'switch' && category !== 'switch') return false;
  if (s.phase === 'settle' && CARD_BY_ID[s.cardId]?.category !== category) return false;
  if (s.phase !== 'settle' && s.cardId != null) return false;
  if (s.phase === 'over' && (![0,1].includes(s.winner) || !['finish','bankrupt'].includes(s.endReason))) return false;
  for (const key of Object.keys(CATEGORIES).filter(c => c !== 'switch')) {
    const deck = s.decks?.[key];
    if (!deck || !Array.isArray(deck.pile) || !Array.isArray(deck.discard)) return false;
    const all = [...deck.pile, ...deck.discard, ...(s.phase === 'settle' && category === key ? [s.cardId] : [])];
    if (all.length !== CARDS.filter(c => c.category === key).length || new Set(all).size !== all.length || !all.every(id => CARD_BY_ID[id]?.category === key)) return false;
  }
  return true;
}
