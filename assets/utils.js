const enc = new TextEncoder();
async function sha256(text) {
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function normalize(s) { return (s || '').trim(); }

// Toast
function toast(msg, variant, duration) {
  let el = document.getElementById('starlight-toast');
  if (!el) { el = document.createElement('div'); el.id = 'starlight-toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.className = 'toast ' + (variant || 'info');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration || 3000);
}

// Progress
function getProgress() {
  try { return JSON.parse(localStorage.getItem('starlight_progress') || '{}'); } catch(e) { return {}; }
}
function setSolved(id) {
  const p = getProgress(); p[id] = true;
  localStorage.setItem('starlight_progress', JSON.stringify(p));
}
function getProgressCount() {
  const p = getProgress();
  return (p.web ? 1 : 0) + (p.misc ? 1 : 0) + (p.crypto ? 1 : 0);
}
function updateProgressBar() {
  const bar = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (!bar || !label) return;
  const n = getProgressCount();
  bar.style.width = (n / 3 * 100) + '%';
  const msgs = ['还没开始？键盘上那个 F12 可以按的。', '一道过了，还有两道在等你。', '两道了！最后一道把你按在地上摩擦过吗？', '全过了！你是真的强，还是看了答案？'];
  label.textContent = '进度: ' + n + '/3 — ' + msgs[n];
}

// Roast messages
const ROASTS = [
  'emmmm…… 你离真相的距离，比数学考零分还要远。',
  '你这个答案，我就给一个字：祛豱。',
  '看到你的答案，出题人笑得像个的见了藻的花。',
  '建议先去洗个脸，回来再试。',
  '你确定你来的是 CTF 而不是随机抽签？',
  '不是我说你，你这个答案连蜜罐都不屑得骗。',
  '如果这个答案是一道菜，那它就是隔夜的油条。',
  '你的答案像极了我的早起——充满遗憾。'
];
const HONEY_MSGS = [
  '恭喜你！等等…… 这好像是出题人故意放在那里骗你的狗粮。',
  '蜜罐警报！你拿到的是假货，出题人正在屏幕后笑出声。',
  '经典蜜罐。你的勇气值得肯定，但你的判断力不值。',
  '这个假 flag 被你抓到了，恭喜，你是蜜罐收割机。'
];
function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function setResult(el, text, variant) { el.className = 'result ' + (variant || 'muted'); el.textContent = text; }

function bindForm({ formId, inputId, resultId, tests, challengeId, cardSelector }) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  if (!form || !input || !result) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const value = normalize(input.value);
    if (!value) { setResult(result, '先写点什么再提交，不然没法和你聊天。', 'muted'); return; }

    // Easter egg: starlight{help}
    if (value === 'starlight{help}') {
      toast('别急，看看控制台里的 console.table() 也许有惊喜', 'info', 4000);
      console.table(tests.map(t => ({ type: t.variant === 'ok' ? 'REAL' : t.variant === 'bad' ? 'HONEY' : '?', hash_prefix: t.hash.substring(0, 12) + '...' })));
      setResult(result, '复活币已使用！打开控制台看看有没有线索。', 'muted');
      return;
    }

    const h = await sha256(value);
    for (const t of tests) {
      if (h === t.hash) {
        if (t.variant === 'bad') {
          setResult(result, randPick(HONEY_MSGS), 'bad');
          toast('蜜罐命中！出题人笑出了声', 'bad', 3000);
          const card = cardSelector ? document.querySelector(cardSelector) : result.closest('.card');
          if (card) { card.classList.add('wrong-shake'); setTimeout(() => card.classList.remove('wrong-shake'), 500); }
        } else {
          setResult(result, t.message, 'ok');
          toast('正确！恭喜过关', 'ok', 3500);
          if (challengeId) setSolved(challengeId);
          updateProgressBar();
          const card = cardSelector ? document.querySelector(cardSelector) : result.closest('.card');
          if (card) card.classList.add('correct-glow');
        }
        return;
      }
    }
    setResult(result, randPick(ROASTS), 'bad');
    toast(randPick(ROASTS), 'bad', 3000);
    const card = cardSelector ? document.querySelector(cardSelector) : result.closest('.card');
    if (card) { card.classList.add('wrong-shake'); setTimeout(() => card.classList.remove('wrong-shake'), 500); }
  });
}

// Auto-update progress bar on page load
document.addEventListener('DOMContentLoaded', updateProgressBar);
