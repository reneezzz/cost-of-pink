import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, CARDS, FINISH } from '../game-data.js';
import { createGame, destination, rollTurn, revealCard, settleCard, exchangeRoles, nextTurn, isValidSave } from '../game-engine.js';
const game = () => createGame(['A','B'],()=>0);
function pendingCard(id, balance = 100) {
  let s = game(), card = CARDS.find(c=>c.id===id), d=s.decks[card.category];
  s.players[0].position=BOARD.find(c=>c.category===card.category).index;s.players[0].balance=balance;
  d.pile=d.pile.filter(v=>v!==id);s.cardId=id;s.phase='settle';
  return s;
}
test('39 event spaces, plus start and finish; exact artwork sequence',()=>{
  assert.equal(BOARD.length,41);assert.equal(BOARD[4].category,'transport');assert.equal(BOARD[5].category,'switch');
  assert.equal(BOARD[37].category,'office');assert.equal(BOARD[39].category,'selfcare');
});
test('design-based starting money; initial Blue always goes first',()=>{
  for(const n of [0,.9]){const s=createGame(['A','B'],()=>n);assert.equal(s.players[s.active].role,'blue');assert.deepEqual(s.players.map(p=>p.balance),[100,100]);assert.ok(isValidSave(s));}
});
test('overshoot bounces; passing finish never wins',()=>{
  assert.equal(destination(38,5),37);assert.equal(destination(38,2),40);
  const s=game();s.players[0].position=38;const r=rollTurn(s,()=>.7);assert.equal(r.dice,5);assert.equal(r.phase,'draw');assert.equal(r.winner,null);assert.equal(s.players[0].position,38);
});
test('exact finish ends game without drawing',()=>{
  const s=game();s.players[0].position=39;const r=rollTurn(s,()=>0);assert.equal(r.phase,'over');assert.equal(r.winner,0);assert.equal(r.endReason,'finish');assert.ok(isValidSave(r));
});
test('switch preserves player positions, balances and alternation',()=>{
  const s=game();s.players[0].position=5;s.players[1].position=3;s.players[0].balance=47;s.players[1].balance=80;s.phase='switch';
  const r=exchangeRoles(s);assert.deepEqual(r.players.map(p=>p.position),[5,3]);assert.deepEqual(r.players.map(p=>p.balance),[47,80]);assert.deepEqual(r.players.map(p=>p.role),['pink','blue']);assert.equal(nextTurn(r).active,1);assert.ok(isValidSave(r));
});
test('bankruptcy at exactly zero and at insufficient balance',()=>{
  for(const balance of [8,7]){const r=settleCard(pendingCard('painkillers',balance));assert.equal(r.players[0].balance,0);assert.equal(r.winner,1);assert.equal(r.endReason,'bankrupt');assert.ok(isValidSave(r));}
});
test('salary uses current role; performance may charge Pink',()=>{
  let s=pendingCard('salary');s.players[0].role='pink';s.players[1].role='blue';const r=settleCard(s);assert.equal(r.players[0].balance,180);
  s=pendingCard('performance');s.players[0].role='pink';s.players[1].role='blue';assert.equal(settleCard(s).players[0].balance,85);
});
test('jacket Pink total includes bag; zero fee does not skip next turn',()=>{
  let s=pendingCard('jacket');s.players[0].role='pink';s.players[1].role='blue';assert.equal(settleCard(s).players[0].balance,80);
  s=settleCard(pendingCard('night-travel'));assert.equal(s.players[0].balance,100);assert.equal(s.phase,'next');assert.equal(nextTurn(s).active,1);
});
test('transport has no unprinted extra movement',()=>{
  const s=pendingCard('public-transit');const r=settleCard(s);assert.equal(r.players[0].position,s.players[0].position);assert.equal(r.phase,'next');
});
test('no replacement until category depleted; then reshuffle',()=>{
  let s=game();const seen=[];
  for(let i=0;i<5;i++){
    s.active=0;s.players[0].position=7;s.phase='draw';s=revealCard(s,()=>0);seen.push(s.cardId);assert.ok(isValidSave(s));s=settleCard(s);assert.ok(isValidSave(s));
  }
  assert.equal(new Set(seen.slice(0,4)).size,4);assert.ok(seen.slice(0,4).includes(seen[4]));
});
test('wrong-phase actions cannot double-charge or double-roll',()=>{
  const s=rollTurn(game(),()=>0);assert.throws(()=>rollTurn(s));const c=revealCard(s,()=>0);assert.throws(()=>revealCard(c));const r=settleCard(c);assert.throws(()=>settleCard(r));
});
test('invalid saved states rejected, mid-card refresh remains valid',()=>{
  assert.equal(isValidSave(null),false);const s=game();s.players[1].role='blue';assert.equal(isValidSave(s),false);
  const pending=pendingCard('shampoo');assert.ok(isValidSave(JSON.parse(JSON.stringify(pending))));pending.decks.selfcare.pile.push('shampoo');assert.equal(isValidSave(pending),false);
});
test('200 seeded games complete with valid saves and no negative balances',()=>{
  for(let seed=1;seed<=200;seed++){
    let value=seed;const rng=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/2**32;};
    let s=createGame(['A','B'],rng),actions=0;
    while(s.phase!=='over'&&actions++<3000){
      s=({roll:()=>rollTurn(s,rng),draw:()=>revealCard(s,rng),settle:()=>settleCard(s),switch:()=>exchangeRoles(s),next:()=>nextTurn(s)})[s.phase]();
      assert.ok(isValidSave(s),`seed ${seed}, phase ${s.phase}`);
    }
    assert.equal(s.phase,'over');assert.ok(s.players.every(p=>p.balance>=0));
  }
});
