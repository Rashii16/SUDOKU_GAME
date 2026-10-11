(() => {
  const $ = (s) => document.querySelector(s);
  const boardEl = $('#board');
  const numberButtons = [...document.querySelectorAll('.number')];
  const levelButtons = [...document.querySelectorAll('.level')];
  const hintBtn = $('#hintBtn');
  const timerEl = $('#timer');
  const mistakesEl = $('#mistakes');
  let currentBoard = [], solutionBoard = [], originalBoard = [];
  let selectedCell = null, selectedRow = -1, selectedCol = -1;
  let seconds = 0, mistakeCount = 0, timerInterval = null, paused = false, gameOver = false;
  let currentLevel = localStorage.getItem('difficulty') || 'easy';

  function getStat(key) { return Number(localStorage.getItem(key)) || 0; }
  function setStat(key, value) { localStorage.setItem(key, String(value)); }
  function startGame(level = 'easy') {
    closeVictory();
    currentLevel = ['easy','medium','hard','expert'].includes(level) ? level : 'easy';
    localStorage.setItem('difficulty', currentLevel);
    const game = generatePuzzle(currentLevel);
    currentBoard = game.puzzle.map(r => [...r]);
    originalBoard = game.puzzle.map(r => [...r]);
    solutionBoard = game.solution.map(r => [...r]);
    selectedCell = null; selectedRow = selectedCol = -1;
    mistakeCount = 0; seconds = 0; paused = false; gameOver = false;
    mistakesEl.textContent = '0 / 3'; timerEl.textContent = '00:00';
    $('#pauseBtn')?.classList.remove('is-paused');
    if ($('#pauseBtn')) $('#pauseBtn').innerHTML = '<i class="fa-solid fa-pause"></i>';
    boardEl.classList.remove('paused-board');
    levelButtons.forEach(b => b.classList.toggle('active', (b.dataset.level || b.textContent.toLowerCase()) === currentLevel || (currentLevel === 'easy' && b.textContent.toLowerCase() === 'simple')));
    // Dashboard uses the same keys for every level, including Expert.
    setStat('played', getStat('played') + 1);
    setStat('gamesPlayed', getStat('played'));
    setStat('level_' + currentLevel, getStat('level_' + currentLevel) + 1);
    setStat(currentLevel + 'Games', getStat(currentLevel + 'Games') + 1);
    createBoard(); updateNumberPad(); startTimer(); saveGame();
  }

  function createBoard() {
    boardEl.innerHTML = '';
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      const cell = document.createElement('button');
      cell.type = 'button'; cell.className = 'cell';
      cell.dataset.row = r; cell.dataset.col = c;
      const value = currentBoard[r][c]; cell.textContent = value || '';
      if (originalBoard[r][c]) cell.classList.add('fixed');
      if (c===2 || c===5) cell.classList.add('box-right');
      if (r===2 || r===5) cell.classList.add('box-bottom');
      cell.setAttribute('aria-label', `Row ${r+1}, column ${c+1}${value ? ', '+value : ', empty'}`);
      cell.addEventListener('click', () => selectCell(cell)); boardEl.appendChild(cell);
    }
  }
  function selectCell(cell) {
    if (!cell || gameOver || paused) return;
    selectedCell = cell; selectedRow = +cell.dataset.row; selectedCol = +cell.dataset.col; highlightBoard();
  }
  function highlightBoard() {
    const value = selectedRow >= 0 ? currentBoard[selectedRow][selectedCol] : 0;
    boardEl.querySelectorAll('.cell').forEach(cell => {
      const r=+cell.dataset.row, c=+cell.dataset.col;
      cell.classList.toggle('selected', cell===selectedCell);
      cell.classList.toggle('highlight', selectedRow>=0 && (r===selectedRow || c===selectedCol || (Math.floor(r/3)===Math.floor(selectedRow/3) && Math.floor(c/3)===Math.floor(selectedCol/3))));
      cell.classList.toggle('same-number', !!value && currentBoard[r][c]===value);
    });
  }
  function updateNumberPad() {
    numberButtons.forEach(btn => {
      const n = Number(btn.dataset.value || btn.textContent.trim());
      const complete = currentBoard.flat().filter(v => v === n).length >= 9;
      btn.classList.toggle('completed-number', complete);
      btn.disabled = complete || gameOver;
      btn.setAttribute('aria-label', complete ? `Number ${n} completed` : `Enter number ${n}`);
      btn.title = complete ? `All nine ${n}s placed` : `Place ${n}`;
      btn.innerHTML = complete ? `${n}<span aria-hidden="true" class="keypad-check">✓</span>` : String(n);
    });
  }
  function placeNumber(number) {
    if (!selectedCell || gameOver || paused || selectedCell.classList.contains('fixed')) return;
    const r=selectedRow,c=selectedCol;
    if (number===0) {
      currentBoard[r][c]=0; selectedCell.textContent=''; selectedCell.classList.remove('wrong','correct','hint-cell');
      highlightBoard(); updateNumberPad(); saveGame(); return;
    }
    if (currentBoard.flat().filter(v => v === number).length >= 9 && currentBoard[r][c] !== number) return;
    if (!isValid(currentBoard,r,c,number)) {
      selectedCell.classList.remove('correct'); selectedCell.classList.add('wrong');
      mistakeCount++; mistakesEl.textContent = `${mistakeCount} / 3`;
      if (mistakeCount>=3) { gameOver=true; clearInterval(timerInterval); setTimeout(()=>{ alert('Game over! A new puzzle is ready.'); startGame(currentLevel); },150); }
      return;
    }
    currentBoard[r][c]=number; selectedCell.textContent=number;
    selectedCell.classList.remove('wrong','hint-cell');
    selectedCell.classList.toggle('correct', number===solutionBoard[r][c]);
    if (number!==solutionBoard[r][c]) selectedCell.classList.add('wrong');
    highlightBoard(); updateNumberPad(); saveGame(); checkWin();
  }
  function checkWin() {
    if (currentBoard.some((row,r)=>row.some((v,c)=>v!==solutionBoard[r][c]))) return;
    gameOver=true; clearInterval(timerInterval); updateNumberPad();
    boardEl.querySelectorAll('.cell').forEach(c=>c.classList.add('correct'));
    const wins=getStat('wins')+1; setStat('wins',wins); setStat('gamesWon',wins);
    const best=getStat('best'); if (!best || seconds<best) setStat('best',seconds);
    showVictory();
  }
  function showVictory() {
    closeVictory();
    const overlay = document.createElement('div'); overlay.className='victory-overlay'; overlay.id='victoryOverlay';
    overlay.innerHTML = `<section class="victory-modal" role="dialog" aria-modal="true" aria-labelledby="victoryTitle"><div class="victory-icon">🏆</div><h2 id="victoryTitle">Brilliantly solved!</h2><p>You completed the Sudoku challenge.</p><div class="victory-stats"><div class="victory-stat"><strong>${timerEl.textContent}</strong><span>Time</span></div><div class="victory-stat"><strong>${currentLevel.charAt(0).toUpperCase()+currentLevel.slice(1)}</strong><span>Difficulty</span></div><div class="victory-stat"><strong>${mistakeCount}</strong><span>Mistakes</span></div></div><div class="victory-actions"><button class="victory-secondary" id="victoryDashboard">Dashboard</button><button class="victory-primary" id="victoryNewGame">Play again ✨</button></div></section>`;
    document.body.appendChild(overlay);
    $('#victoryDashboard').addEventListener('click',()=>window.location.href='dashboard.html');
    $('#victoryNewGame').addEventListener('click',()=>startGame(currentLevel));
    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeVictory(); });
    const colors=['#7667f5','#ffbf69','#50d6a5','#ff7e93','#8a7cf6','#70c9f0'];
    for(let i=0;i<100;i++) { const piece=document.createElement('i'); piece.className='confetti-piece'; piece.style.left=Math.random()*100+'vw'; piece.style.background=colors[i%colors.length]; piece.style.setProperty('--drift',(Math.random()*240-120)+'px'); piece.style.setProperty('--fall-time',(2.1+Math.random()*2.1)+'s'); piece.style.animationDelay=(Math.random()*.8)+'s'; document.body.appendChild(piece); setTimeout(()=>piece.remove(),5200); }
  }
  function closeVictory() { document.getElementById('victoryOverlay')?.remove(); document.querySelectorAll('.confetti-piece').forEach(p=>p.remove()); }
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval=setInterval(()=>{ if (!paused && !gameOver) { seconds++; timerEl.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; saveGame(); } },1000);
  }
  numberButtons.forEach(btn=>btn.addEventListener('click',()=>placeNumber(Number(btn.dataset.value || btn.textContent.trim()))));
  document.addEventListener('keydown',e=>{
    if (e.key>='1' && e.key<='9') placeNumber(+e.key);
    else if (e.key==='Backspace' || e.key==='Delete') placeNumber(0);
    else if (selectedCell && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault(); const r=Math.max(0,Math.min(8,selectedRow+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0))); const c=Math.max(0,Math.min(8,selectedCol+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));
      selectCell(boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`));
    }
  });
  hintBtn?.addEventListener('click',()=>{
    if (gameOver || paused) return;
    let r=-1,c=-1;
    if (selectedCell && !selectedCell.classList.contains('fixed') && currentBoard[selectedRow][selectedCol]!==solutionBoard[selectedRow][selectedCol]) { r=selectedRow;c=selectedCol; }
    else outer: for(let y=0;y<9;y++) for(let x=0;x<9;x++) if(!originalBoard[y][x] && currentBoard[y][x]!==solutionBoard[y][x]) {r=y;c=x;break outer;}
    if(r<0){ alert('No hint needed — all empty cells are correct!'); return; }
    currentBoard[r][c]=solutionBoard[r][c];
    const cell=boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    cell.textContent=solutionBoard[r][c]; cell.classList.remove('wrong'); cell.classList.add('hint-cell');
    selectCell(cell); updateNumberPad(); saveGame(); checkWin();
  });
  levelButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const label=(btn.dataset.level || btn.textContent.trim().toLowerCase());
    const level=label==='simple'?'easy':label;
    if(['easy','medium','hard','expert'].includes(level)) startGame(level);
  }));
  $('#pauseBtn')?.addEventListener('click',()=>{
    if(gameOver) return; paused=!paused;
    $('#pauseBtn').innerHTML=paused?'<i class="fa-solid fa-play"></i>':'<i class="fa-solid fa-pause"></i>';
    $('#pauseBtn').classList.toggle('is-paused',paused); boardEl.classList.toggle('paused-board',paused);
  });
  $('#dashboardBtn')?.addEventListener('click',()=>window.location.href='dashboard.html');
  $('#newGameBtn')?.addEventListener('click',()=>startGame(currentLevel));
  function saveGame(){ try{localStorage.setItem('sudokuGame',JSON.stringify({board:currentBoard,solution:solutionBoard,original:originalBoard,seconds,mistakes:mistakeCount,level:currentLevel}));}catch(e){} }
  startGame(currentLevel);
})();
