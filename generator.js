// Sudoku puzzle generator. Each difficulty removes a different number of clues.
function copyBoard(board) { return board.map(row => [...row]); }
function createEmptyBoard() { return Array.from({length:9}, () => Array(9).fill(0)); }
function shuffle(array) { for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];} return array; }
function isSafe(board,row,col,num){
  for(let i=0;i<9;i++) if(board[row][i]===num || board[i][col]===num) return false;
  const sr=Math.floor(row/3)*3, sc=Math.floor(col/3)*3;
  for(let r=sr;r<sr+3;r++) for(let c=sc;c<sc+3;c++) if(board[r][c]===num) return false;
  return true;
}
function findEmpty(board){
  // Minimum-remaining-values heuristic keeps solving and generation responsive.
  let best=null, candidates=null;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]===0){
    const possible=[]; for(let n=1;n<=9;n++) if(isSafe(board,r,c,n)) possible.push(n);
    if(!possible.length) return {row:r,col:c,possible:[]};
    if(!candidates || possible.length<candidates.length){best={row:r,col:c};candidates=possible;if(possible.length===1)return {...best,possible};}
  }
  return best ? {...best,possible:candidates} : null;
}
function fillBoard(board){
  const empty=findEmpty(board); if(!empty)return true; if(!empty.possible.length)return false;
  for(const num of shuffle([...empty.possible])){board[empty.row][empty.col]=num;if(fillBoard(board))return true;board[empty.row][empty.col]=0;} return false;
}
function generateFullBoard(){const b=createEmptyBoard();fillBoard(b);return b;}
function countSolutions(board,limit=2){
  const e=findEmpty(board);if(!e)return 1;if(!e.possible.length)return 0;let count=0;
  for(const n of e.possible){board[e.row][e.col]=n;count+=countSolutions(board,limit);board[e.row][e.col]=0;if(count>=limit)return count;}return count;
}
function hasUniqueSolution(board){return countSolutions(copyBoard(board),2)===1;}
const DIFFICULTY={easy:30,medium:40,hard:50,expert:56};
function generatePuzzle(level='easy'){
  level=String(level).toLowerCase();if(level==='simple')level='easy';if(!(level in DIFFICULTY))level='easy';
  const solution=generateFullBoard(), puzzle=copyBoard(solution);
  const cells=shuffle(Array.from({length:81},(_,i)=>i));let removed=0;
  for(const index of cells){if(removed>=DIFFICULTY[level])break;const r=Math.floor(index/9),c=index%9,backup=puzzle[r][c];puzzle[r][c]=0;
    if(hasUniqueSolution(puzzle))removed++;else puzzle[r][c]=backup;
  }
  return {puzzle,solution};
}
