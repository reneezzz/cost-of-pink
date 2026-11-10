import { BOARD, CATEGORIES, CARD_BY_ID, FINISH } from './game-data.js';
import { createGame, rollTurn, revealCard, settleCard, exchangeRoles, nextTurn, isValidSave } from './game-engine.js';
import { createDie } from './dice.js';

const $ = id => document.getElementById(id);
const KEY = 'cost-of-pink-v1';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleName = p => p.role === 'blue' ? 'Blue' : 'Pink';
const roleColor = p => p.role === 'blue' ? '#4053a5' : '#e653a7';
const money = n => n > 0 ? `+$${n}` : n < 0 ? `−$${-n}` : '$0';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const die = createDie($('dice'));
let state = null, busy = false, storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (isValidSave(saved)) state = saved;
} catch { storageAvailable = false; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
function primary(text, action, pink = false) {
  return `<button class="primary${pink ? ' pink' : ''}" data-action="${action}"${busy ? ' disabled' : ''}>${text}<span aria-hidden="true">→</span></button>`;
}
function kicker(category) {
  const c = CATEGORIES[category];
  return `<div class="event-kicker"><i class="category-dot" style="--category:${c.color}"></i>第 ${state.players[state.active].position} 格 · ${c.name}</div>`;
}
function updateTokens() {
  const markers = $('board-markers');
  if (!state) { markers.innerHTML = ''; return; }
  if (!markers.children.length) {
    markers.innerHTML = state.players.map(p => `<g id="token-${p.id}" class="token"><ellipse class="token-ring" cx="0" cy="24" rx="38" ry="13"/><image class="token-piece" x="-36" y="-70" width="72" height="100" preserveAspectRatio="xMidYMid meet"/><g class="token-badge" transform="translate(24 23)"><circle r="12"/><text>${p.id}</text></g></g>`).join('');
  }
  const same = state.players[0].position === state.players[1].position;
  state.players.forEach((p, i) => {
    const cell = BOARD[p.position], token = $(`token-${p.id}`);
    const offset = same ? (i ? 36 : -36) : 0;
    token.setAttribute('transform', `translate(${cell.x + offset} ${cell.y + 24})`);
    token.setAttribute('aria-label', `${p.id} ${p.name}，${roleName(p)}，${p.position === 0 ? '起点' : `第 ${p.position} 格`}`);
    token.querySelector('.token-piece').setAttribute('href', `./assets/tokens/${p.role}.png`);
    token.querySelector('.token-ring').style.opacity = state.active === i && state.phase !== 'over' ? '1' : '0';
  });
}
function renderPlayers() {
  const players = state?.players ?? [{id:'A', name:'玩家 A', role:'blue', balance:100, position:0}, {id:'B', name:'玩家 B', role:'pink', balance:100, position:0}];
  $('players').innerHTML = players.map((p,i) => `<article class="player${state?.active === i && state.phase !== 'over' ? ' active' : ''}" style="--role:${roleColor(p)}" aria-label="${escape(p.name)}，余额 ${p.balance} 美元">
    <div class="player-top"><span class="player-id">${p.id}</span><span class="player-name" title="${escape(p.name)}">${escape(p.name)}</span><span class="role-label">${state ? roleName(p) : '待分配'}</span></div>
    <div class="balance"><small>$</small>${p.balance}</div><div class="player-bottom"><span>${p.position === 0 ? '起点' : p.position === FINISH ? '终点' : `第 ${String(p.position).padStart(2,'0')} 格`}</span><span>${state?.active === i && state.phase !== 'over' ? '● 当前行动' : '剩余资金'}</span></div></article>`).join('');
}
function renderEvent() {
  if (!state) return `<div><div class="intro-art">✦</div><h3>准备好，一起出发。</h3><p>同一块棋盘，两种不同的经济条件。<br>每次交换角色，换一个角度继续前进。</p></div>${primary('开始双人游戏','setup')}`;
  const p = state.players[state.active], category = BOARD[p.position].category;
  if (state.phase === 'roll') return `<div class="draw-layout"><div><div class="event-kicker">轮到 ${escape(p.id)} · ${roleName(p)}</div><h3>${state.turn === 1 ? '从这里出发。' : '下一步，会遇见什么？'}</h3><p class="event-intro">掷出骰子，沿路线前进。<br>根据落点抽卡，看看生活带来什么。</p></div><div class="welcome-cards" aria-hidden="true"><img src="./assets/backs/selfcare.png" alt=""><img src="./assets/backs/health.png" alt=""></div></div>${primary('掷骰子','roll',p.role === 'pink')}`;
  if (state.phase === 'draw') return `<div class="draw-layout"><div>${kicker(category)}<h3>来到${CATEGORIES[category].name}。</h3><p>${state.move?.bounced ? '超出终点的步数已退回。' : `掷出 ${state.dice} 点，完成移动。`}<br>抽一张卡，阅读当前角色的情境。</p></div><img class="card-back" src="./assets/backs/${category}.png" alt="${CATEGORIES[category].name}卡背"></div>${primary(`抽取${CATEGORIES[category].name}卡`,'draw',p.role === 'pink')}`;
  if (state.phase === 'settle') {
    const c = CARD_BY_ID[state.cardId], amount = c[p.role];
    return `<div>${kicker(category)}<div class="card-title-row"><h3>${c.name}</h3><button class="art-link" data-art="${c.image}">查看原始卡面 ↗</button></div>
      ${c.detail ? `<p>${c.detail}</p>` : ''}<div class="amounts">${['blue','pink'].map(r => `<div class="amount ${r}${r === p.role ? ' selected' : ''}">${r === 'blue' ? 'Blue' : 'Pink'}${r === p.role ? '<small>你的角色</small>' : ''}<strong>${money(c[r])}</strong></div>`).join('')}</div>
      ${c.knowledge ? `<div class="knowledge"><b>✦ KNOWLEDGE · 想一想</b><p>${c.knowledge}</p></div>` : ''}
      ${amount < 0 && p.balance + amount <= 0 ? `<p style="margin-top:10px">${p.balance + amount < 0 ? `当前余额 $${p.balance}，不足以支付 $${-amount}。` : '支付后余额将为 $0。'}按规则，本次结算会结束对局。</p>` : ''}</div>
      ${primary(amount > 0 ? `确认，领取 $${amount}` : amount < 0 ? `确认，支付 $${-amount}` : '确认，无需支付','settle',p.role === 'pink')}`;
  }
  if (state.phase === 'switch') return `<div>${kicker('switch')}<div class="switch-symbol" aria-hidden="true">⇄</div><h3>换个角色，继续前进。</h3><p>双方交换 Blue／Pink。<br>你的位置、余额和行动顺序都保持不变。</p><div class="switch-pills">${state.players.map(q=>`<span>${q.id}：${roleName(q)} → ${q.role === 'blue' ? 'Pink' : 'Blue'}</span>`).join('')}</div></div>${primary('确认交换角色','switch')}`;
  if (state.phase === 'next') {
    const r = state.lastResult, next = state.players[1-state.active];
    return `<div><div class="event-kicker">本回合已完成</div><h3>${r.switch ? '角色已交换。' : `${r.name} · 已结算`}</h3>${r.switch ? `<div class="switch-symbol">⇄</div><p>${p.id} 现在是 ${roleName(p)}，余额仍为 $${p.balance}。</p>` : `<div class="result-value">$${r.before} <span style="font-size:24px">→</span> $${r.after}</div><p>${r.amount > 0 ? '收入已到账。' : r.amount < 0 ? '费用已扣除。' : '本次无需支付费用。'}可以和对方聊聊刚才的情境。</p>`}</div>${primary(`交给 ${escape(next.name)} · 下一回合`,'next')}`;
  }
  const winner = state.players[state.winner], loser = state.players[1-state.winner];
  return `<div><div class="event-kicker">本局结束 · 第 ${state.turn} 回合</div><div class="intro-art">✦</div><h3>${escape(winner.name)} 获胜。</h3><p>${state.endReason === 'finish' ? '恰好到达了终点。' : `${escape(loser.name)} ${state.lastResult?.before + state.lastResult?.amount < 0 ? '无法支付本次费用' : '余额耗尽'}，本局结束。`}</p><p style="margin-top:12px">${escape(state.players[0].name)} 剩余 $${state.players[0].balance} · ${escape(state.players[1].name)} 剩余 $${state.players[1].balance}</p></div>${primary('再玩一局','setup')}`;
}
function render() {
  renderPlayers(); updateTokens();
  $('turn-number').textContent = state ? `TURN ${String(state.turn).padStart(2,'0')} · ${state.phase === 'over' ? '本局结束' : '当前回合'}` : '准备开始';
  $('turn-name').textContent = state ? (state.phase === 'over' ? '停下来，聊聊这段经历。' : `${state.players[state.active].name} 的回合`) : '邀请一位朋友，一起玩。';
  die.show(state?.dice);
  $('event-panel').innerHTML = renderEvent();
  $('history').innerHTML = state ? [...state.history].reverse().map(h => `<li><span class="history-turn">${String(h.turn).padStart(2,'0')}</span><span>${escape(h.text)}</span></li>`).join('') : '<li>开始游戏后，这里会记录双方的每一步。</li>';
  $('position-summary').textContent = state ? state.players.map(p => `${p.id} · ${p.position === 0 ? '起点' : p.position === FINISH ? '终点' : `${p.position} / 40`}`).join('　') : '每一步，都有不同的经历。';
  $('save-note').textContent = storageAvailable ? '进度自动保存在这台设备的浏览器中' : '当前浏览器无法保存进度，请保持此页面打开';
  $('restart-button').disabled = busy;
}
function openSetup() {
  if (busy) return;
  $('setup-cancel').hidden = !state;
  if (state) {
    $('setup-form').elements.playerA.value = state.players[0].name;
    $('setup-form').elements.playerB.value = state.players[1].name;
  }
  $('setup-dialog').showModal();
}
function showArt(path) {
  $('art-preview').src = `./${path}`;
  $('art-preview').alt = path.includes('board') ? '原始棋盘设计' : '原始卡牌设计';
  $('art-dialog').classList.toggle('board-art', path.includes('board'));
  $('art-dialog').showModal();
}
function toast(text) {
  $('toast').textContent = text; $('toast').hidden = false;
  setTimeout(() => $('toast').hidden = true, 4000);
}
$('event-panel').addEventListener('click', async event => {
  const art = event.target.closest('[data-art]');
  if (art) { showArt(art.dataset.art); return; }
  const button = event.target.closest('[data-action]');
  if (!button || busy) return;
  const action = button.dataset.action;
  if (action === 'setup') { openSetup(); return; }
  busy = true; button.disabled = true; $('restart-button').disabled = true;
  try {
    if (action === 'roll') {
      const rolled = rollTurn(state);
      await die.roll(rolled.dice);
      state = rolled;
      save(); render(); await wait(reducedMotion ? 0 : 650);
    } else if (action === 'draw') state = revealCard(state);
    else if (action === 'settle') state = settleCard(state);
    else if (action === 'switch') state = exchangeRoles(state);
    else if (action === 'next') state = nextTurn(state);
    save();
  } catch (error) { console.error(error); toast('这一步未能完成，请再试一次。'); }
  finally {
    busy = false; $('dice').classList.remove('rolling'); render();
    $('event-panel').querySelector('.primary')?.focus({preventScroll:true});
  }
});
$('setup-form').addEventListener('submit', e => {
  e.preventDefault(); if (busy) return;
  state = createGame([e.currentTarget.elements.playerA.value,e.currentTarget.elements.playerB.value]);
  save(); $('setup-dialog').close(); render(); $('event-panel').querySelector('.primary')?.focus({preventScroll:true});
});
$('setup-cancel').addEventListener('click', () => $('setup-dialog').close());
$('setup-dialog').addEventListener('cancel', e => { if (!state) e.preventDefault(); });
$('restart-button').addEventListener('click', openSetup);
$('rules-button').addEventListener('click', () => $('rules-dialog').showModal());
$('board-zoom').addEventListener('click', () => showArt('assets/board.png'));
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).close()));
render();
if (!state) openSetup();
