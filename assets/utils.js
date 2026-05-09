const enc=new TextEncoder();
async function sha256(text){const data=enc.encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function normalize(s){return(s||'').trim();}

function toast(msg,variant,duration){let el=document.getElementById('starlight-toast');if(!el){el=document.createElement('div');el.id='starlight-toast';el.className='toast';document.body.appendChild(el);}el.className='toast '+(variant||'info');el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),duration||3500);}

function getProgress(){try{return JSON.parse(localStorage.getItem('starlight_progress')||'{}');}catch(e){return{};}}
function setSolved(id){const p=getProgress();p[id]=true;localStorage.setItem('starlight_progress',JSON.stringify(p));}
function getProgressCount(){const p=getProgress();return(p.web?1:0)+(p.misc?1:0)+(p.crypto?1:0);}
function updateProgressBar(){const bar=document.getElementById('progress-fill');const label=document.getElementById('progress-label');if(!bar||!label)return;const n=getProgressCount();bar.style.width=(n/3*100)+'%';const msgs=['还没开始？键盘上那个 F12 可以按的。','一道过了，还有两道在等你。','两道了！最后一道把你按在地上摩擦过吗？','全过了！你是真的强，还是看了答案？'];label.textContent='进度: '+n+'/3 — '+msgs[n];}

const ROASTS=['emmmm…… 你离真相的距离，比数学考零分还要远。','你这个答案，出题人看了想报警。','看到你的答案，出题人笑得像个见了水的海绵宝宝。','建议先去洗个脸，回来再试。','你确定你来的是 CTF 而不是随机抽签？','不是我说你，你这个答案连蜜罐都不屑得骗你。','如果这个答案是一道菜，那它就是隔夜的油条。','你的答案像极了我的早起——充满遗憾。','答案不对，但你的勇气我很欣赏。','你是在尝试一种全新的解题方法吗？叫做「随缘法」。'];
function randPick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function setResult(el,text,variant){el.className='result '+(variant||'muted');el.textContent=text;}

// Vigenere decrypt with key 'starlight'
function vigenereDecrypt(hexStr, key) {
  const bytes = [];
  for (let i = 0; i < hexStr.length; i += 2) bytes.push(parseInt(hexStr.substr(i, 2), 16));
  let result = '';
  for (let i = 0; i < bytes.length; i++) result += String.fromCharCode(((bytes[i] - key.charCodeAt(i % key.length)) + 256) % 256);
  return result;
}

// Challenge-specific wrong-answer roasts
const CHALLENGE_ROASTS = {
  web: ['qmzzz 都比你细心。', '你连 qmzzz 都不如。', 'qmzzz 看了你的答案直摇头。'],
  misc: ['yelan 都比你细心。', 'yelan 看了你的答案，决定退役。', '你的答案让 yelan 觉得自己还能再打十年。'],
  crypto: ['zl 都比你细心。', 'zl 看了你的答案，笑了。', '你的答案让 zl 觉得自己终于不是最菜的了。']
};

// Honeypot disguised as success (no explicit wrong/honey mention)
const HONEYPOT_DISGUISE = [
  '提交成功！flag 已记录。请继续下一题。',
  '收到答案，正在验证…… 验证完成，已归档。',
  '答案已入库，感谢你的参与。',
  'OK，这个答案我们收到了。继续加油。'
];

function bindForm({ formId, inputId, resultId, tests, challengeId, cardSelector }) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  if (!form || !input || !result) return;

  let wrongCount = 0;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const value = normalize(input.value);
    if (!value) { setResult(result, '先写点什么再提交。', 'muted'); return; }

    // Easter egg: starlight{help}
    if (value === 'starlight{help}') {
      toast('菜就多练', 'info', 4000);
      setResult(result, '复活币已使用。菜就多练，别指望天上掉 flag。', 'muted');
      console.log('%c复活币使用记录', 'color:#facc15;font-weight:700');
      console.log('输入值:', value);
      console.log('提示: 这个站点的蜜罐比你想象的多。');
      return;
    }

    const h = await sha256(value);
    for (const t of tests) {
      if (h === t.hash) {
        if (t.variant === 'bad') {
          // Honeypot: disguise as success!
          setResult(result, randPick(HONEYPOT_DISGUISE) + (t.suffix || ''), 'ok');
          toast('已记录', 'ok', 2500);
          if (challengeId) setSolved(challengeId + '_honeypot');
          const card = cardSelector ? document.querySelector(cardSelector) : result.closest('.card');
          if (card) card.classList.add('correct-glow');
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

    wrongCount++;
    const roastPool = CHALLENGE_ROASTS[challengeId] || [];
    const msg = wrongCount <= 2 && roastPool.length > 0 ? randPick(roastPool) : randPick(ROASTS);
    setResult(result, msg, 'bad');
    toast(msg, 'bad', 3000);
    const card = cardSelector ? document.querySelector(cardSelector) : result.closest('.card');
    if (card) { card.classList.add('wrong-shake'); setTimeout(() => card.classList.remove('wrong-shake'), 500); }
  });
}

document.addEventListener('DOMContentLoaded', updateProgressBar);
