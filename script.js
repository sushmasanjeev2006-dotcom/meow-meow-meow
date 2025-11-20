/* script.js for Princess Portal
   - login (Shub@princess / Fast-text)
   - stage flow
   - tic-tac-toe vs unbeatable AI (minimax)
   - scratch-to-reveal bracelet
   - certificate draw & download
   - background music with toggle
*/

/* ============== CONFIG ============== */
const BRACELET_SRC = 'https://i.pinimg.com/originals/9a/19/21/9a192164d7f0f2dea3b4b182c221d97d.jpg';
const MUSIC_SRC = 'https://assets.mixkit.co/music/preview/mixkit-emotional-piano-1205.mp3'; // royalty-free sample, replace if needed

/* ============== DOM refs ============== */
const views = {
  login: document.getElementById('view-login'),
  stage1: document.getElementById('view-stage1'),
  ttt: document.getElementById('view-ttt'),
  scratch: document.getElementById('view-scratch'),
  jokes: document.getElementById('view-jokes'),
  cert: document.getElementById('view-cert'),
  warning: document.getElementById('view-warning'),
};
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const btnLogin = document.getElementById('btnLogin');
const btnDemo = document.getElementById('btnDemo');
const loginError = document.getElementById('loginError');

const qList = document.getElementById('qList');
const btnStage1Next = document.getElementById('btnStage1Next');
const btnStage1Skip = document.getElementById('btnStage1Skip');

const tttBoard = document.getElementById('tttBoard');
const btnTttReset = document.getElementById('btnTttReset');
const btnTttNext = document.getElementById('btnTttNext');
const tttStatus = document.getElementById('tttStatus');

const braceletUnder = document.getElementById('braceletUnder');
const scratchCanvas = document.getElementById('scratchCanvas');
const btnScratchReset = document.getElementById('btnScratchReset');
const btnScratchNext = document.getElementById('btnScratchNext');
const scratchNote = document.getElementById('scratchNote');

const btnJokesNext = document.getElementById('btnJokesNext');
const btnJokesBack = document.getElementById('btnJokesBack');
const heartText = document.getElementById('heartText');

const certCanvas = document.getElementById('certCanvas');
const btnDownloadCert = document.getElementById('btnDownloadCert');
const btnRestart = document.getElementById('btnRestart');

const audioEl = document.getElementById('bgAudio');
const audioToggle = document.getElementById('audioToggle');

const btnWarningFinish = document.getElementById('btnWarningFinish');

/* ============== helpers ============== */
function hideAllViews(){ Object.values(views).forEach(v=>v.classList.add('hidden')); }
function showView(viewName){ hideAllViews(); views[viewName].classList.remove('hidden'); }

/* ============== AUDIO ============== */
audioEl.src = MUSIC_SRC;
audioEl.volume = 0.22;
let audioPlaying = false;
audioToggle.addEventListener('click', ()=> {
  if(audioPlaying){ audioEl.pause(); audioToggle.textContent = '🔈'; audioPlaying = false; }
  else { audioEl.play().catch(()=>{}); audioToggle.textContent='🔊'; audioPlaying = true; }
});

/* ============== LOGIN ============== */
btnLogin.addEventListener('click', onLogin);
btnDemo.addEventListener('click', ()=> { showView('stage1'); });

function onLogin(){
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  if(u === 'Shub@princess' && p === 'Fast-text'){
    loginError.style.display = 'none';
    showView('stage1');
    // start music in demo-friendly state (muted until toggle)
    // auto-play is blocked on some browsers; user can toggle manually.
  } else {
    loginError.style.display='block';
    loginError.textContent = 'Invalid credentials — try again';
  }
}

/* ============== STAGE 1 (questions) ============== */
const STAGE1_QUESTIONS = [
  { label: 'Favourite White Monster flavour?', choices:['Original White','Zero Chill','Tropical','Classic'] },
  { label: 'Best Re:Zero character?', choices:['Subaru','Emilia','Rem','Ram'] },
  { label: 'One workout you secretly like?', choices:['Squats','Cardio','Pulls','Stretching'] }
];
const stage1Answers = [];

