(() => {
  const $ = id => document.getElementById(id);
  const read = (...keys) => {
    for (const key of keys) { const value = Number(localStorage.getItem(key)); if (Number.isFinite(value) && value > 0) return value; }
    return 0;
  };
  const played = Math.max(read('played'), read('gamesPlayed'));
  const won = Math.max(read('wins'), read('gamesWon'));
  const levels = {
    easy: Math.max(read('level_easy'), read('easyGames')),
    medium: Math.max(read('level_medium'), read('mediumGames')),
    hard: Math.max(read('level_hard'), read('hardGames')),
    expert: Math.max(read('level_expert'), read('expertGames'))
  };
  $('gamesPlayed').textContent = played;
  $('gamesWon').textContent = won;
  $('winRate').textContent = played ? `${Math.round(won / played * 100)}%` : '0%';
  const best = read('best');
  $('bestTime').textContent = best ? `${String(Math.floor(best/60)).padStart(2,'0')}:${String(best%60).padStart(2,'0')}` : '—';
  const total = Object.values(levels).reduce((a,b)=>a+b,0) || 1;
  Object.entries(levels).forEach(([level,count])=>{
    $(`${level}Fill`).style.width = `${count/total*100}%`;
    $(`${level}Count`).textContent = count;
  });
  const username = localStorage.getItem('username');
  if (username) $('userName').textContent = username;
  const profileImage = localStorage.getItem('profileImage');
  if (profileImage) document.querySelector('.profile-img img').src = profileImage;
  $('backBtn').addEventListener('click',()=>window.location.href='index.html');
  [['easyBtn','easy'],['mediumBtn','medium'],['hardBtn','hard'],['expertBtn','expert']].forEach(([id,level])=>{
    $(id).addEventListener('click',()=>{ localStorage.setItem('difficulty',level); window.location.href='index.html'; });
  });
})();
