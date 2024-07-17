let ROWS, COLS, MINES;
let board = [];
let gameOver = false;
let timer;
let seconds = 0;
let minesLeft;
let firstClick = true;

function setDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    switch (difficulty) {
        case 'easy':
            ROWS = 10; COLS = 10; MINES = 10;
            break;
        case 'medium':
            ROWS = 16; COLS = 16; MINES = 40;
            break;
        case 'hard':
            ROWS = 16; COLS = 30; MINES = 99;
            break;
    }
    minesLeft = MINES;
}

function createBoard() {
    board = [];
    for (let i = 0; i < ROWS; i++) {
        board[i] = [];
        for (let j = 0; j < COLS; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
}

function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        if (!board[row][col].isMine && !(row === firstRow && col === firstCol)) {
            board[row][col].isMine = true;
            minesPlaced++;
        }
    }
}

function calculateNeighborMines() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col].isMine) {
                board[row][col].neighborMines = countNeighborMines(row, col);
            }
        }
    }
}

function countNeighborMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (row + i >= 0 && row + i < ROWS && col + j >= 0 && col + j < COLS) {
                if (board[row + i][col + j].isMine) count++;
            }
        }
    }
    return count;
}

function revealCell(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col].isRevealed || board[row][col].isFlagged || gameOver) {
        return;
    }

    board[row][col].isRevealed = true;
    updateCell(row, col);

    if (board[row][col].neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                revealCell(row + i, col + j);
            }
        }
    }
}

function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col].isMine && !board[row][col].isRevealed) {
                return false;
            }
        }
    }
    return true;
}

function updateCell(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.classList.add('revealed', 'reveal-animation');
    if (board[row][col].isMine) {
        cell.classList.add('mine', 'explode-animation');
        cell.textContent = '💣';
    } else if (board[row][col].neighborMines > 0) {
        cell.textContent = board[row][col].neighborMines;
    }
}

function handleClick(event, row, col) {
    event.preventDefault();
    if (gameOver) return;

    if (firstClick) {
        startTimer();
        placeMines(row, col);
        calculateNeighborMines();
        firstClick = false;
    }

    if (event.button === 0 && event.buttons === 1) { // 只有左鍵點擊
        if (board[row][col].isMine) {
            gameOver = true;
            revealAllMines();
            stopTimer();
            document.getElementById('message').textContent = '遊戲結束！你踩到地雷了。';
        } else {
            revealCell(row, col);
            if (checkWin()) {
                gameOver = true;
                stopTimer();
                updateHighScore();
                document.getElementById('message').textContent = '恭喜你贏了！';
            }
        }
    } else if (event.button === 2 && event.buttons === 2) { // 只有右鍵點擊
        toggleFlag(row, col);
    } else if (event.buttons === 3) { // 同時按下左右鍵
        chordAction(row, col);
    }
}

function toggleFlag(row, col) {
    if (!board[row][col].isRevealed) {
        board[row][col].isFlagged = !board[row][col].isFlagged;
        const cell = document.getElementById(`cell-${row}-${col}`);
        if (board[row][col].isFlagged) {
            cell.classList.add('flagged', 'flag-animation');
            cell.textContent = '🚩';
            minesLeft--;
        } else {
            cell.classList.remove('flagged', 'flag-animation');
            cell.textContent = '';
            minesLeft++;
        }
        updateMinesLeft();
    }
}

function chordAction(row, col) {
    if (!board[row][col].isRevealed || board[row][col].neighborMines === 0) return;

    let flagCount = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (row + i >= 0 && row + i < ROWS && col + j >= 0 && col + j < COLS) {
                if (board[row + i][col + j].isFlagged) flagCount++;
            }
        }
    }

    if (flagCount === board[row][col].neighborMines) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (row + i >= 0 && row + i < ROWS && col + j >= 0 && col + j < COLS) {
                    if (!board[row + i][col + j].isFlagged) {
                        revealCell(row + i, col + j);
                        if (board[row + i][col + j].isMine) {
                            gameOver = true;
                            revealAllMines();
                            stopTimer();
                            document.getElementById('message').textContent = '遊戲結束！你踩到地雷了。';
                            return;
                        }
                    }
                }
            }
        }
        if (checkWin()) {
            gameOver = true;
            stopTimer();
            updateHighScore();
            document.getElementById('message').textContent = '恭喜你贏了！';
        }
    }
}

function revealAllMines() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col].isMine) {
                updateCell(row, col);
            }
        }
    }
}

function startTimer() {
    timer = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = `時間: ${seconds}秒`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

function updateMinesLeft() {
    document.getElementById('mines-left').textContent = `剩餘地雷: ${minesLeft}`;
}

function updateHighScore() {
    const difficulty = document.getElementById('difficulty').value;
    const currentHighScore = localStorage.getItem(`highScore_${difficulty}`);
    if (!currentHighScore || seconds < parseInt(currentHighScore)) {
        localStorage.setItem(`highScore_${difficulty}`, seconds);
        document.getElementById(`high-score-${difficulty}`).textContent = `${getDifficultyName(difficulty)}: ${seconds}秒`;
    }
}

function loadHighScores() {
    ['easy', 'medium', 'hard'].forEach(difficulty => {
        const highScore = localStorage.getItem(`highScore_${difficulty}`);
        if (highScore) {
            document.getElementById(`high-score-${difficulty}`).textContent = `${getDifficultyName(difficulty)}: ${highScore}秒`;
        }
    });
}

function getDifficultyName(difficulty) {
    switch (difficulty) {
        case 'easy': return '簡單';
        case 'medium': return '中等';
        case 'hard': return '困難';
    }
}

function setTheme() {
    const theme = document.getElementById('theme').value;
    document.body.className = theme;
}

function initializeGame() {
    setDifficulty();
    createBoard();
    gameOver = false;
    firstClick = true;
    seconds = 0;
    clearInterval(timer);
    document.getElementById('timer').textContent = '時間: 0秒';
    document.getElementById('message').textContent = '遊戲開始！左鍵點擊揭示格子，右鍵標記地雷。同時按下左右鍵可快速揭示周圍格子。';
    
    const minesweeperContainer = document.getElementById('minesweeper');
    minesweeperContainer.innerHTML = '';
    minesweeperContainer.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.id = `cell-${row}-${col}`;
            cell.className = 'cell';
            cell.addEventListener('mousedown', (event) => handleClick(event, row, col));
            cell.addEventListener('contextmenu', (event) => event.preventDefault());
            minesweeperContainer.appendChild(cell);
        }
    }

    updateMinesLeft();
    loadHighScores();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('difficulty').addEventListener('change', initializeGame);
    document.getElementById('theme').addEventListener('change', setTheme);
    document.getElementById('restart-button').addEventListener('click', initializeGame);
    initializeGame();
});