function buildStage1(){
  qList.innerHTML = '';
  STAGE1_QUESTIONS.forEach((q, idx)=>{
    const wrap = document.createElement('div'); wrap.className='q-item';
    const left = document.createElement('div'); left.innerHTML = `<strong>${q.label}</strong><div class="muted" style="font-size:13px">${q.choices.join(' • ')}</div>`;
    const sel = document.createElement('select'); sel.innerHTML = '<option value=\"\">Select</option>' + q.choices.map(c=>`<option value="${c}">${c}</option>`).join('');
    sel.addEventListener('change', ()=> stage1Answers[idx] = sel.value);
    wrap.appendChild(left); wrap.appendChild(sel);
    qList.appendChild(wrap);
  });
}
buildStage1();
btnStage1Next.addEventListener('click', ()=>{
  const answered = stage1Answers.filter(Boolean).length;
  if(answered===0){ document.getElementById('stage1Note').textContent='Answer at least one to get coins — or skip.'; return; }
  const coins = (parseInt(localStorage.getItem('portal_coins')||'0')) + answered*2;
  localStorage.setItem('portal_coins', String(coins));
  document.getElementById('stage1Note').textContent = 'Yes, you are princess';
  setTimeout(()=> showView('ttt'), 700);
});
btnStage1Skip.addEventListener('click', ()=> showView('ttt'));

/* ============== STAGE 2 Tic-Tac-Toe ============== */
let tttState = Array(9).fill(null);
function createTtt(){
  tttBoard.innerHTML = '';
  for(let i=0;i<9;i++){
    const cell = document.createElement('div'); cell.className='cell'; cell.dataset.i = i;
    cell.addEventListener('click', ()=> humanMove(i));
    tttBoard.appendChild(cell);
  }
  renderTtt();
}
function renderTtt(){
  const children = tttBoard.children;
  for(let i=0;i<9;i++){ children[i].textContent = tttState[i] || ''; children[i].style.pointerEvents = tttState[i] ? 'none' : 'auto'; }
  const w = checkWinner(tttState);
  if(w) tttStatus.textContent = w==='X' ? 'You won!' : 'AI won.';
  else if(isFull(tttState)) tttStatus.textContent='Draw.';
  else tttStatus.textContent='Your move.';
}
function humanMove(i){
  if(tttState[i] || checkWinner(tttState)) return;
  tttState[i] = 'X'; renderTtt();
  if(checkWinner(tttState) || isFull(tttState)) return;
  setTimeout(()=> {
    const ai = minimaxRoot(tttState, 'O');
    if(ai!=null) tttState[ai] = 'O';
    renderTtt();
  }, 230);
}
function isFull(b){ return b.every(Boolean); }
function checkWinner(b){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const ln of lines){ const [a,b1,c]=ln; if(b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a]; }
  return null;
}
function minimaxRoot(boardState, player){
  const avail = boardState.map((v,i)=> v ? null : i).filter(x=>x!==null);
  let best = -Infinity, move = null;
  for(const i of avail){
    boardState[i] = player;
    const score = minimax(boardState, 0, false);
    boardState[i] = null;
    if(score > best){ best = score; move = i; }
  }
  return move;
}
function minimax(boardState, depth, isMax){
  const res = checkWinner(boardState);
  if(res === 'O') return 10 - depth;
  if(res === 'X') return depth - 10;
  if(isFull(boardState)) return 0;
  if(isMax){
    let best = -Infinity;
    for(let i=0;i<9;i++){ if(!boardState[i]){ boardState[i] = 'O'; best = Math.max(best, minimax(boardState, depth+1, false)); boardState[i]=null; } }
    return best;
  } else {
    let best = Infinity;
    for(let i=0;i<9;i++){ if(!boardState[i]){ boardState[i] = 'X'; best = Math.min(best, minimax(boardState, depth+1, true)); boardState[i]=null; } }
    return best;
  }
}
btnTttReset.addEventListener('click', ()=> { tttState = Array(9).fill(null); renderTtt(); tttStatus.textContent='Board reset.'; });
btnTttNext.addEventListener('click', ()=> { const coins = (parseInt(localStorage.getItem('portal_coins')||'0')) + 4; localStorage.setItem('portal_coins', String(coins)); showView('scratch'); });
createTtt();

