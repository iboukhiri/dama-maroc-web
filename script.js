// Game State and Configuration
class DamaGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 1; // 1 = Player 1 (Red), 2 = Player 2 (Blue/AI)
        this.gameMode = 'pvp'; // 'pvp', 'ai-easy', 'ai-medium', 'ai-hard'
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.gameOver = false;
        this.lastMove = null;
        this.showLastMoveHighlight = false; // Flag to control last-move highlighting
        
        this.initializeBoard();
        this.bindEvents();
    }

    // Initialize 8x8 board with pieces on dark squares only
    initializeBoard() {
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                // Only use dark squares for gameplay (checkerboard pattern)
                const isDarkSquare = (row + col) % 2 === 1;
                
                if (isDarkSquare) {
                    if (row < 3) {
                        this.board[row][col] = { player: 2, isKing: false }; // Player 2 pieces
                    } else if (row > 4) {
                        this.board[row][col] = { player: 1, isKing: false }; // Player 1 pieces
                    } else {
                        this.board[row][col] = null; // Empty dark square
                    }
                } else {
                    this.board[row][col] = 'light'; // Light square (not playable)
                }
            }
        }
    }

    // Bind UI events
    bindEvents() {
        // Mode selection - PvP mode
        document.querySelectorAll('.mode-option[data-mode="pvp"], .multiplayer-option[data-mode="pvp"]').forEach(card => {
            card.addEventListener('click', () => {
                this.startGame('pvp');
            });
        });

        // AI difficulty selection
        document.querySelectorAll('.difficulty-option').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.startGame(mode);
            });
        });

        // Control buttons with mobile-safe handling
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        
        // Back to menu button with protection against accidental touches
        const backToMenuBtn = document.getElementById('backToMenu');
        let touchStartTime = 0;
        
        const handleBackToMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🏠 Back to menu button triggered:', e.type);
            
            // For touch events, require a minimum hold time to prevent accidental touches
            if (e.type === 'touchend') {
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration < 100) { // Less than 100ms = likely accidental
                    console.log('⚠️ Touch too quick, ignoring:', touchDuration + 'ms');
                    return;
                }
            }
            
            // Add visual feedback for mobile users
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                backToMenuBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    backToMenuBtn.style.transform = '';
                }, 150);
            }
            
            console.log('🏠 Navigating to home screen');
            this.showWelcomeScreen();
        };
        
        backToMenuBtn.addEventListener('click', handleBackToMenu);
        backToMenuBtn.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            e.stopPropagation();
        });
        backToMenuBtn.addEventListener('touchend', handleBackToMenu);

        document.getElementById('playAgain').addEventListener('click', () => this.resetGame());
        document.getElementById('backToMenuModal').addEventListener('click', () => {
            this.hideGameOverModal();
            this.showWelcomeScreen();
        });
        
        // Hezzek o Nfokh modal
        document.getElementById('continueAfterHezzek').addEventListener('click', () => {
            this.hideHezzekModal();
        });
        
        // Initialize theme
        this.initializeTheme();
    }

    // Initialize theme system
    initializeTheme() {
        const savedTheme = localStorage.getItem('dama-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }













    // Start game with selected mode
    startGame(mode) {
        this.gameMode = mode;
        
        // For online games, don't call resetGame as it would disconnect from the room
        if (mode !== 'online') {
            this.resetGame();
        } else {
            // For online games, initialize basic state but don't reset board
            // The board will be synced from Firebase
            this.selectedPiece = null;
            this.validMoves = [];
            this.gameOver = false;
            this.lastMove = null;
            this.showLastMoveHighlight = false;
            
            // Initialize with default board if none exists, but Firebase will override
            if (!this.board || this.board.length === 0) {
                console.log('🔄 Initializing temporary board for online mode');
                this.initializeBoard();
            }
            
            console.log('🎮 Online mode started - waiting for Firebase sync...');
        }
        
        // Hide all other screens and show game
        document.getElementById('welcomeScreen').classList.remove('active');
        document.getElementById('modeSelector').classList.remove('active');
        document.getElementById('aiSelector').classList.remove('active');
        document.getElementById('multiplayerSelector').classList.remove('active');
        document.getElementById('onlineSelector').classList.remove('active');
        document.getElementById('waitingRoom').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        const modeText = {
            'pvp': 'Player vs Player',
            'ai-easy': 'Player vs AI (Novice)',
            'ai-medium': 'Player vs AI (Strategist)',
            'ai-hard': 'Player vs AI (Master)',
            'online': 'Online Multiplayer'
        };
        
        document.getElementById('gameMode').textContent = modeText[mode];
        
        // Set global variables for compatibility
        window.currentGameMode = mode;
        window.currentPlayer = this.currentPlayer;
        
        // Always render board and update UI
        this.renderBoard();
        this.updateUI();
        
        console.log(`Game started in ${mode} mode`);
        
        // Show online info card for online mode and hide reset button
        if (mode === 'online') {
            const onlineInfoCard = document.getElementById('onlineInfoCard');
            if (onlineInfoCard) {
                onlineInfoCard.style.display = 'block';
            }
            // Change reset button text for online games
            const resetButton = document.getElementById('resetGame');
            if (resetButton) {
                resetButton.innerHTML = '<span>🚪</span> Leave Game';
            }
        } else {
            // Restore normal reset button for offline games
            const resetButton = document.getElementById('resetGame');
            if (resetButton) {
                resetButton.innerHTML = '<span>🔄</span> Reset';
            }
            // Hide online info card for offline games
            const onlineInfoCard = document.getElementById('onlineInfoCard');
            if (onlineInfoCard) {
                onlineInfoCard.style.display = 'none';
            }
        }
    }

    // Update theme icon based on current theme
    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-moon';
        } else {
            themeIcon.className = 'fas fa-sun';
        }
    }

    // Reset game to initial state
    resetGame() {
        // For online games, don't reset - just return to menu
        if (this.gameMode === 'online') {
            if (window.onlineMultiplayer) {
                window.onlineMultiplayer.leaveRoom();
            }
            this.showWelcomeScreen();
            return;
        }
        
        this.initializeBoard();
        this.currentPlayer = 1;
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.gameOver = false;
        this.lastMove = null;
        this.showLastMoveHighlight = false;
        
        this.renderBoard();
        this.updateUI();
    }

    // Show welcome screen (main home screen)
    showWelcomeScreen() {
        console.log('🏠 showWelcomeScreen called - stack trace:', new Error().stack);
        
        // Prevent navigation during AI turn to avoid interrupting the game
        if (this.gameMode && this.gameMode.startsWith('ai-') && this.currentPlayer === 2) {
            console.log('⚠️ Preventing navigation during AI turn');
            this.showTemporaryMessage('Please wait for AI to finish its turn');
            return;
        }
        
        // If in online mode, properly leave the game
        if (this.gameMode === 'online' && window.onlineMultiplayer) {
            console.log('⚠️ Leaving online game');
            window.onlineMultiplayer.leaveRoom();
        }
        
        // Reset game mode
        this.gameMode = null;
        window.currentGameMode = null;
        
        // Hide all screens and show welcome screen (main home screen)
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('modeSelector').classList.remove('active');
        document.getElementById('aiSelector').classList.remove('active');
        document.getElementById('multiplayerSelector').classList.remove('active');
        document.getElementById('onlineSelector').classList.remove('active');
        document.getElementById('waitingRoom').classList.remove('active');
        document.getElementById('welcomeScreen').classList.add('active');
        
        console.log('✅ Returned to main home screen');
    }

    // Show mode selector
    showModeSelection() {
        document.getElementById('welcomeScreen').classList.remove('active');
        document.getElementById('aiSelector').classList.remove('active');
        document.getElementById('multiplayerSelector').classList.remove('active');
        document.getElementById('onlineSelector').classList.remove('active');
        document.getElementById('waitingRoom').classList.remove('active');
        document.getElementById('modeSelector').classList.add('active');
    }

    // Show AI selector
    showAISelection() {
        document.getElementById('modeSelector').classList.remove('active');
        document.getElementById('aiSelector').classList.add('active');
    }

    // Render the game board
    renderBoard() {
        try {
            const boardElement = document.getElementById('gameBoard');
            if (!boardElement) {
                console.warn('Game board element not found');
                return;
            }
            
            if (!this.board) {
                console.warn('Board data is missing');
                return;
            }

            // Add debug information for online mode
            if (window.currentGameMode === 'online') {
                console.log('🎮 Rendering board - current player:', this.currentPlayer);
                
                // Debug: Check if board is valid
                let invalidRows = [];
                for (let row = 0; row < 8; row++) {
                    if (!this.board[row]) {
                        invalidRows.push(row);
                        console.error(`Board row ${row} is undefined in renderBoard`);
                    } else if (this.board[row].length !== 8) {
                        invalidRows.push(row);
                        console.error(`Board row ${row} has wrong length: ${this.board[row].length}`);
                    }
                }
                
                if (invalidRows.length > 0) {
                    console.error('Invalid board structure detected', invalidRows);
                }
            }
            
            boardElement.innerHTML = '';

            for (let row = 0; row < 8; row++) {
                if (!this.board[row]) {
                    console.error(`Board row ${row} is undefined`);
                    continue;
                }
                
                for (let col = 0; col < 8; col++) {
                    const square = document.createElement('div');
                    square.className = 'board-square';
                    square.dataset.row = row;
                    square.dataset.col = col;

                    // Add click event for desktop
                    square.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.handleSquareClick(row, col);
                    });
                    
                    // Add robust touch handling for mobile
                    let touchStarted = false;
                    let touchStartTime = 0;
                    let touchStartPos = null;
                    
                    square.addEventListener('touchstart', (e) => {
                        touchStarted = true;
                        touchStartTime = Date.now();
                        touchStartPos = {
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY
                        };
                        e.stopPropagation();
                    });
                    
                    square.addEventListener('touchend', (e) => {
                        if (touchStarted) {
                            e.preventDefault();
                            e.stopPropagation();
                            touchStarted = false;
                            
                            // Check if touch moved too much (might be a scroll)
                            if (touchStartPos && e.changedTouches[0]) {
                                const touch = e.changedTouches[0];
                                const deltaX = Math.abs(touch.clientX - touchStartPos.x);
                                const deltaY = Math.abs(touch.clientY - touchStartPos.y);
                                
                                if (deltaX > 15 || deltaY > 15) {
                                    console.log('⚠️ Touch moved too much, ignoring square:', {row, col, deltaX, deltaY});
                                    return;
                                }
                            }
                            
                            // Check minimum touch duration to prevent accidental touches
                            const touchDuration = Date.now() - touchStartTime;
                            if (touchDuration < 50) {
                                console.log('⚠️ Touch too quick on square, ignoring:', {row, col, duration: touchDuration + 'ms'});
                                return;
                            }
                            
                            console.log('🎯 Valid square touch processed:', {row, col, duration: touchDuration + 'ms'});
                            this.handleSquareClick(row, col);
                        }
                    });
                    
                    square.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    // Set square color
                    const cell = this.board[row][col];
                    if (!cell) {
                        square.classList.add('dark');
                        boardElement.appendChild(square);
                        continue;
                    }
                    
                    if (cell === 'light') {
                        square.classList.add('light');
                    } else {
                        square.classList.add('dark');
                        
                        // Add piece if exists
                        const piece = this.board[row][col];
                        if (piece && piece.player) {
                            const pieceElement = document.createElement('div');
                            pieceElement.className = `piece player${piece.player}`;
                            if (piece.isKing) {
                                pieceElement.classList.add('king');
                            }
                            square.appendChild(pieceElement);
                        }
                    }
                    
                    // Highlight last move (but not if this square is currently selected)
                    if (this.lastMove && this.showLastMoveHighlight &&
                        !this.selectedPiece) {
                        const isFrom = (row === this.lastMove.from.row && col === this.lastMove.from.col);
                        const isTo = (row === this.lastMove.to.row && col === this.lastMove.to.col);
                        
                        if (isFrom) {
                            square.classList.add('last-move-from');
                        } else if (isTo) {
                            square.classList.add('last-move-to');
                        }
                    }
                    
                    // Highlight selected piece
                    if (this.selectedPiece && row === this.selectedPiece.row && col === this.selectedPiece.col) {
                        square.classList.add('selected');
                    }

                    // Highlight valid moves
                    const isValidMove = this.validMoves.some(move => move.row === row && move.col === col);
                    if (isValidMove) {
                        square.classList.add('valid-move');
                    }

                    boardElement.appendChild(square);
                }
            }
        } catch (error) {
            console.error('Error rendering board:', error);
            // Add additional context about game state in case of error
            if (window.currentGameMode === 'online') {
                console.error('Error updating UI in online mode:',
                             'Current player:', this.currentPlayer,
                             'Game mode:', this.gameMode,
                             'Player number:', window.onlineMultiplayer ? window.onlineMultiplayer.playerNumber : 'unknown');
            }
        }
    }

    // Handle square click
    handleSquareClick(row, col) {
        console.log('🎯 handleSquareClick called:', {row, col, gameMode: this.gameMode, currentPlayer: this.currentPlayer, gameOver: this.gameOver});
        
        if (this.gameOver) return;
        
        // If it's AI turn, ignore clicks
        if (this.gameMode.startsWith('ai-') && this.currentPlayer === 2) {
            console.log('⚠️ Ignoring click - AI turn');
            return;
        }
        
        // For online mode, only allow moves if it's the player's turn
        if (this.gameMode === 'online' && window.onlineMultiplayer) {
            const isMyTurn = window.onlineMultiplayer.isMyTurn();
            console.log('🎮 Online move attempt:', {
                row, col,
                currentPlayer: this.currentPlayer,
                playerId: window.onlineMultiplayer.playerId,
                playerNumber: window.onlineMultiplayer.playerNumber,
                isMyTurn: isMyTurn,
                gameMode: this.gameMode,
                windowGameMode: window.currentGameMode,
                isMovePending: window.onlineMultiplayer.isMovePending
            });
            
            if (!isMyTurn) {
                if (window.onlineMultiplayer.isMovePending) {
                    console.log('❌ Move pending - please wait for confirmation');
                    this.showTemporaryMessage('Please wait... move is being processed');
                } else {
                    console.log('❌ Not your turn in online game');
                    this.showTemporaryMessage('Not your turn!');
                }
                return;
            }
        }

        // Ensure board markers are correct before generating moves (online sync edge-case)
        if (typeof sanitizeBoard === 'function') {
            sanitizeBoard(this.board);
        }

        const piece = this.board[row][col];
        
        // If clicking on own piece, select it
        if (piece && piece.player === this.currentPlayer) {
            this.selectPiece(row, col);
        }
        // If clicking on valid move, make the move
        else if (this.selectedPiece && this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
            console.log('✅ Making move from', this.selectedPiece, 'to', {row, col});
            console.log('🎮 Current game state before move:', {
                gameMode: this.gameMode,
                currentPlayer: this.currentPlayer,
                selectedPiece: this.selectedPiece
            });
            this.makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
        }
        // Debug: Log why move wasn't made
        else if (this.selectedPiece) {
            const isValid = this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
            console.log('❌ Move rejected:', {
                selectedPiece: this.selectedPiece,
                target: {row, col},
                isValidMove: isValid,
                validMoves: this.validMoves.map(m => ({row: m.row, col: m.col}))
            });
        }
        // If clicking elsewhere, deselect and clear last-move highlighting
        else {
            this.clearLastMoveHighlighting();
            this.deselectPiece();
        }
    }

    // Select a piece
    selectPiece(row, col) {
        // Clear any previous last-move highlighting when selecting a new piece
        this.clearLastMoveHighlighting();
        
        // Add debugging to see what's happening
        console.log('🎯 selectPiece called for:', {row, col});
        this.verifyBoardState();
        
        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        
        // Emergency fix: if no moves found, check if board state is corrupted
        if (this.validMoves.length === 0) {
            console.log('⚠️ No valid moves found - checking if board needs repair...');
            const allPlayerMoves = this.getAllValidMoves(this.currentPlayer);
            if (allPlayerMoves.length === 0) {
                console.log('🚨 No moves available for current player - board may be corrupted');
                this.showTemporaryMessage('Board state issue detected. Trying to fix...', 3000);
                this.repairBoardState();
                // Retry after repair
                this.validMoves = this.getValidMoves(row, col);
            }
        }
        
        this.highlightValidMoves();
        
        console.log('🎯 Selected piece and valid moves:', {
            selectedPiece: this.selectedPiece,
            validMovesCount: this.validMoves.length
        });
    }

    // Clear last-move highlighting
    clearLastMoveHighlighting() {
        this.showLastMoveHighlight = false;
        document.querySelectorAll('.board-square').forEach(square => {
            square.classList.remove('last-move');
        });
    }

    // Deselect piece
    deselectPiece() {
        this.selectedPiece = null;
        this.validMoves = [];
        this.clearSelectionEffects();
        this.highlightValidMoves();
    }

    // Clear all selection-related visual effects
    clearSelectionEffects() {
        document.querySelectorAll('.board-square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'last-move', 'multi-jump-move');
            square.removeAttribute('title');
        });
    }

    // Newly added: Clear selection state and related highlights
    clearSelection() {
        // Reset selected piece and valid moves
        this.selectedPiece = null;
        this.validMoves = [];
        // Remove any visual selection/highlight effects from the board
        this.clearSelectionEffects();
    }

    // Highlight valid moves
    highlightValidMoves() {
        // Remove existing highlights (including last-move to prevent blue placeholder)
        document.querySelectorAll('.board-square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'multi-jump-move');
            square.removeAttribute('title');
        });

        // Highlight selected piece
        if (this.selectedPiece) {
            const selectedSquare = document.querySelector(
                `[data-row="${this.selectedPiece.row}"][data-col="${this.selectedPiece.col}"]`
            );
            if (selectedSquare) {
                selectedSquare.classList.add('selected');
                // Temporarily remove last-move highlighting from selected square to prevent blue overlay
                selectedSquare.classList.remove('last-move');
            }
        }

        // Highlight valid moves
        this.validMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square) {
                square.classList.add('valid-move');
                
                // Add special styling for multi-jump moves
                if (move.isMultiJump) {
                    square.classList.add('multi-jump-move');
                    // Add a tooltip or indicator
                    square.setAttribute('title', `Multi-capture: ${move.capturedPieces ? move.capturedPieces.length : 0} pieces`);
                }
            }
        });
    }

    // Get valid moves for a piece (no forced captures in hezzek o nfokh)
    getValidMoves(row, col) {
        // Ensure board markers are correct before generating moves (online sync edge-case)
        if (typeof sanitizeBoard === 'function') {
            sanitizeBoard(this.board);
        }

        const piece = this.board[row][col];
        
        // Add detailed debugging
        console.log('🔍 getValidMoves called for position:', {row, col});
        console.log('🔍 Piece at position:', piece);
        console.log('🔍 Current player:', this.currentPlayer);
        console.log('🔍 Board state sample:', {
            topLeft: this.board[0][0],
            topRight: this.board[0][7],
            bottomLeft: this.board[7][0],
            bottomRight: this.board[7][7],
            center: this.board[3][3]
        });
        
        if (!piece || piece.player !== this.currentPlayer) {
            console.log('❌ No valid piece or wrong player');
            return [];
        }

        const directions = this.getMoveDirections(piece);
        console.log('🔍 Movement directions:', directions);

        // Get all possible single captures and regular moves
        const singleCaptures = this.getCaptureMovesFromPosition(row, col, piece, directions);
        const regularMoves = this.getRegularMovesFromPosition(row, col, piece, directions);
        
        // Get all possible multi-jump sequences
        const multiJumpMoves = this.getAllMultiJumpSequences(row, col, piece);
        
        const allMoves = [...singleCaptures, ...regularMoves, ...multiJumpMoves];
        
        console.log(`🔍 Valid moves for piece at (${row},${col}):`, {
            singleCaptures: singleCaptures.length,
            regularMoves: regularMoves.length, 
            multiJumpMoves: multiJumpMoves.length,
            total: allMoves.length,
            allMoves: allMoves
        });
        
        return allMoves;
    }

    // Verify board state integrity
    verifyBoardState() {
        console.log('🔍 Verifying board state...');
        let pieceCount = {1: 0, 2: 0};
        let nullCount = 0;
        let lightCount = 0;
        let invalidCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = this.board[row][col];
                if (cell === null) {
                    nullCount++;
                } else if (cell === 'light') {
                    lightCount++;
                } else if (cell && typeof cell === 'object' && cell.player) {
                    pieceCount[cell.player]++;
                } else {
                    invalidCount++;
                    console.warn(`Invalid cell at (${row},${col}):`, cell);
                }
            }
        }
        
        console.log('🔍 Board state summary:', {
            player1Pieces: pieceCount[1],
            player2Pieces: pieceCount[2],
            emptySquares: nullCount,
            lightSquares: lightCount,
            invalidCells: invalidCount
        });
        
        return invalidCount === 0;
    }

    // Get all possible multi-jump sequences from a position
    getAllMultiJumpSequences(startRow, startCol, piece) {
        const allSequences = [];
        
        // Use depth-first search to find all possible multi-jump paths
        this.findMultiJumpSequencesSimple(startRow, startCol, piece, [], allSequences);
        
        // Convert sequences to move format and filter out single jumps (already included in single captures)
        const multiJumps = allSequences
            .filter(sequence => sequence.length > 1) // Only multi-jumps
            .map(sequence => ({
                row: sequence[sequence.length - 1].row,
                col: sequence[sequence.length - 1].col,
                capturedPieces: sequence.flatMap(step => step.capturedPieces || []),
                isMultiJump: true,
                sequence: sequence
            }));
            
        console.log(`Found ${multiJumps.length} multi-jump sequences from (${startRow},${startCol}):`, multiJumps);
        return multiJumps;
    }

    // Simplified multi-jump sequence finder
    findMultiJumpSequencesSimple(row, col, piece, currentPath, allSequences) {
        const directions = this.getMoveDirections(piece);
        const captures = this.getCaptureMovesFromPosition(row, col, piece, directions);
        
        // If we have captured pieces, save the current path as a sequence
        if (currentPath.length > 0) {
            allSequences.push([...currentPath]);
        }
        
        // Try each possible capture
        for (const capture of captures) {
            // Skip if this would revisit a position in the current path
            const positionVisited = currentPath.some(step => 
                step.row === capture.row && step.col === capture.col
            );
            if (positionVisited) continue;
            
            // Save current board state
            const boardBackup = this.copyBoard();
            
            // Apply the capture temporarily
            this.board[capture.row][capture.col] = piece;
            this.board[row][col] = null;
            
            // Remove captured pieces
            if (capture.capturedPieces) {
                capture.capturedPieces.forEach(captured => {
                    this.board[captured.row][captured.col] = null;
                });
            }
            
            // Add this capture to the current path
            currentPath.push(capture);
            
            // Recursively find more captures from the new position
            this.findMultiJumpSequencesSimple(capture.row, capture.col, piece, currentPath, allSequences);
            
            // Backtrack: remove this capture from the path and restore board
            currentPath.pop();
            this.board = boardBackup;
        }
    }

    // Get movement directions based on piece type
    getMoveDirections(piece) {
        if (piece.isKing) {
            // Kings can move in all diagonal directions
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        } else {
            // Regular pieces move forward only
            if (piece.player === 1) {
                return [[-1, -1], [-1, 1]]; // Move up
            } else {
                return [[1, -1], [1, 1]]; // Move down
            }
        }
    }

    // Get capture moves from a position
    getCaptureMovesFromPosition(row, col, piece, directions) {
        const captures = [];

        directions.forEach(([dr, dc]) => {
            if (piece.isKing) {
                // Kings can capture at any distance
                this.getKingCaptures(row, col, dr, dc, captures);
            } else {
                // Regular pieces capture adjacent pieces
                this.getRegularCaptures(row, col, dr, dc, captures);
            }
        });

        if (captures.length > 0) {
            console.log(`Piece at (${row},${col}) has ${captures.length} single captures:`, captures);
        }

        return captures;
    }

    // Get king captures
    getKingCaptures(row, col, dr, dc, captures) {
        let currentRow = row + dr;
        let currentCol = col + dc;
        let foundOpponent = false;
        let opponentRow, opponentCol;

        while (this.isValidPosition(currentRow, currentCol)) {
            const currentSquare = this.board[currentRow][currentCol];
            
            if (currentSquare === 'light') {
                currentRow += dr;
                currentCol += dc;
                continue;
            }

            if (currentSquare === null) {
                if (foundOpponent) {
                    // Can land here after capturing
                    captures.push({
                        row: currentRow,
                        col: currentCol,
                        capturedPieces: [{ row: opponentRow, col: opponentCol }]
                    });
                }
            } else if (currentSquare.player !== this.currentPlayer) {
                if (foundOpponent) {
                    // Two opponents in a row, can't jump
                    break;
                } else {
                    foundOpponent = true;
                    opponentRow = currentRow;
                    opponentCol = currentCol;
                }
            } else {
                // Own piece, can't continue
                break;
            }

            currentRow += dr;
            currentCol += dc;
        }
    }

    // Get regular piece captures
    getRegularCaptures(row, col, dr, dc, captures) {
        const captureRow = row + dr;
        const captureCol = col + dc;
        const landRow = row + (2 * dr);
        const landCol = col + (2 * dc);

        if (this.isValidPosition(captureRow, captureCol) && 
            this.isValidPosition(landRow, landCol)) {
            
            const capturedPiece = this.board[captureRow][captureCol];
            const landSquare = this.board[landRow][landCol];

            // Debug log
            if (capturedPiece && capturedPiece !== 'light') {
                console.log(`Checking capture from (${row},${col}) to (${captureRow},${captureCol}) landing at (${landRow},${landCol})`);
                console.log(`Captured piece player: ${capturedPiece.player}, Current player: ${this.currentPlayer}, Land square:`, landSquare);
            }

            if (capturedPiece && 
                capturedPiece !== 'light' && 
                capturedPiece.player !== this.currentPlayer &&
                landSquare === null) {
                
                console.log(`✅ Valid capture found: (${row},${col}) captures (${captureRow},${captureCol}) lands at (${landRow},${landCol})`);
                
                captures.push({
                    row: landRow,
                    col: landCol,
                    capturedPieces: [{ row: captureRow, col: captureCol }]
                });
            }
        }
    }

    // Get regular moves from a position
    getRegularMovesFromPosition(row, col, piece, directions) {
        const moves = [];

        directions.forEach(([dr, dc]) => {
            if (piece.isKing) {
                // Kings can move any distance
                let currentRow = row + dr;
                let currentCol = col + dc;

                while (this.isValidPosition(currentRow, currentCol)) {
                    const currentSquare = this.board[currentRow][currentCol];
                    
                    if (currentSquare === 'light') {
                        currentRow += dr;
                        currentCol += dc;
                        continue;
                    }

                    if (currentSquare === null) {
                        moves.push({ row: currentRow, col: currentCol });
                    } else {
                        // Piece blocking, can't continue
                        break;
                    }

                    currentRow += dr;
                    currentCol += dc;
                }
            } else {
                // Regular pieces move one square
                const newRow = row + dr;
                const newCol = col + dc;

                if (this.isValidPosition(newRow, newCol) && 
                    this.board[newRow][newCol] === null) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    // Check if position is valid
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Check if a move is valid
    isValidMove(fromRow, fromCol, toRow, toCol) {
        return this.validMoves.some(move => move.row === toRow && move.col === toCol);
    }

    // Make a move
    async makeMove(fromRow, fromCol, toRow, toCol) {
        console.log('🎯 makeMove called:', {from: {fromRow, fromCol}, to: {toRow, toCol}, gameMode: this.gameMode});
        
        const move = this.validMoves.find(m => m.row === toRow && m.col === toCol);
        if (!move) {
            console.log('❌ Move not found in validMoves:', this.validMoves);
            return false;
        }
        
        console.log('✅ Move found:', move);

        const piece = this.board[fromRow][fromCol];
        
        // HEZZEK O NFOKH RULE: Check if player missed or took fewer capture opportunities
        const availableCaptures = this.getAllCaptureMoves(this.currentPlayer);
        
        if (availableCaptures.length > 0) {
            if (!move.capturedPieces || move.capturedPieces.length === 0) {
                // Player made a regular move when captures were available
                if (this.gameMode === 'online') {
                    // In online mode, send penalty to Firebase instead of applying locally
                    await this.sendHezzekPenaltyToFirebase(fromRow, fromCol, availableCaptures, 0, 0);
                } else {
                    this.applyHezzekONfokh(fromRow, fromCol, availableCaptures);
                }
                return true;
            } else {
                // Check if player could have captured more pieces
                const maxCapturesPossible = this.getMaximumCapturesAvailable();
                const actualCaptures = move.capturedPieces.length;
                
                if (actualCaptures < maxCapturesPossible) {
                    // Player captured fewer pieces than possible - hezzek o nfokh applies
                    if (this.gameMode === 'online') {
                        // In online mode, send penalty to Firebase instead of applying locally
                        await this.sendHezzekPenaltyToFirebase(fromRow, fromCol, availableCaptures, actualCaptures, maxCapturesPossible);
                    } else {
                        this.applyHezzekONfokh(fromRow, fromCol, availableCaptures, actualCaptures, maxCapturesPossible);
                    }
                    return true;
                }
            }
        }

        // Online multiplayer move handling
        if (this.gameMode === 'online' && window.onlineMultiplayer) {
            const capturedPieces = move.capturedPieces || [];
            const willPromote = (!piece.isKing) && (
                (piece.player === 1 && toRow === 0) ||
                (piece.player === 2 && toRow === 7)
            );

            console.log('📤 Sending move to online multiplayer:', {
                from: {row: fromRow, col: fromCol},
                to: {row: toRow, col: toCol},
                capturedPieces: capturedPieces,
                promoted: willPromote
            });

            try {
                const success = await window.onlineMultiplayer.sendMove(
                    fromRow, fromCol, toRow, toCol, capturedPieces, willPromote
                );

                if (!success) {
                    console.log('❌ Online move failed');
                    this.showTemporaryMessage('Move failed. Try again.', 2000);
                    return false;
                }

                // Move was applied locally inside sendMove; turn handled remotely.
                return true;
            } catch (error) {
                console.error('❌ Error sending online move:', error);
                this.showTemporaryMessage('Connection error. Try again.', 2000);
                return false;
            }
        }

        // Regular move execution for local games
        const oldPiece = this.board[toRow][toCol];
        
        // Clear the old position
        this.board[fromRow][fromCol] = null;
        
        // Place the piece in the new position
        this.board[toRow][toCol] = piece;
        
        // Handle captures
        if (move.capturedPieces) {
            move.capturedPieces.forEach(captured => {
                this.board[captured.row][captured.col] = null;
            });
        }
        
        // Check for promotion
        let promoted = false;
        if (!piece.isKing) {
            if ((piece.player === 1 && toRow === 0) || 
                (piece.player === 2 && toRow === 7)) {
                piece.isKing = true;
                promoted = true;
            }
        }
        
        // Record the move
        this.lastMove = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            captured: move.capturedPieces || [],
            promoted: promoted,
            player: this.currentPlayer
        };
        this.moveHistory.push(this.lastMove);
        
        // Update UI
        this.renderBoard();
        this.clearSelection();
        this.updateUI();
        
        // Check if game is over
        if (this.checkGameOver()) {
            this.showGameOver();
            return true;
        }
        
        // End turn
        this.endTurn();
        
        return true;
    }

    // Send Hezzek o Nfokh penalty to Firebase for multiplayer synchronization
    async sendHezzekPenaltyToFirebase(fromRow, fromCol, availableCaptures, actualCaptures, maxCaptures) {
        if (!isFirebaseReady()) {
            console.error('Firebase not ready for Hezzek penalty');
            return;
        }

        try {
            // Find the piece to eliminate (same logic as applyHezzekONfokh)
            let pieceToEliminate = null;
            
            for (const captureMove of availableCaptures) {
                const captureRow = captureMove.row;
                const captureCol = captureMove.col;
                
                if (this.board[captureRow] && this.board[captureRow][captureCol] && 
                    this.board[captureRow][captureCol].player === this.currentPlayer &&
                    !(captureRow === fromRow && captureCol === fromCol)) {
                    
                    pieceToEliminate = { row: captureRow, col: captureCol };
                    break;
                }
            }
            
            if (!pieceToEliminate && availableCaptures.length > 0) {
                const firstCapture = availableCaptures[0];
                pieceToEliminate = { row: firstCapture.row, col: firstCapture.col };
            }

            if (!pieceToEliminate) {
                console.error('No piece found to eliminate for Hezzek penalty');
                return;
            }

            // Create penalty data for Firebase
            const penaltyData = {
                type: 'hezzek_penalty',
                player: this.currentPlayer,
                eliminatedPiece: pieceToEliminate,
                actualCaptures: actualCaptures,
                maxCaptures: maxCaptures,
                timestamp: Date.now()
            };

            // Send penalty to Firebase
            console.log('🚨 Sending Hezzek penalty to Firebase:', penaltyData);
            await sendHezzekPenaltyToFirebase(penaltyData);
            
        } catch (error) {
            console.error('Error sending Hezzek penalty to Firebase:', error);
        }
    }

    // Execute a complete multi-jump sequence
    executeMultiJumpSequence(startRow, startCol, sequence, piece) {
        let currentRow = startRow;
        let currentCol = startCol;
        
        // Execute each jump in the sequence
        for (let i = 0; i < sequence.length; i++) {
            const jump = sequence[i];
            
            // Clear current position before moving
            this.board[currentRow][currentCol] = null;
            
            // Move piece to jump destination
            this.board[jump.row][jump.col] = piece;
            
            // Remove captured pieces for this jump
            if (jump.capturedPieces) {
                jump.capturedPieces.forEach(captured => {
                    this.board[captured.row][captured.col] = null;
                });
            }
            
            // Update current position for next iteration
            currentRow = jump.row;
            currentCol = jump.col;
        }
    }

    // End current turn
    endTurn() {
        console.log('🔄 endTurn called - before:', {
            currentPlayer: this.currentPlayer,
            gameMode: this.gameMode,
            gameOver: this.gameOver
        });
        
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.selectedPiece = null;
        this.validMoves = [];
        
        // Update global variable for compatibility
        window.currentPlayer = this.currentPlayer;
        
        // Clear selection effects
        this.clearSelectionEffects();
        
        console.log('🔄 endTurn - after player switch:', {
            newCurrentPlayer: this.currentPlayer,
            gameMode: this.gameMode,
            isAITurn: this.gameMode.startsWith('ai-') && this.currentPlayer === 2
        });
        
        // Re-render board to update piece states
        this.renderBoard();
        this.updateUI();
        
        // Trigger AI move if it's AI's turn
        if (this.gameMode.startsWith('ai-') && this.currentPlayer === 2) {
            console.log('🤖 Scheduling AI move from endTurn');
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }



    // Get all capture moves for a player
    getAllCaptureMoves(player) {
        const captures = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === player) {
                    const directions = this.getMoveDirections(piece);
                    
                    // Get single captures
                    const singleCaptures = this.getCaptureMovesFromPosition(row, col, piece, directions);
                    
                    // Get multi-jump sequences
                    const multiJumpSequences = this.getAllMultiJumpSequences(row, col, piece);
                    
                    // Combine all capture moves
                    const allCaptureMoves = [...singleCaptures, ...multiJumpSequences];
                    
                    if (allCaptureMoves.length > 0) {
                        captures.push({ row, col, moves: allCaptureMoves });
                        console.log(`Piece at (${row},${col}) has ${allCaptureMoves.length} capture options:`, allCaptureMoves);
                    }
                }
            }
        }
        
        console.log(`Total capture moves for player ${player}:`, captures);
        return captures;
    }

    // Check if game is over
    checkGameOver() {
        const player1Pieces = this.countPieces(1);
        const player2Pieces = this.countPieces(2);

        // Check if a player has no pieces
        if (player1Pieces === 0 || player2Pieces === 0) {
            return true;
        }

        // Check if current player has no valid moves
        const validMoves = this.getAllValidMoves(this.currentPlayer);
        if (validMoves.length === 0) {
            return true;
        }

        return false;
    }

    // Count pieces for a player
    countPieces(player) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === player) {
                    count++;
                }
            }
        }
        return count;
    }

    // Get all valid moves for a player
    getAllValidMoves(player) {
        const moves = [];
        const originalPlayer = this.currentPlayer;
        this.currentPlayer = player;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === player) {
                    const pieceMoves = this.getValidMovesForPlayer(row, col, player);
                    if (pieceMoves.length > 0) {
                        moves.push({ from: { row, col }, moves: pieceMoves });
                    }
                }
            }
        }
        
        this.currentPlayer = originalPlayer;
        return moves;
    }

    // Get valid moves for a specific player (helper for AI)
    getValidMovesForPlayer(row, col, player) {
        const piece = this.board[row][col];
        if (!piece || piece.player !== player) return [];

        const directions = this.getMoveDirections(piece);

        // Get all moves (captures + regular moves) - no forced captures in hezzek o nfokh
        const captures = this.getCaptureMovesFromPosition(row, col, piece, directions);
        const regularMoves = this.getRegularMovesFromPosition(row, col, piece, directions);
        
        return [...captures, ...regularMoves];
    }

    // Show game over modal
    showGameOver() {
        this.gameOver = true;
        const player1Count = this.countPieces(1);
        const player2Count = this.countPieces(2);

        let winner, message;
        
        if (player1Count === 0) {
            winner = this.gameMode === 'pvp' ? 'Player 2' : 'AI';
            message = `${winner} wins! All Player 1 pieces captured.`;
        } else if (player2Count === 0) {
            winner = 'Player 1';
            message = `${winner} wins! All ${this.gameMode === 'pvp' ? 'Player 2' : 'AI'} pieces captured.`;
        } else {
            // No valid moves
            const otherPlayer = this.currentPlayer === 1 ? 2 : 1;
            winner = otherPlayer === 1 ? 'Player 1' : (this.gameMode === 'pvp' ? 'Player 2' : 'AI');
            message = `${winner} wins! No valid moves available.`;
        }

        document.getElementById('gameOverTitle').textContent = 'Game Over!';
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverModal').classList.add('active');
    }

    // Hide game over modal
    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('active');
    }

    // Get maximum captures available for current player
    getMaximumCapturesAvailable() {
        let maxCaptures = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === this.currentPlayer) {
                    const sequences = this.getAllMultiJumpSequences(row, col, piece);
                    sequences.forEach(sequenceMove => {
                        // sequenceMove has capturedPieces array directly
                        const totalCaptures = sequenceMove.capturedPieces ? sequenceMove.capturedPieces.length : 0;
                        maxCaptures = Math.max(maxCaptures, totalCaptures);
                    });
                    
                    // Also check single captures
                    const directions = this.getMoveDirections(piece);
                    const singleCaptures = this.getCaptureMovesFromPosition(row, col, piece, directions);
                    singleCaptures.forEach(capture => {
                        if (capture.capturedPieces) {
                            maxCaptures = Math.max(maxCaptures, capture.capturedPieces.length);
                        }
                    });
                }
            }
        }
        
        console.log('Maximum captures available:', maxCaptures);
        return maxCaptures;
    }

    // Apply Hezzek o Nfokh rule (traditional Moroccan penalty)
    applyHezzekONfokh(fromRow, fromCol, availableCaptures, actualCaptures = 0, maxCaptures = 0) {
        // Find a piece that could have captured but didn't (or captured less than possible)
        let pieceToEliminate = null;
        
        // Look for the first piece that had capture opportunities
        for (const captureMove of availableCaptures) {
            const captureRow = captureMove.row;
            const captureCol = captureMove.col;
            
            // Make sure this piece still exists and isn't the piece that just moved
            if (this.board[captureRow] && this.board[captureRow][captureCol] && 
                this.board[captureRow][captureCol].player === this.currentPlayer &&
                !(captureRow === fromRow && captureCol === fromCol)) {
                
                pieceToEliminate = { row: captureRow, col: captureCol };
                break;
            }
        }
        
        // If no other piece found, eliminate any piece that had captures (could be the moving piece)
        if (!pieceToEliminate && availableCaptures.length > 0) {
            const firstCapture = availableCaptures[0];
            pieceToEliminate = { row: firstCapture.row, col: firstCapture.col };
        }
        
        // Remove the piece that should have captured
        if (pieceToEliminate && this.board[pieceToEliminate.row][pieceToEliminate.col]) {
            this.board[pieceToEliminate.row][pieceToEliminate.col] = null;
            
            // Record the hezzek o nfokh in move history
            const playerName = this.currentPlayer === 1 ? 'Player 1' : 'Player 2';
            const penaltyReason = actualCaptures === 0 ? 
                'missing capture' : 
                `capturing only ${actualCaptures} instead of ${maxCaptures} pieces`;
                
            this.lastMove = {
                from: { row: pieceToEliminate.row, col: pieceToEliminate.col },
                to: { row: pieceToEliminate.row, col: pieceToEliminate.col },
                hezzekONfokh: true,
                player: this.currentPlayer,
                eliminatedPiece: pieceToEliminate,
                actualCaptures,
                maxCaptures,
                description: `${playerName} - Hezzek o Nfokh! Piece at (${pieceToEliminate.row},${pieceToEliminate.col}) eliminated for ${penaltyReason}`
            };
            this.moveHistory.push(this.lastMove);
            
            // Show hezzek modal
            this.showHezzekModal(availableCaptures, pieceToEliminate, actualCaptures, maxCaptures);
            
            // Update UI
            this.renderBoard();
            this.updateUI();
            
            // Check if game is over after piece removal
            if (this.checkGameOver()) {
                setTimeout(() => {
                    this.hideHezzekModal();
                    this.showGameOver();
                }, 2000);
            } else {
                // End turn after penalty
                this.endTurn();
            }
        }
    }

    // Show Hezzek o Nfokh modal
    showHezzekModal(availableCaptures, eliminatedPiece, actualCaptures = 0, maxCaptures = 0) {
        const playerName = this.currentPlayer === 1 ? 'Player 1' : 'Player 2';
        
        let captureInfo;
        if (actualCaptures === 0) {
            captureInfo = availableCaptures.length > 1 ? 
                `You had ${availableCaptures.length} pieces that could capture!` :
                'You had a piece that could capture!';
        } else {
            captureInfo = `You captured ${actualCaptures} piece${actualCaptures > 1 ? 's' : ''} but could have captured ${maxCaptures}!`;
        }
            
        const pieceInfo = eliminatedPiece ? 
            `The piece at position (${eliminatedPiece.row + 1},${eliminatedPiece.col + 1}) has been eliminated as punishment.` :
            'A piece has been eliminated as punishment.';
            
        document.getElementById('hezzekMessage').textContent = 
            `${playerName}: ${captureInfo} ${pieceInfo}`;
        
        document.getElementById('hezzekModal').classList.add('active');
    }

    // Hide Hezzek o Nfokh modal
    hideHezzekModal() {
        document.getElementById('hezzekModal').classList.remove('active');
    }

    // Update UI elements
    updateUI() {
        try {
            // Update player turn display
            const playerText = document.getElementById('playerText');
            const playerIndicator = document.getElementById('currentPlayer');
            
            if (playerText && playerIndicator) {
                // For AI modes
                if (this.gameMode.startsWith('ai-') && this.currentPlayer === 2) {
                    playerText.textContent = 'AI\'s Turn';
                }
                // For PvP mode
                else if (this.gameMode === 'pvp') {
                    playerText.textContent = `Player ${this.currentPlayer}'s Turn`;
                }
                // Online mode is handled by the onlineMultiplayer object
                
                // Update the player color indicator
                if (playerIndicator.querySelector('.player-color')) {
                    playerIndicator.querySelector('.player-color').className = `player-color player${this.currentPlayer}`;
                }
            }

            // Update player piece counts
            const player1Count = document.getElementById('player1Count');
            const player2Count = document.getElementById('player2Count');
            
            if (player1Count) {
                player1Count.textContent = this.countPieces(1);
            }
            
            if (player2Count) {
                player2Count.textContent = this.countPieces(2);
            }

            // Update move counter
            const moveCountElement = document.getElementById('moveCount');
            if (moveCountElement) {
                moveCountElement.textContent = this.moveHistory.length;
            }

            // Update move history
            this.updateMoveHistory();
            
            // Debug info for online mode
            if (window.currentGameMode === 'online' && window.onlineMultiplayer) {
                console.log('UI Updated - current player:', this.currentPlayer, 
                          'Player number:', window.onlineMultiplayer.playerNumber,
                          'Is my turn:', this.currentPlayer === window.onlineMultiplayer.playerNumber);
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            
            // Add additional context about game state in case of error
            if (window.currentGameMode === 'online') {
                console.error('Error updating UI in online mode:', 
                             'Current player:', this.currentPlayer,
                             'Game mode:', this.gameMode,
                             'Player number:', window.onlineMultiplayer ? window.onlineMultiplayer.playerNumber : 'unknown');
            }
        }
    }



    // Update move history display
    updateMoveHistory() {
        const historyElement = document.getElementById('moveHistory');
        historyElement.innerHTML = '';

        this.moveHistory.slice(-10).forEach((move, index) => {
            const entry = document.createElement('div');
            entry.className = 'move-entry';
            
            const moveNum = this.moveHistory.length - 10 + index + 1;
            
            if (move.hezzekONfokh) {
                entry.style.background = 'rgba(251, 191, 36, 0.2)';
                entry.style.borderLeft = '3px solid rgba(251, 191, 36, 0.6)';
                entry.style.color = '#fbbf24';
                entry.textContent = `${moveNum}. 🚨 ${move.description}`;
            } else {
                const player = (moveNum % 2 === 1) ? 'P1' : (this.gameMode === 'pvp' ? 'P2' : 'AI');
                
                let moveText = `${moveNum}. ${player}: `;
                moveText += `(${move.from.row},${move.from.col}) → (${move.to.row},${move.to.col})`;
                
                if (move.captured && move.captured.length > 0) {
                    moveText += ` [Captured ${move.captured.length}]`;
                }
                
                if (move.promoted) {
                    moveText += ` [👑 Promoted]`;
                }

                entry.textContent = moveText;
            }

            historyElement.appendChild(entry);
        });

        historyElement.scrollTop = historyElement.scrollHeight;
    }

    // AI IMPLEMENTATION

    // Make AI move based on difficulty
    makeAIMove() {
        if (this.currentPlayer !== 2 || this.gameOver) {
            console.log('AI Move skipped - currentPlayer:', this.currentPlayer, 'gameOver:', this.gameOver);
            return;
        }

        console.log('AI is making a move with mode:', this.gameMode);

        // Add mobile-specific protection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('🔍 Device check:', {isMobile, userAgent: navigator.userAgent});

        // Show AI thinking indicator
        this.showAIThinking();

        // Add safety timeout for mobile devices
        const safetyTimeout = setTimeout(() => {
            console.error('🚨 AI move safety timeout triggered - preventing crash');
            this.hideAIThinking();
            this.showTemporaryMessage('AI move timeout - trying simpler approach');
            
            // Try emergency fallback move
            this.makeEmergencyAIMove();
        }, isMobile ? 3000 : 8000); // Shorter timeout for mobile

        // Force captures if available (Hezzek o Nfokh rule)
        const forcedCaptures = this.getAllCaptureMoves(2);
        
        if (forcedCaptures.length > 0) {
            console.log('Forced captures available:', forcedCaptures.length);
            console.log('Forced captures data:', forcedCaptures);
            
            // Try multiple approaches to get a capture move
            let bestCapture = null;
            
            // Approach 1: Use sophisticated evaluation
            try {
                bestCapture = this.getBestCaptureMove(forcedCaptures);
                console.log('Sophisticated evaluation result:', bestCapture);
            } catch (error) {
                console.error('Sophisticated evaluation failed:', error);
            }
            
            // Approach 2: Simple direct selection
            if (!bestCapture) {
                console.log('Trying direct capture selection...');
                bestCapture = this.getDirectCaptureMove(forcedCaptures);
                console.log('Direct selection result:', bestCapture);
            }
            
            // Approach 3: Emergency fallback - just pick the very first capture
            if (!bestCapture) {
                console.log('Using emergency capture selection...');
                const firstPiece = forcedCaptures[0];
                if (firstPiece && firstPiece.moves && firstPiece.moves.length > 0) {
                    bestCapture = {
                        from: { row: firstPiece.row, col: firstPiece.col },
                        to: { row: firstPiece.moves[0].row, col: firstPiece.moves[0].col }
                    };
                    console.log('Emergency selection result:', bestCapture);
                }
            }
            
            if (bestCapture) {
                console.log('Final AI capture move:', bestCapture);
                
                // Validate move structure
                if (!bestCapture.from || !bestCapture.to || 
                    typeof bestCapture.from.row === 'undefined' || typeof bestCapture.from.col === 'undefined' ||
                    typeof bestCapture.to.row === 'undefined' || typeof bestCapture.to.col === 'undefined') {
                    console.error('Invalid capture move structure:', bestCapture);
                    this.continueWithRegularAI();
                    return;
                }

                // Validate that the piece exists at the from position
                if (!this.board[bestCapture.from.row] || !this.board[bestCapture.from.row][bestCapture.from.col] ||
                    this.board[bestCapture.from.row][bestCapture.from.col].player !== 2) {
                    console.error('No AI piece at capture move from position:', bestCapture.from);
                    this.continueWithRegularAI();
                    return;
                }

                this.hideAIThinking();
                this.selectPiece(bestCapture.from.row, bestCapture.from.col);
                setTimeout(() => {
                    try {
                        console.log('Executing move from', bestCapture.from, 'to', bestCapture.to);
                        const moveResult = this.makeMove(bestCapture.from.row, bestCapture.from.col, bestCapture.to.row, bestCapture.to.col);
                        console.log('Capture move execution result:', moveResult);
                        
                        // Clear safety timeout on successful move
                        if (safetyTimeout) {
                            clearTimeout(safetyTimeout);
                        }
                        
                        // Note: makeMove might not return a boolean, so check for undefined too
                        if (moveResult === false) {
                            console.error('makeMove returned false, trying regular AI');
                            this.continueWithRegularAI();
                        }
                    } catch (error) {
                        console.error('Error executing capture move:', error);
                        if (safetyTimeout) {
                            clearTimeout(safetyTimeout);
                        }
                        this.continueWithRegularAI();
                    }
                }, 200);
                return;
            } else {
                console.error('ALL CAPTURE METHODS FAILED! Continuing with regular AI logic');
                // Continue with regular AI logic as last resort
            }
        }

        // No forced captures - make regular move based on difficulty
        const startTime = Date.now();
        
        // Use setTimeout to allow UI updates
        setTimeout(() => {
        let move;
        
        try {
            switch (this.gameMode) {
                case 'ai-easy':
                    move = this.getEasyAIMove();
                    break;
                case 'ai-medium':
                    move = isMobile ? this.getEasyAIMove() : this.getMediumAIMove(); // Use easier AI on mobile
                    break;
                case 'ai-hard':
                    move = isMobile ? this.getMediumAIMove() : this.getHardAIMove(); // Use medium AI on mobile
                    break;
                default:
                    console.log('Unknown AI mode:', this.gameMode);
                    this.hideAIThinking();
                    return;
            }

            const thinkTime = Date.now() - startTime;
            console.log(`AI thought for ${thinkTime}ms`);

            this.hideAIThinking();
        } catch (error) {
            console.error('❌ AI thinking process failed:', error);
            if (safetyTimeout) {
                clearTimeout(safetyTimeout);
            }
            this.hideAIThinking();
            this.makeEmergencyAIMove();
            return;
        }

        if (move) {
            console.log('AI move found:', move);
            this.selectPiece(move.from.row, move.from.col);
            setTimeout(() => {
                try {
                    this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
                    // Clear safety timeout on successful move
                    if (safetyTimeout) {
                        clearTimeout(safetyTimeout);
                    }
                } catch (error) {
                    console.error('Error executing regular AI move:', error);
                    if (safetyTimeout) {
                        clearTimeout(safetyTimeout);
                    }
                    this.makeEmergencyAIMove();
                }
            }, 200);
        } else {
            console.log('No AI move found!');
            if (safetyTimeout) {
                clearTimeout(safetyTimeout);
            }
            this.makeEmergencyAIMove();
        }
        }, 50); // Small delay to allow UI update
    }

    // Show AI thinking indicator
    showAIThinking() {
        const playerText = document.getElementById('playerText');
        if (playerText) {
            playerText.innerHTML = '<i class="fas fa-cog fa-spin"></i> AI is thinking...';
            playerText.style.opacity = '0.8';
        }
    }

    // Hide AI thinking indicator
    hideAIThinking() {
        setTimeout(() => {
            this.updateUI(); // This will restore the normal player text
        }, 100);
    }

    // Emergency AI move - simplest possible valid move
    makeEmergencyAIMove() {
        console.log('🚨 Making emergency AI move');
        
        try {
            // Get all possible moves for AI
            const allMoves = this.getAllValidMoves(2);
            
            if (allMoves.length === 0) {
                console.error('No valid moves available for emergency AI');
                this.hideAIThinking();
                return;
            }
            
            // Just pick the first valid move
            const firstPiece = allMoves[0];
            const firstMove = firstPiece.moves[0];
            
            console.log('🚨 Emergency move selected:', {
                from: firstPiece.from,
                to: firstMove
            });
            
            this.hideAIThinking();
            this.selectPiece(firstPiece.from.row, firstPiece.from.col);
            
            setTimeout(() => {
                try {
                    this.makeMove(firstPiece.from.row, firstPiece.from.col, firstMove.row, firstMove.col);
                    console.log('✅ Emergency move executed successfully');
                } catch (error) {
                    console.error('❌ Emergency move failed:', error);
                    this.hideAIThinking();
                    this.showTemporaryMessage('AI move failed');
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Emergency AI move failed:', error);
            this.hideAIThinking();
            this.showTemporaryMessage('AI encountered an error');
        }
    }

    // Continue with regular AI logic as fallback
    continueWithRegularAI() {
        console.log('Continuing with regular AI logic');
        
        // Use setTimeout to allow UI updates
        setTimeout(() => {
            let move;
            
            switch (this.gameMode) {
                case 'ai-easy':
                    move = this.getEasyAIMove();
                    break;
                case 'ai-medium':
                    move = this.getMediumAIMove();
                    break;
                case 'ai-hard':
                    move = this.getHardAIMove();
                    break;
                default:
                    console.log('Unknown AI mode:', this.gameMode);
                    this.hideAIThinking();
                    return;
            }

            this.hideAIThinking();

            if (move) {
                console.log('Fallback AI move found:', move);
                this.selectPiece(move.from.row, move.from.col);
                setTimeout(() => {
                    this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
                }, 200);
            } else {
                console.log('No fallback AI move found - passing turn');
                this.endTurn(); // Pass the turn if no move is possible
            }
        }, 50);
    }

    // Get the best capture move using current difficulty evaluation
    getBestCaptureMove(captureMoves) {
        if (!captureMoves || captureMoves.length === 0) {
            console.log('No capture moves provided to getBestCaptureMove');
            return null;
        }

        console.log('Evaluating', captureMoves.length, 'capture moves');
        console.log('Capture moves structure:', captureMoves);
        
        let bestMove = null;
        let bestScore = -Infinity;
        let validMoveCount = 0;

        captureMoves.forEach((pieceMove, pieceIndex) => {
            // Fix: getAllCaptureMoves returns { row, col, moves } not { from: {row, col}, moves }
            if (!pieceMove || !pieceMove.moves || typeof pieceMove.row === 'undefined' || typeof pieceMove.col === 'undefined') {
                console.warn('Invalid piece move at index', pieceIndex, pieceMove);
                return;
            }

            const fromPos = { row: pieceMove.row, col: pieceMove.col };

            pieceMove.moves.forEach((move, moveIndex) => {
                if (!move || typeof move.row === 'undefined' || typeof move.col === 'undefined') {
                    console.warn('Invalid move at piece', pieceIndex, 'move', moveIndex, move);
                    return;
                }

                validMoveCount++;
                let score = this.evaluateCaptureMove(fromPos, move);
                
                // Apply difficulty-based evaluation
                try {
                    switch (this.gameMode) {
                        case 'ai-easy':
                            score += Math.random() * 50 - 25; // Add randomness
                            break;
                        case 'ai-medium':
                            score += this.evaluateStrategicCapture(fromPos, move);
                            break;
                        case 'ai-hard':
                            score += this.evaluateStrategicCapture(fromPos, move);
                            score += this.evaluateTacticalConsequences(fromPos, move);
                            break;
                    }
                } catch (error) {
                    console.error('Error evaluating capture move:', error, 'fromPos:', fromPos, 'move:', move);
                    score = 100; // Default score if evaluation fails - still prefer captures
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        from: fromPos,
                        to: { row: move.row, col: move.col }
                    };
                }
            });
        });

        console.log('Found', validMoveCount, 'valid capture moves, best score:', bestScore);
        
        if (bestMove) {
            console.log('Best capture move selected:', bestMove);
        } else {
            console.error('No best capture move found despite having moves to evaluate');
            
            // Emergency fallback - pick the first valid capture
            if (captureMoves.length > 0 && captureMoves[0].moves && captureMoves[0].moves.length > 0) {
                const emergencyMove = captureMoves[0];
                bestMove = {
                    from: { row: emergencyMove.row, col: emergencyMove.col },
                    to: { row: emergencyMove.moves[0].row, col: emergencyMove.moves[0].col }
                };
                console.log('Using emergency fallback move:', bestMove);
            }
        }

        return bestMove;
    }

    // Simple direct capture selection (no complex evaluation)
    getDirectCaptureMove(captureMoves) {
        console.log('getDirectCaptureMove called with:', captureMoves);
        
        if (!captureMoves || captureMoves.length === 0) {
            return null;
        }

        // Find the first piece with capture moves
        for (let i = 0; i < captureMoves.length; i++) {
            const piece = captureMoves[i];
            if (piece && piece.moves && piece.moves.length > 0 && 
                typeof piece.row !== 'undefined' && typeof piece.col !== 'undefined') {
                
                // Find the first valid capture move
                for (let j = 0; j < piece.moves.length; j++) {
                    const move = piece.moves[j];
                    if (move && typeof move.row !== 'undefined' && typeof move.col !== 'undefined') {
                        const directMove = {
                            from: { row: piece.row, col: piece.col },
                            to: { row: move.row, col: move.col }
                        };
                        console.log('Direct capture move found:', directMove);
                        return directMove;
                    }
                }
            }
        }

        console.log('No direct capture move found');
        return null;
    }

    // Evaluate capture moves specifically
    evaluateCaptureMove(from, move) {
        let score = 0;
        
        // Base value for captures
        if (move.capturedPieces && move.capturedPieces.length > 0) {
            move.capturedPieces.forEach(captured => {
                const capturedPiece = this.board[captured.row][captured.col];
                if (capturedPiece) {
                    score += capturedPiece.isKing ? 120 : 80; // Kings more valuable
                }
            });
            
            // Multiple captures bonus (heavily favor multi-jumps)
            if (move.capturedPieces.length > 1) {
                score += move.capturedPieces.length * 50; // Increased bonus for multi-jumps
                console.log(`Multi-jump move capturing ${move.capturedPieces.length} pieces, bonus score: ${move.capturedPieces.length * 50}`);
            }
        }
        
        // Extra bonus for multi-jump sequences
        if (move.isMultiJump) {
            score += 100; // Significant bonus for multi-jump moves
            console.log('Multi-jump sequence detected, adding 100 bonus points');
        }
        
        console.log(`Capture move evaluation - from: (${from.row},${from.col}) to: (${move.row},${move.col}) score: ${score}`);
        return score;
    }

    // Strategic evaluation for captures
    evaluateStrategicCapture(from, move) {
        let score = 0;
        
        // Prefer captures that improve position
        score += this.evaluatePositionAfterCapture(from, move);
        
        // Avoid captures that expose pieces to counter-attack
        score -= this.evaluateExposureAfterCapture(from, move) * 0.8;
        
        return score;
    }

    // Evaluate position strength after capture
    evaluatePositionAfterCapture(from, move) {
        let score = 0;
        
        // Advancement bonus
        if (move.row > from.row) {
            score += 15;
        }
        
        // King promotion opportunity
        const piece = this.board[from.row][from.col];
        if (!piece.isKing && move.row === 7) {
            score += 100;
        }
        
        // Central position bonus
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        score += (7 - centerDistance) * 3;
        
        return score;
    }

    // Evaluate how exposed the piece will be after capture
    evaluateExposureAfterCapture(from, move) {
        let exposureScore = 0;
        
        // Check how many enemy pieces can threaten this position
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            const threatRow = move.row - dr;
            const threatCol = move.col - dc;
            const jumpRow = move.row + dr;
            const jumpCol = move.col + dc;
            
            if (this.isValidPosition(threatRow, threatCol) && 
                this.isValidPosition(jumpRow, jumpCol)) {
                
                const threatPiece = this.board[threatRow][threatCol];
                const jumpSquare = this.board[jumpRow][jumpCol];
                
                if (threatPiece && threatPiece !== 'light' && 
                    threatPiece.player === 1 && !jumpSquare) {
                    exposureScore += 40;
                }
            }
        });
        
        return exposureScore;
    }

    // Evaluate tactical consequences of a move
    evaluateTacticalConsequences(from, move) {
        let score = 0;
        
        // Look for tactical patterns after this move
        score += this.evaluateForkOpportunities(from, move);
        score += this.evaluatePinOpportunities(from, move);
        score -= this.evaluateCounterAttackRisk(from, move);
        
        return score;
    }

    // Check for fork opportunities (attacking multiple pieces)
    evaluateForkOpportunities(from, move) {
        let forkScore = 0;
        let threatenedPieces = 0;
        
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            const threatRow = move.row + dr;
            const threatCol = move.col + dc;
            const jumpRow = move.row + (2 * dr);
            const jumpCol = move.col + (2 * dc);
            
            if (this.isValidPosition(threatRow, threatCol) && 
                this.isValidPosition(jumpRow, jumpCol)) {
                
                const threatPiece = this.board[threatRow][threatCol];
                const jumpSquare = this.board[jumpRow][jumpCol];
                
                if (threatPiece && threatPiece !== 'light' && 
                    threatPiece.player === 1 && !jumpSquare) {
                    threatenedPieces++;
                }
            }
        });
        
        if (threatenedPieces >= 2) {
            forkScore += 50 * threatenedPieces; // Fork bonus
        }
        
        return forkScore;
    }

    // Check for pin opportunities (restricting enemy movement)
    evaluatePinOpportunities(from, move) {
        // Simplified pin evaluation - check if move controls key squares
        let pinScore = 0;
        
        // Control of back rank
        if (move.row === 0 || move.row === 7) {
            pinScore += 20;
        }
        
        // Control of center
        if (move.row >= 3 && move.row <= 4 && move.col >= 3 && move.col <= 4) {
            pinScore += 15;
        }
        
        return pinScore;
    }

    // Evaluate counter-attack risk
    evaluateCounterAttackRisk(from, move) {
        let riskScore = 0;
        
        // Count immediate threats to this position
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            const attackRow = move.row - dr;
            const attackCol = move.col - dc;
            const escapeRow = move.row + dr;
            const escapeCol = move.col + dc;
            
            if (this.isValidPosition(attackRow, attackCol) && 
                this.isValidPosition(escapeRow, escapeCol)) {
                
                const attackPiece = this.board[attackRow][attackCol];
                const escapeSquare = this.board[escapeRow][escapeCol];
                
                if (attackPiece && attackPiece !== 'light' && 
                    attackPiece.player === 1 && !escapeSquare) {
                    riskScore += 35;
                }
            }
        });
        
        return riskScore;
    }

    // Easy AI: Basic understanding with some mistakes (instant response)
    getEasyAIMove() {
        const allMoves = this.getAllValidMoves(2);
        if (allMoves.length === 0) return null;

        // Quick evaluation - prioritize captures but with some randomness
        const captureMoves = allMoves.filter(pieceMove => 
            pieceMove.moves.some(move => move.capturedPieces && move.capturedPieces.length > 0)
        );

        // If captures available, usually take them (80% chance)
        if (captureMoves.length > 0 && Math.random() < 0.8) {
            return this.getQuickCaptureMove(captureMoves);
        }

        // 60% chance to make a reasonable move, 40% random
        if (Math.random() < 0.6) {
            return this.getQuickReasonableMove(allMoves);
        } else {
            return this.getRandomMove(allMoves);
        }
    }

    // Quick capture move evaluation (simplified)
    getQuickCaptureMove(captureMoves) {
        if (!captureMoves || captureMoves.length === 0) {
            return null;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        captureMoves.forEach(pieceMove => {
            if (pieceMove && pieceMove.moves && pieceMove.from) {
                pieceMove.moves.forEach(move => {
                    if (move && typeof move.row !== 'undefined' && typeof move.col !== 'undefined') {
                        let score = 10; // Base score for any valid capture
                        
                        // Basic capture value
                        if (move.capturedPieces && move.capturedPieces.length > 0) {
                            score += move.capturedPieces.length * 50;
                        }
                        
                        // Small positional bonus
                        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
                        score += (7 - centerDistance) * 2;
                        
                        // Random factor
                        score += Math.random() * 20 - 10;
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = {
                                from: pieceMove.from,
                                to: { row: move.row, col: move.col }
                            };
                        }
                    }
                });
            }
        });

        // If no best move found, pick the first available capture as emergency fallback
        if (!bestMove && captureMoves.length > 0) {
            const firstCapture = captureMoves[0];
            if (firstCapture && firstCapture.moves && firstCapture.moves.length > 0) {
                bestMove = {
                    from: firstCapture.from,
                    to: { row: firstCapture.moves[0].row, col: firstCapture.moves[0].col }
                };
            }
        }

        return bestMove;
    }

    // Get a quick reasonable move (simplified evaluation)
    getQuickReasonableMove(allMoves) {
        if (!allMoves || allMoves.length === 0) {
            console.warn('No moves available for quick reasonable selection');
            return null;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        allMoves.forEach(pieceMove => {
            if (!pieceMove || !pieceMove.moves || !pieceMove.from) {
                return; // Skip invalid piece moves
            }

            pieceMove.moves.forEach(move => {
                if (!move || typeof move.row === 'undefined' || typeof move.col === 'undefined') {
                    return; // Skip invalid moves
                }

                let score = 0;
                
                // Basic move evaluation (simplified)
                if (move.capturedPieces && move.capturedPieces.length > 0) {
                    score += 40; // Captures
                }
                
                // Advancement bonus
                if (move.row > pieceMove.from.row) {
                    score += 8;
                }
                
                // King promotion
                const piece = this.board[pieceMove.from.row][pieceMove.from.col];
                if (piece && !piece.isKing && move.row === 7) {
                    score += 50;
                }
                
                // Small center bonus
                const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
                score += (7 - centerDistance) * 1;
                
                // Large randomness for Easy AI
                score += Math.random() * 25 - 12.5;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        from: pieceMove.from,
                        to: { row: move.row, col: move.col }
                    };
                }
            });
        });

        return bestMove || this.getRandomMove(allMoves);
    }

    // Get completely random move
    getRandomMove(allMoves) {
        if (!allMoves || allMoves.length === 0) {
            console.warn('No moves available for random selection');
            return null;
        }

        const randomPieceMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        
        if (!randomPieceMove || !randomPieceMove.moves || randomPieceMove.moves.length === 0) {
            console.warn('Invalid piece move structure in random selection');
            return null;
        }

        const randomMove = randomPieceMove.moves[Math.floor(Math.random() * randomPieceMove.moves.length)];

        return {
            from: randomPieceMove.from,
            to: { row: randomMove.row, col: randomMove.col }
        };
    }

    // Medium AI: Good tactical play with strategic understanding
    getMediumAIMove() {
        const allMoves = this.getAllValidMoves(2);
        if (allMoves.length === 0) return null;

        // Use time-limited search for medium AI (max 2 seconds)
        const result = this.timeLimitedSearch(2000, 2);
        
        if (result.move) {
            return result.move;
        }

        // Fallback to strategic evaluation
        return this.getStrategicMove(allMoves, false);
    }

    // Hard AI: Deep strategic play with strong tactics
    getHardAIMove() {
        const allMoves = this.getAllValidMoves(2);
        if (allMoves.length === 0) return null;

        // Use time-limited search for hard AI (max 4 seconds)
        const result = this.timeLimitedSearch(4000, 2);
        
        if (result.move) {
            return result.move;
        }
        
        // Fallback to advanced strategic evaluation
        return this.getStrategicMove(allMoves, true);
    }

    // Time-limited iterative deepening search
    timeLimitedSearch(maxTimeMs, aiPlayer) {
        const startTime = Date.now();
        let bestMove = null;
        let bestScore = -Infinity;
        let depth = 1;
        const maxDepth = 6; // Absolute maximum depth
        
        // Iterative deepening - go deeper until time runs out
        while (depth <= maxDepth) {
            const timeElapsed = Date.now() - startTime;
            if (timeElapsed >= maxTimeMs) break;
            
            try {
                const result = this.enhancedMinimaxWithTimeout(depth, -Infinity, Infinity, true, aiPlayer, startTime, maxTimeMs);
                
                if (result.timedOut) {
                    break; // Time's up, use best move found so far
                }
                
                if (result.move) {
                    bestMove = result.move;
                    bestScore = result.score;
                }
                
                depth++;
            } catch (error) {
                // If we hit an error, use what we have
                break;
            }
        }
        
        return { move: bestMove, score: bestScore };
    }

    // Get strategic move with comprehensive evaluation
    getStrategicMove(allMoves, isHardMode) {
        if (!allMoves || allMoves.length === 0) {
            console.warn('No moves available for strategic selection');
            return null;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        allMoves.forEach(pieceMove => {
            if (!pieceMove || !pieceMove.moves || !pieceMove.from) {
                return; // Skip invalid piece moves
            }

            pieceMove.moves.forEach(move => {
                if (!move || typeof move.row === 'undefined' || typeof move.col === 'undefined') {
                    return; // Skip invalid moves
                }

                let score = this.evaluateStrategicMove(pieceMove.from, move, isHardMode);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        from: pieceMove.from,
                        to: { row: move.row, col: move.col }
                    };
                }
            });
        });

        return bestMove;
    }

    // Comprehensive strategic move evaluation
    evaluateStrategicMove(from, move, isAdvanced) {
        let score = 0;
        
        // Basic move value
        score += this.evaluateBasicMove(from, move);
        
        // Positional evaluation
        score += this.evaluatePosition(from, move);
        
        // Safety evaluation
        score += this.evaluateSafety(from, move);
        
        // Mobility and control
        score += this.evaluateMobilityAndControl(from, move);
        
        if (isAdvanced) {
            // Advanced tactical evaluation
            score += this.evaluateAdvancedTactics(from, move);
            
            // Endgame evaluation
            score += this.evaluateEndgameStrategy(from, move);
        }
        
        return score;
    }

    // Evaluate basic move characteristics
    evaluateBasicMove(from, move) {
        let score = 0;
        const piece = this.board[from.row][from.col];
        
        // Captures
        if (move.capturedPieces && move.capturedPieces.length > 0) {
            move.capturedPieces.forEach(captured => {
                const capturedPiece = this.board[captured.row][captured.col];
                score += capturedPiece.isKing ? 100 : 60;
            });
        }
        
        // King promotion
        if (!piece.isKing && move.row === 7) {
            score += 90;
        }
        
        // Advancement
        if (move.row > from.row) {
            score += 8;
        }
        
        return score;
    }

    // Evaluate positional strength
    evaluatePosition(from, move) {
        let score = 0;
        
        // Central control
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        score += (7 - centerDistance) * 4;
        
        // Back rank control
        if (move.row === 7) {
            score += 15;
        }
        
        // Support from friendly pieces
        let supportCount = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            const supportRow = move.row + dr;
            const supportCol = move.col + dc;
            if (this.isValidPosition(supportRow, supportCol)) {
                const supportPiece = this.board[supportRow][supportCol];
                if (supportPiece && supportPiece !== 'light' && supportPiece.player === 2) {
                    supportCount++;
                }
            }
        });
        score += supportCount * 8;
        
        return score;
    }

    // Evaluate move safety
    evaluateSafety(from, move) {
        let score = 0;
        
        // Check immediate threats after move
        let threatCount = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        directions.forEach(([dr, dc]) => {
            const threatRow = move.row - dr;
            const threatCol = move.col - dc;
            const escapeRow = move.row + dr;
            const escapeCol = move.col + dc;
            
            if (this.isValidPosition(threatRow, threatCol) && 
                this.isValidPosition(escapeRow, escapeCol)) {
                
                const threatPiece = this.board[threatRow][threatCol];
                const escapeSquare = this.board[escapeRow][escapeCol];
                
                if (threatPiece && threatPiece !== 'light' && 
                    threatPiece.player === 1 && !escapeSquare) {
                    threatCount++;
                }
            }
        });
        
        score -= threatCount * 25;
        
        // Edge safety (avoid being trapped)
        if (move.col === 0 || move.col === 7) {
            score -= 12;
        }
        
        return score;
    }

    // Evaluate mobility and board control
    evaluateMobilityAndControl(from, move) {
        let score = 0;
        
        // Simulate the move to evaluate resulting position
        const originalBoard = this.copyBoard();
        const piece = this.board[from.row][from.col];
        
        // Temporarily make the move
        this.board[move.row][move.col] = piece;
        this.board[from.row][from.col] = null;
        
        // Remove captured pieces
        if (move.capturedPieces) {
            move.capturedPieces.forEach(captured => {
                this.board[captured.row][captured.col] = null;
            });
        }
        
        // Count mobility after move
        const aiMobility = this.getAllValidMoves(2).length;
        const opponentMobility = this.getAllValidMoves(1).length;
        
        score += (aiMobility - opponentMobility) * 3;
        
        // Restore board
        this.board = originalBoard;
        
        return score;
    }

    // Advanced tactical evaluation
    evaluateAdvancedTactics(from, move) {
        let score = 0;
        
        // Multi-piece threats
        score += this.evaluateForkOpportunities(from, move);
        
        // Sacrifice evaluation
        score += this.evaluateSacrificeValue(from, move);
        
        // Tempo advantage
        score += this.evaluateTempoAdvantage(from, move);
        
        return score;
    }

    // Evaluate sacrifice opportunities
    evaluateSacrificeValue(from, move) {
        let score = 0;
        
        // Check if exposing this piece leads to bigger gains
        const exposureRisk = this.evaluateCounterAttackRisk(from, move);
        const tacticalGain = this.evaluateForkOpportunities(from, move);
        
        if (tacticalGain > exposureRisk * 1.5) {
            score += 30; // Good sacrifice
        }
        
        return score;
    }

    // Evaluate tempo (initiative) advantage
    evaluateTempoAdvantage(from, move) {
        let score = 0;
        
        // Moves that force opponent response
        if (move.capturedPieces && move.capturedPieces.length > 0) {
            score += 10; // Captures force response
        }
        
        // Threatening moves
        const threats = this.evaluateForkOpportunities(from, move);
        if (threats > 0) {
            score += 8; // Threats force response
        }
        
        return score;
    }

    // Endgame strategy evaluation
    evaluateEndgameStrategy(from, move) {
        const totalPieces = this.countPieces(1) + this.countPieces(2);
        
        if (totalPieces > 8) return 0; // Not endgame
        
        let score = 0;
        const piece = this.board[from.row][from.col];
        
        // King activity in endgame
        if (piece.isKing) {
            const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
            score += (7 - centerDistance) * 6;
        }
        
        // Opposition play (controlling key squares)
        if (totalPieces <= 6) {
            // Centralization is crucial in late endgame
        if (move.row >= 2 && move.row <= 5 && move.col >= 2 && move.col <= 5) {
                score += 20;
            }
        }
        
        return score;
    }

    // Minimax algorithm with alpha-beta pruning
    // Enhanced minimax with better move ordering and evaluation
    enhancedMinimax(depth, alpha, beta, maximizingPlayer, aiPlayer) {
        if (depth === 0 || this.checkGameOver()) {
            return { score: this.evaluateBoardPosition(aiPlayer), move: null };
        }

        const currentPlayer = maximizingPlayer ? aiPlayer : (aiPlayer === 1 ? 2 : 1);
        let allMoves = this.getAllValidMoves(currentPlayer);

        if (allMoves.length === 0) {
            // Game over - return large penalty/bonus
            const gameOverScore = maximizingPlayer ? -10000 : 10000;
            return { score: gameOverScore, move: null };
        }

        // Order moves for better alpha-beta pruning
        allMoves = this.orderMoves(allMoves, maximizingPlayer);

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            let bestMove = null;

            for (const pieceMove of allMoves) {
                for (const move of pieceMove.moves) {
                    // Simulate move
                    const moveResult = this.simulateMove(pieceMove.from, move, currentPlayer);
                    if (!moveResult.success) continue;

                    const evaluation = this.enhancedMinimax(depth - 1, alpha, beta, false, aiPlayer);

                    // Undo move
                    this.undoMove(moveResult.undoData);

                    if (evaluation.score > maxEval) {
                        maxEval = evaluation.score;
                        bestMove = {
                            from: pieceMove.from,
                            to: { row: move.row, col: move.col }
                        };
                    }

                    alpha = Math.max(alpha, evaluation.score);
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
                if (beta <= alpha) break;
            }

            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            let bestMove = null;

            for (const pieceMove of allMoves) {
                for (const move of pieceMove.moves) {
                    // Simulate move
                    const moveResult = this.simulateMove(pieceMove.from, move, currentPlayer);
                    if (!moveResult.success) continue;

                    const evaluation = this.enhancedMinimax(depth - 1, alpha, beta, true, aiPlayer);

                    // Undo move
                    this.undoMove(moveResult.undoData);

                    if (evaluation.score < minEval) {
                        minEval = evaluation.score;
                        bestMove = {
                            from: pieceMove.from,
                            to: { row: move.row, col: move.col }
                        };
                    }

                    beta = Math.min(beta, evaluation.score);
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
                if (beta <= alpha) break;
            }

            return { score: minEval, move: bestMove };
        }
    }

    // Enhanced minimax with timeout checking
    enhancedMinimaxWithTimeout(depth, alpha, beta, maximizingPlayer, aiPlayer, startTime, maxTimeMs) {
        // Check if time limit exceeded
        if (Date.now() - startTime > maxTimeMs) {
            return { score: this.evaluateBoardPosition(aiPlayer), move: null, timedOut: true };
        }

        if (depth === 0 || this.checkGameOver()) {
            return { score: this.evaluateBoardPosition(aiPlayer), move: null, timedOut: false };
        }

        const currentPlayer = maximizingPlayer ? aiPlayer : (aiPlayer === 1 ? 2 : 1);
        let allMoves = this.getAllValidMoves(currentPlayer);

        if (allMoves.length === 0) {
            const gameOverScore = maximizingPlayer ? -10000 : 10000;
            return { score: gameOverScore, move: null, timedOut: false };
        }

        // Order moves for better alpha-beta pruning
        allMoves = this.orderMoves(allMoves, maximizingPlayer);

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            let bestMove = null;

            for (const pieceMove of allMoves) {
                for (const move of pieceMove.moves) {
                    // Check timeout periodically
                    if (Date.now() - startTime > maxTimeMs) {
                        return { score: maxEval, move: bestMove, timedOut: true };
                    }

                    const moveResult = this.simulateMove(pieceMove.from, move, currentPlayer);
                    if (!moveResult.success) continue;

                    const evaluation = this.enhancedMinimaxWithTimeout(depth - 1, alpha, beta, false, aiPlayer, startTime, maxTimeMs);

                    this.undoMove(moveResult.undoData);

                    if (evaluation.timedOut) {
                        return { score: maxEval, move: bestMove, timedOut: true };
                    }

                    if (evaluation.score > maxEval) {
                        maxEval = evaluation.score;
                        bestMove = {
                            from: pieceMove.from,
                            to: { row: move.row, col: move.col }
                        };
                    }

                    alpha = Math.max(alpha, evaluation.score);
                    if (beta <= alpha) break;
                }
                if (beta <= alpha) break;
            }

            return { score: maxEval, move: bestMove, timedOut: false };
        } else {
            let minEval = Infinity;
            let bestMove = null;

            for (const pieceMove of allMoves) {
                for (const move of pieceMove.moves) {
                    // Check timeout periodically
                    if (Date.now() - startTime > maxTimeMs) {
                        return { score: minEval, move: bestMove, timedOut: true };
                    }

                    const moveResult = this.simulateMove(pieceMove.from, move, currentPlayer);
                    if (!moveResult.success) continue;

                    const evaluation = this.enhancedMinimaxWithTimeout(depth - 1, alpha, beta, true, aiPlayer, startTime, maxTimeMs);

                    this.undoMove(moveResult.undoData);

                    if (evaluation.timedOut) {
                        return { score: minEval, move: bestMove, timedOut: true };
                    }

                    if (evaluation.score < minEval) {
                        minEval = evaluation.score;
                        bestMove = {
                            from: pieceMove.from,
                            to: { row: move.row, col: move.col }
                        };
                    }

                    beta = Math.min(beta, evaluation.score);
                    if (beta <= alpha) break;
                }
                if (beta <= alpha) break;
            }

            return { score: minEval, move: bestMove, timedOut: false };
        }
    }

    // Order moves for better pruning (captures first, then promotions, then center moves)
    orderMoves(allMoves, forMaximizing) {
        const moveList = [];
        
        allMoves.forEach(pieceMove => {
            pieceMove.moves.forEach(move => {
                moveList.push({
                    from: pieceMove.from,
                    move: move,
                    priority: this.calculateMovePriority(pieceMove.from, move)
                });
            });
        });

        // Sort by priority (higher first)
        moveList.sort((a, b) => b.priority - a.priority);

        // Reconstruct the format expected by the rest of the code
        const orderedMoves = {};
        moveList.forEach(item => {
            const key = `${item.from.row},${item.from.col}`;
            if (!orderedMoves[key]) {
                orderedMoves[key] = {
                    from: item.from,
                    moves: []
                };
            }
            orderedMoves[key].moves.push(item.move);
        });

        return Object.values(orderedMoves);
    }

    // Calculate move priority for ordering
    calculateMovePriority(from, move) {
        let priority = 0;
        
        // Captures get highest priority
        if (move.capturedPieces && move.capturedPieces.length > 0) {
            priority += 1000;
            priority += move.capturedPieces.length * 100; // Multi-captures even higher
            
            // Capturing kings is highest priority
            move.capturedPieces.forEach(captured => {
                const piece = this.board[captured.row][captured.col];
                if (piece && piece.isKing) {
                    priority += 200;
                }
            });
        }
        
        // Promotions
        const piece = this.board[from.row][from.col];
        if (!piece.isKing && ((piece.player === 1 && move.row === 0) || (piece.player === 2 && move.row === 7))) {
            priority += 500;
        }
        
        // Central moves
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        priority += (7 - centerDistance) * 5;
        
        return priority;
    }

    // Simulate a move without UI updates and return undo data
    simulateMove(from, move, player) {
        try {
            const undoData = {
                piece: this.board[from.row][from.col],
                fromPos: { row: from.row, col: from.col },
                toPos: { row: move.row, col: move.col },
                capturedPieces: [],
                wasKing: this.board[from.row][from.col].isKing,
                originalPlayer: this.currentPlayer
            };

            // Store captured pieces
            if (move.capturedPieces) {
                move.capturedPieces.forEach(captured => {
                    undoData.capturedPieces.push({
                        pos: captured,
                        piece: this.board[captured.row][captured.col]
                    });
                });
            }

            // Make the move
            const piece = this.board[from.row][from.col];
                    this.board[move.row][move.col] = piece;
            this.board[from.row][from.col] = null;
                    
                    // Remove captured pieces
                    if (move.capturedPieces) {
                        move.capturedPieces.forEach(captured => {
                            this.board[captured.row][captured.col] = null;
                        });
                    }
                    
                    // Check for promotion
                    if (!piece.isKing) {
                        if ((piece.player === 1 && move.row === 0) || 
                            (piece.player === 2 && move.row === 7)) {
                            piece.isKing = true;
                        }
                    }
                    
            // Switch player
            this.currentPlayer = player === 1 ? 2 : 1;

            return { success: true, undoData: undoData };
        } catch (error) {
            return { success: false, error: error };
        }
    }

    // Undo a simulated move
    undoMove(undoData) {
        // Restore piece to original position
        this.board[undoData.fromPos.row][undoData.fromPos.col] = undoData.piece;
        this.board[undoData.toPos.row][undoData.toPos.col] = null;

        // Restore captured pieces
        undoData.capturedPieces.forEach(captured => {
            this.board[captured.pos.row][captured.pos.col] = captured.piece;
        });

        // Restore king status
        undoData.piece.isKing = undoData.wasKing;

        // Restore player
        this.currentPlayer = undoData.originalPlayer;
    }

    // Copy board state
    copyBoard() {
        return this.board.map(row => 
            row.map(cell => {
                if (cell && cell !== 'light') {
                    return { ...cell };
                }
                return cell;
            })
        );
    }

    // Comprehensive board position evaluation
    evaluateBoardPosition(aiPlayer) {
        let score = 0;

        // Material evaluation
        score += this.evaluateMaterial(aiPlayer);
        
        // Positional evaluation  
        score += this.evaluatePositionalStrength(aiPlayer);
        
        // King safety and activity
        score += this.evaluateKingPositions(aiPlayer);
        
        // Mobility and tempo
        score += this.evaluateMobilityAndTempo(aiPlayer);
        
        // Tactical patterns
        score += this.evaluateTacticalPatterns(aiPlayer);
        
        // Endgame factors
        score += this.evaluateEndgameFactors(aiPlayer);
        
        return score;
    }

    // Evaluate material balance with piece values
    evaluateMaterial(aiPlayer) {
        let score = 0;
        let aiPieces = 0, aiKings = 0;
        let opponentPieces = 0, opponentKings = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light') {
                    if (piece.player === aiPlayer) {
                        if (piece.isKing) {
                            aiKings++;
                            score += 150; // Kings are very valuable
                        } else {
                            aiPieces++;
                            score += 100; // Regular pieces
                        }
                    } else {
                        if (piece.isKing) {
                            opponentKings++;
                            score -= 150;
                        } else {
                            opponentPieces++;
                            score -= 100;
                        }
                    }
                }
            }
        }
        
        // Bonus for material advantage
        const totalAI = aiPieces + aiKings;
        const totalOpponent = opponentPieces + opponentKings;
        const materialAdvantage = totalAI - totalOpponent;
        score += materialAdvantage * 25;

        return score;
    }

    // Evaluate positional strength
    evaluatePositionalStrength(aiPlayer) {
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light') {
                    const pieceScore = this.evaluatePiecePosition(row, col, piece, aiPlayer);
                    if (piece.player === aiPlayer) {
                        score += pieceScore;
                    } else {
                        score -= pieceScore;
                    }
                }
            }
        }
        
        return score;
    }

    // Evaluate individual piece position
    evaluatePiecePosition(row, col, piece, aiPlayer) {
        let score = 0;
        
        // Central control bonus
                    const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
        score += (7 - centerDistance) * 3;
        
        // Advancement bonus for regular pieces
        if (!piece.isKing) {
            if (piece.player === aiPlayer) {
                // AI pieces advance towards row 7
                score += row * 8;
            } else {
                // Opponent pieces advance towards row 0
                score += (7 - row) * 8;
            }
        }
        
        // Back rank control
        if ((piece.player === aiPlayer && row === 7) || 
            (piece.player !== aiPlayer && row === 0)) {
            score += 15;
        }
        
        // Edge penalty (pieces can get trapped)
        if (col === 0 || col === 7) {
            score -= 8;
        }
        
        // Support bonus (pieces protecting each other)
        const supportCount = this.countSupportingPieces(row, col, piece.player);
        score += supportCount * 6;
        
        return score;
    }

    // Count pieces that support/protect this piece
    countSupportingPieces(row, col, player) {
        let supportCount = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dr, dc]) => {
            const supportRow = row + dr;
            const supportCol = col + dc;
            if (this.isValidPosition(supportRow, supportCol)) {
                const supportPiece = this.board[supportRow][supportCol];
                if (supportPiece && supportPiece !== 'light' && supportPiece.player === player) {
                    supportCount++;
                }
            }
        });
        
        return supportCount;
    }

    // Evaluate king positions and safety
    evaluateKingPositions(aiPlayer) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.isKing) {
                    const kingScore = this.evaluateKingStrength(row, col, piece, aiPlayer);
                    if (piece.player === aiPlayer) {
                        score += kingScore;
                    } else {
                        score -= kingScore;
                    }
                }
            }
        }
        
        return score;
    }

    // Evaluate individual king strength
    evaluateKingStrength(row, col, piece, aiPlayer) {
        let score = 0;
        
        // Kings are more valuable in center for mobility
        const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
        score += (7 - centerDistance) * 8;
        
        // King mobility bonus
        const kingMoves = this.countKingMoves(row, col, piece.player);
        score += kingMoves * 4;
        
        // Active king bonus (can threaten multiple pieces)
        const threatenedPieces = this.countThreatenedByKing(row, col, piece.player);
        score += threatenedPieces * 12;

        return score;
    }

    // Count possible moves for a king
    countKingMoves(row, col, player) {
        let moveCount = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dr, dc]) => {
            let currentRow = row + dr;
            let currentCol = col + dc;
            
            while (this.isValidPosition(currentRow, currentCol)) {
                const targetSquare = this.board[currentRow][currentCol];
                if (targetSquare === null) {
                    moveCount++;
                } else {
                    break; // Path blocked
                }
                currentRow += dr;
                currentCol += dc;
            }
        });
        
        return moveCount;
    }

    // Count pieces threatened by this king
    countThreatenedByKing(row, col, player) {
        let threatenedCount = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dr, dc]) => {
            let currentRow = row + dr;
            let currentCol = col + dc;
            
            while (this.isValidPosition(currentRow, currentCol)) {
                const targetPiece = this.board[currentRow][currentCol];
                if (targetPiece && targetPiece !== 'light') {
                    if (targetPiece.player !== player) {
                        // Found enemy piece - check if we can capture it
                        const jumpRow = currentRow + dr;
                        const jumpCol = currentCol + dc;
                        if (this.isValidPosition(jumpRow, jumpCol) && 
                            this.board[jumpRow][jumpCol] === null) {
                            threatenedCount++;
                        }
                    }
                    break; // Path blocked
                }
                currentRow += dr;
                currentCol += dc;
            }
        });
        
        return threatenedCount;
    }

    // Evaluate mobility and tempo advantage
    evaluateMobilityAndTempo(aiPlayer) {
        let score = 0;
        
        // Count all possible moves
        const aiMoves = this.getAllValidMoves(aiPlayer);
        const opponentMoves = this.getAllValidMoves(aiPlayer === 1 ? 2 : 1);
        
        const aiMoveCount = this.countTotalMoves(aiMoves);
        const opponentMoveCount = this.countTotalMoves(opponentMoves);
        
        // Mobility advantage
        score += (aiMoveCount - opponentMoveCount) * 4;
        
        // Capture moves bonus (tempo advantage)
        const aiCaptures = this.getAllCaptureMoves(aiPlayer);
        const opponentCaptures = this.getAllCaptureMoves(aiPlayer === 1 ? 2 : 1);
        
        const aiCaptureCount = this.countTotalMoves(aiCaptures);
        const opponentCaptureCount = this.countTotalMoves(opponentCaptures);
        
        score += (aiCaptureCount - opponentCaptureCount) * 8;
        
        return score;
    }

    // Count total number of moves from move list
    countTotalMoves(moveList) {
        let total = 0;
        moveList.forEach(pieceMove => {
            total += pieceMove.moves.length;
        });
        return total;
    }

    // Evaluate tactical patterns and threats
    evaluateTacticalPatterns(aiPlayer) {
        let score = 0;
        
        // Look for forks, pins, and tactical opportunities
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === aiPlayer) {
                    // Check for tactical opportunities from this piece
                    const tacticalValue = this.evaluateTacticalOpportunities(row, col, piece);
                    score += tacticalValue;
                }
                
                // Check for opponent threats we need to defend against
                if (piece && piece !== 'light' && piece.player !== aiPlayer) {
                    const threatLevel = this.evaluateThreatsFrom(row, col, piece, aiPlayer);
                    score -= threatLevel;
                }
            }
        }
        
        return score;
    }

    // Evaluate tactical opportunities from a piece
    evaluateTacticalOpportunities(row, col, piece) {
        let score = 0;
        
        // Count how many enemy pieces this piece threatens
        const threatenedPieces = piece.isKing ? 
            this.countThreatenedByKing(row, col, piece.player) :
            this.countThreatenedByRegularPiece(row, col, piece.player);
            
        score += threatenedPieces * 8;
        
        // Fork bonus (threatening multiple pieces)
        if (threatenedPieces >= 2) {
            score += 25 * threatenedPieces;
        }
        
        return score;
    }

    // Count pieces threatened by a regular piece
    countThreatenedByRegularPiece(row, col, player) {
        let threatenedCount = 0;
        const directions = player === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        
        directions.forEach(([dr, dc]) => {
            const threatRow = row + dr;
            const threatCol = col + dc;
            const jumpRow = row + (2 * dr);
            const jumpCol = col + (2 * dc);
            
            if (this.isValidPosition(threatRow, threatCol) && 
                this.isValidPosition(jumpRow, jumpCol)) {
                
                const threatPiece = this.board[threatRow][threatCol];
                const jumpSquare = this.board[jumpRow][jumpCol];
                
                if (threatPiece && threatPiece !== 'light' && 
                    threatPiece.player !== player && jumpSquare === null) {
                    threatenedCount++;
                }
            }
        });
        
        return threatenedCount;
    }

    // Evaluate threats from opponent piece
    evaluateThreatsFrom(row, col, piece, aiPlayer) {
        let threatLevel = 0;
        
        // Count AI pieces threatened by this opponent piece
        const threatenedAIPieces = piece.isKing ? 
            this.countThreatenedByKing(row, col, piece.player) :
            this.countThreatenedByRegularPiece(row, col, piece.player);
            
        threatLevel += threatenedAIPieces * 10;
        
        return threatLevel;
    }

    // Evaluate endgame specific factors
    evaluateEndgameFactors(aiPlayer) {
        const totalPieces = this.countPieces(1) + this.countPieces(2);
        
        if (totalPieces > 8) return 0; // Not endgame yet
        
        let score = 0;
        
        // In endgame, kings become more important
        const aiKings = this.countKings(aiPlayer);
        const opponentKings = this.countKings(aiPlayer === 1 ? 2 : 1);
        
        score += (aiKings - opponentKings) * 60;
        
        // Opposition and key square control
        score += this.evaluateEndgamePositions(aiPlayer);
        
        return score;
    }

    // Count kings for a player
    countKings(player) {
        let kingCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece !== 'light' && piece.player === player && piece.isKing) {
                    kingCount++;
                }
            }
        }
        return kingCount;
    }

    // Evaluate endgame positional factors
    evaluateEndgamePositions(aiPlayer) {
        let score = 0;
        
        // Control of center squares is crucial in endgame
        const centerSquares = [
            [3, 3], [3, 4], [4, 3], [4, 4]
        ];
        
        centerSquares.forEach(([row, col]) => {
            const piece = this.board[row][col];
            if (piece && piece !== 'light') {
                if (piece.player === aiPlayer) {
                    score += 20;
                } else {
                    score -= 20;
                }
            }
        });
        
        return score;
    }

    // Revert a move if it failed to send online
    revertLastMove(fromRow, fromCol, toRow, toCol, originalMove) {
        console.log('🔄 Reverting failed online move');
        
        // Restore the piece to its original position
        const piece = this.board[toRow][toCol];
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = null;
        
        // Restore captured pieces if any
        if (originalMove.capturedPieces && originalMove.capturedPieces.length > 0) {
            originalMove.capturedPieces.forEach(captured => {
                // Restore the captured piece (we need to know what was captured)
                // For now, we'll just log this - in a real implementation you'd store this info
                console.log('Need to restore captured piece at:', captured);
            });
        }
        
        // Remove the move from history
        if (this.lastMove) {
            this.lastMove = null;
            this.moveHistory.pop();
        }
        
        // Clear selection
        this.selectedPiece = null;
        this.validMoves = [];
        this.showLastMoveHighlight = false;
        
        // Re-render the board
        this.renderBoard();
        this.updateUI();
        
        // Show error to user
        alert('Failed to send move. Please try again.');
    }

    // Show temporary message to user
    showTemporaryMessage(message, duration = 2000) {
        const playerText = document.getElementById('playerText');
        if (playerText) {
            const originalText = playerText.textContent;
            const originalColor = playerText.style.color;
            
            playerText.textContent = message;
            playerText.style.color = '#FF6B6B';
            
            // Add mobile-specific styling for better visibility
            playerText.style.fontSize = window.innerWidth <= 768 ? '16px' : '14px';
            playerText.style.fontWeight = 'bold';
            playerText.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
            
            setTimeout(() => {
                playerText.textContent = originalText;
                playerText.style.color = originalColor;
                playerText.style.fontSize = '';
                playerText.style.fontWeight = '';
                playerText.style.textShadow = '';
            }, duration);
        }
    }

    // Emergency board repair function
    repairBoardState() {
        console.log('🔧 Attempting to repair board state...');
        
        // Check if board exists and has correct structure
        if (!this.board || this.board.length !== 8) {
            console.log('🔧 Board structure invalid - reinitializing...');
            this.initializeBoard();
            this.renderBoard();
            return;
        }
        
        // Check for invalid cells and repair them
        let repairedCells = 0;
        for (let row = 0; row < 8; row++) {
            if (!this.board[row] || this.board[row].length !== 8) {
                console.log(`🔧 Repairing row ${row}`);
                this.board[row] = [];
                for (let col = 0; col < 8; col++) {
                    const isDarkSquare = (row + col) % 2 === 1;
                    this.board[row][col] = isDarkSquare ? null : 'light';
                    repairedCells++;
                }
            } else {
                for (let col = 0; col < 8; col++) {
                    const cell = this.board[row][col];
                    const isDarkSquare = (row + col) % 2 === 1;
                    
                    // Repair invalid cells
                    if (isDarkSquare && cell !== null && (typeof cell !== 'object' || !cell.hasOwnProperty('player'))) {
                        if (cell !== null && cell !== 'light') {
                            console.log(`🔧 Repairing invalid dark square at (${row},${col}):`, cell);
                            this.board[row][col] = null;
                            repairedCells++;
                        }
                    } else if (!isDarkSquare && cell !== 'light') {
                        console.log(`🔧 Repairing light square at (${row},${col}):`, cell);
                        this.board[row][col] = 'light';
                        repairedCells++;
                    }
                }
            }
        }
        
        console.log(`🔧 Board repair complete. Repaired ${repairedCells} cells.`);
        
        if (repairedCells > 0) {
            this.renderBoard();
            this.showTemporaryMessage(`Fixed ${repairedCells} board issues`, 2000);
        }
    }
}

