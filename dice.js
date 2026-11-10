// A six-sided CSS die. Its landing face always uses the engine's roll result.
const FACES = {
  1: [5], 2: [1, 9], 3: [1, 5, 9],
  4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9],
};
const LANDING = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
const rotation = (x, y) => `rotateX(${x}deg) rotateY(${y}deg)`;

export function createDie(element) {
  element.innerHTML = `<div class="die-stage" aria-hidden="true"><div class="die-shadow"></div><div class="die-body"><div class="die-angle"><div class="die-cube">${Object.entries(FACES).map(([value, pips]) => `<div class="die-face face-${value}" data-value="${value}">${pips.map(p => `<i class="pip" style="grid-area:${Math.ceil(p / 3)} / ${(p - 1) % 3 + 1}"></i>`).join('')}</div>`).join('')}</div></div></div></div><span class="die-caption" aria-hidden="true">等待投掷</span>`;
  const cube = element.querySelector('.die-cube');
  const body = element.querySelector('.die-body');
  const shadow = element.querySelector('.die-shadow');
  const caption = element.querySelector('.die-caption');
  let last = [0, 0];

  function show(value) {
    last = LANDING[value] || LANDING[1];
    cube.style.transform = rotation(...last);
    element.dataset.value = value || '';
    element.setAttribute('aria-label', value ? `骰子：${value} 点` : '尚未掷骰子');
    caption.textContent = value ? `${value} 点` : '等待投掷';
  }

  async function roll(value) {
    if (!LANDING[value]) throw new Error('Invalid die result');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !cube.animate) { show(value); return; }
    const [x, y] = LANDING[value];
    element.classList.add('rolling');
    element.setAttribute('aria-label', '骰子正在翻滚');
    caption.textContent = '投掷中…';
    const options = { duration: 1400, fill: 'forwards' };
    const animations = [
      cube.animate([
        { transform: rotation(...last), offset: 0 },
        { transform: rotation(x + 190, y - 270), offset: .28 },
        { transform: rotation(x + 420, y - 500), offset: .53 },
        { transform: rotation(x + 650, y - 690), offset: .73 },
        { transform: rotation(x + 733, y - 726), offset: .87 },
        { transform: rotation(x + 716, y - 717), offset: .95 },
        { transform: rotation(x + 720, y - 720), offset: 1 },
      ], options),
      body.animate([
        { transform: 'translate3d(0,0,0) rotateZ(0deg)', offset: 0, easing: 'cubic-bezier(.15,.7,.3,1)' },
        { transform: 'translate3d(-24px,-45px,20px) rotateZ(-18deg)', offset: .28, easing: 'cubic-bezier(.5,0,.9,.6)' },
        { transform: 'translate3d(15px,5px,0) rotateZ(12deg)', offset: .53, easing: 'ease-out' },
        { transform: 'translate3d(8px,-18px,8px) rotateZ(-8deg)', offset: .68, easing: 'ease-in' },
        { transform: 'translate3d(-3px,3px,0) rotateZ(4deg)', offset: .80, easing: 'ease-out' },
        { transform: 'translate3d(0,-5px,0) rotateZ(-2deg)', offset: .90, easing: 'ease-in' },
        { transform: 'translate3d(0,0,0) rotateZ(0deg)', offset: 1 },
      ], options),
      shadow.animate([
        { transform: 'scale(1)', opacity: .23, offset: 0 },
        { transform: 'translateX(-16px) scale(.65)', opacity: .08, offset: .28 },
        { transform: 'translateX(12px) scale(1.15)', opacity: .28, offset: .53 },
        { transform: 'translateX(6px) scale(.85)', opacity: .13, offset: .68 },
        { transform: 'scale(1.06)', opacity: .25, offset: .80 },
        { transform: 'scale(1)', opacity: .23, offset: 1 },
      ], options),
    ];
    try { await Promise.all(animations.map(a => a.finished)); }
    finally {
      animations.forEach(a => a.cancel());
      element.classList.remove('rolling');
      show(value);
    }
  }
  return { show, roll };
}