/* ============== STAGE 3 — Scratch reveal ============== */
braceletUnder.src = BRACELET_SRC;
let scratchCtx, scratchW, scratchH;
let scratchedPerc = 0;
function initScratch(){
  const canvas = scratchCanvas;
  // set canvas pixel size relative to displayed size
  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(300, Math.floor(rect.width * devicePixelRatio));
    canvas.height = Math.max(200, Math.floor(rect.height * devicePixelRatio));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    scratchW = canvas.width; scratchH = canvas.height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  scratchCtx = canvas.getContext('2d');
  resetScratch();

  let isDown = false;
  const r = Math.max(24, 36 * devicePixelRatio);
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    return { x: (clientX - rect.left) * devicePixelRatio, y: (clientY - rect.top) * devicePixelRatio };
  }
  function scratch(e){
    const p = getPos(e);
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchCtx.beginPath(); scratchCtx.arc(p.x, p.y, r, 0, Math.PI*2); scratchCtx.fill();
  }
  canvas.addEventListener('pointerdown', e=> { isDown=true; scratch(e); });
  canvas.addEventListener('pointermove', e=> { if(isDown) scratch(e); });
  window.addEventListener('pointerup', ()=> { if(isDown){ isDown=false; computeCleared(); } });
  // touch
  canvas.addEventListener('touchstart', e=> { isDown=true; scratch(e); e.preventDefault(); });
  canvas.addEventListener('touchmove', e=> { if(isDown) scratch(e); e.preventDefault(); });
  canvas.addEventListener('touchend', ()=> { if(isDown){ isDown=false; computeCleared(); } });

  btnScratchReset.addEventListener('click', ()=> { resetScratch(); btnScratchNext.disabled = true; scratchNote.textContent='Scratch to reveal the bracelet.'; });
  btnScratchNext.addEventListener('click', ()=> { const coins = (parseInt(localStorage.getItem('portal_coins')||'0')) + 6; localStorage.setItem('portal_coins', String(coins)); showView('jokes'); });

  scratchNote.textContent = 'Scratch to reveal the bracelet.';

  function resetScratch(){
    scratchCtx.globalCompositeOperation = 'source-over';
    scratchCtx.fillStyle = '#2a2a2a';
    scratchCtx.fillRect(0,0,canvas.width,canvas.height);
    // subtle pattern - diagonal stripes using composite
    scratchCtx.globalAlpha = 0.06;
    scratchCtx.fillStyle = '#fff';
    for(let i=0;i<canvas.width;i+=40){ scratchCtx.fillRect(i,0,20,canvas.height); }
    scratchCtx.globalAlpha = 1;
    scratchCtx.globalCompositeOperation = 'destination-out';
    scratchedPerc = 0;
  }
  function computeCleared(){
    try{
      const data = scratchCtx.getImageData(0,0,canvas.width,canvas.height).data;
      let trans = 0;
      for(let i=3;i<data.length;i+=4){ if(data[i]===0) trans++; }
      const total = canvas.width * canvas.height;
      scratchedPerc = Math.round( (trans / total) * 100 );
      if(scratchedPerc >= 65){ btnScratchNext.disabled = false; scratchNote.textContent = 'Bracelet revealed — continue!'; scratchCtx.clearRect(0,0,canvas.width,canvas.height); }
      else scratchNote.textContent = `Cleared ${scratchedPerc}% — scratch more to reveal.`;
    }catch(e){
      // security errors (cross origin), allow user to click continue as fallback
      btnScratchNext.disabled = false;
      scratchNote.textContent = 'Scratch unavailable — click Continue';
    }
  }
}
window.addEventListener('load', initScratch);

