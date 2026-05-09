const enc = new TextEncoder();
async function sha256(text) {
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function normalize(s) { return (s || '').trim(); }
function setResult(el, text, variant) { el.className = 'result ' + (variant || 'muted'); el.textContent = text; }
function bindForm({ formId, inputId, resultId, tests }) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  if (!form || !input || !result) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const value = normalize(input.value);
    if (!value) { setResult(result, '先写点什么再提交。', 'muted'); return; }
    const h = await sha256(value);
    for (const t of tests) { if (h === t.hash) { setResult(result, t.message, t.variant || 'ok'); return; } }
    setResult(result, '不对团，答案在站点里，但不在你刚刚提交的地方。', 'bad');
  });
}
