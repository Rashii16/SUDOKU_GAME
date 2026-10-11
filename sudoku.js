function isValid(board, row, col, num) {

    for (let i = 0; i < 9; i++) {

        if (board[row][i] === num)
            return false;

        if (board[i][col] === num)
            return false;

    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let r = startRow; r < startRow + 3; r++) {

        for (let c = startCol; c < startCol + 3; c++) {

            if (board[r][c] === num)
                return false;

        }

    }

    return true;
}

function solveSudoku(board) {

    for (let row = 0; row < 9; row++) {

        for (let col = 0; col < 9; col++) {

            if (board[row][col] === 0) {

                for (let num = 1; num <= 9; num++) {

                    if (isValid(board, row, col, num)) {

                        board[row][col] = num;

                        if (solveSudoku(board))
                            return true;

                        board[row][col] = 0;

                    }

                }

                return false;

            }

        }

    }

    return true;
}