// Global navigation functions
function showWelcomeScreen() {
    if (window.game) {
        window.game.showWelcomeScreen();
    }
}

function showModeSelection() {
    if (window.game) {
        window.game.showModeSelection();
    }
}

function showAISelection() {
    if (window.game) {
        window.game.showAISelection();
    }
    }
    
    // Global startGame function for online multiplayer
function startGame(mode) {
    if (window.game) {
        window.game.startGame(mode);
    }
}

// ---------------------------------------------
// Apply theme helper (needed by dropdown & cycle)
// ---------------------------------------------

function setTheme(newTheme) {
    if (!newTheme) return;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dama-theme', newTheme);
    if (window.game) {
        window.game.updateThemeIcon(newTheme);
    }
}

// Theme toggle function
function toggleTheme() {
    const themes = ['light','dark','wood','neon'];
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const currentIndex = themes.indexOf(currentTheme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(newTheme);
    // Smooth transition feedback
    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => { document.body.style.transition = ''; }, 300);
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DamaGame();
    
    // Dropdown menu wiring
    const themeToggleEl = document.getElementById('themeToggle');
    const themeDropdownEl = document.getElementById('themeDropdown');

    if (themeToggleEl && themeDropdownEl) {
        // Show/hide dropdown when clicking toggle button
        themeToggleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdownEl.classList.toggle('open');
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', () => {
            themeDropdownEl.classList.remove('open');
        });

        // Attach click listeners to each theme option
        themeDropdownEl.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const chosen = opt.dataset.theme;
                if (chosen) setTheme(chosen);
                themeDropdownEl.classList.remove('open');
                e.stopPropagation();
            });
        });
    }

    // Make startGame globally accessible for online multiplayer
    window.startGame = function(mode) {
        if (window.game) {
            window.game.startGame(mode);
        }
    };
}); 