/* ============== STAGE 4 — Jokes & Heart ============== */
btnJokesNext.addEventListener('click', ()=>{
  try { localStorage.setItem('portal_heart', heartText.value.trim()); } catch(e){}
  showView('cert');
  setTimeout(()=> { try { alert('Zyada uda na karo janab'); } catch(e){} }, 600);
});
btnJokesBack.addEventListener('click', ()=> showView('scratch'));

/* ============== CERTIFICATE drawing ============== */
function drawCertificate(){
  const canvas = certCanvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  // dark background
  ctx.fillStyle = '#061018'; ctx.fillRect(0,0,W,H);
  // white panel
  ctx.fillStyle = '#fff8fb'; roundRect(ctx,64,64,W-128,H-148,20,true,false);
  // Title
  ctx.fillStyle = '#3b0d26'; ctx.font = '32px Orbitron, monospace'; ctx.textAlign='center';
  ctx.fillText('Certificate of Eternal Friendship', W/2, 140);
  // Name
  ctx.font = '56px Poppins, sans-serif'; ctx.fillStyle = '#04101a'; ctx.fillText('SHUB', W/2, 220);
  // Paragraph
  ctx.font = '20px Poppins'; ctx.fillStyle = '#2b2b35';
  const para = localStorage.getItem('portal_heart') || 'You are forcefully enforced for this friendship, no way to escape. This bond includes anime marathons (Re:Zero), gym encouragement, White Monster runs, and always listening.';
  wrapText(ctx, para, W/2, 270, W-320, 28);

  // draw bracelet image (center)
  const img = new Image(); img.crossOrigin='anonymous';
  img.onload = function(){
    const iw = 320, ih = 320;
    ctx.drawImage(img, W/2 - iw/2, 420, iw, ih);
    // seal/stamp
    ctx.beginPath(); ctx.fillStyle='rgba(255,111,181,0.12)'; ctx.arc(W-160,H-160,72,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f1720'; ctx.font='16px Poppins'; ctx.fillText('PRINCESS SEAL', W-160, H-156);
  };
  img.onerror = function(){
    // fallback: draw simple heart emblem
    ctx.beginPath(); ctx.fillStyle='rgba(255,111,181,0.12)'; ctx.arc(W-160,H-160,72,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f1720'; ctx.font='16px Poppins'; ctx.fillText('PRINCESS SEAL', W-160, H-156);
  };
  img.src = BRACELET_SRC;
}
btnDownloadCert.addEventListener('click', ()=> {
  const url = certCanvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'Shub_certificate.png'; document.body.appendChild(a); a.click(); a.remove();
});
btnRestart.addEventListener('click', ()=> {
  try { localStorage.removeItem('portal_coins'); localStorage.removeItem('portal_heart'); } catch(e){}
  loginUser.value=''; loginPass.value=''; showView('login');
});

/* ============== Warning finish ============== */
if(btnWarningFinish) btnWarningFinish.addEventListener('click', ()=> { alert('Portal closed. Stay kind to Shub 💗'); });

/* ============== utilities ============== */
function roundRect(ctx,x,y,w,h,r,fill,stroke){
  if(typeof stroke === 'undefined') stroke=true;
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  if(fill) ctx.fill(); if(stroke) ctx.stroke();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  ctx.textAlign='center';
  const words = text.split(' '); let line=''; let row=0;
  for(let n=0;n<words.length;n++){
    const test = line + words[n] + ' ';
    if(ctx.measureText(test).width > maxWidth && n>0){
      ctx.fillText(line, x, y + row*lineHeight);
      line = words[n] + ' ';
      row++;
    } else line = test;
  }
  ctx.fillText(line, x, y + row*lineHeight);
}

/* ============== INIT ============== */
showView('login');
drawCertificate(); // pre-draw (image loads async)
