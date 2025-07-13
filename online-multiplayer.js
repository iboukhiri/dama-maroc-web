// SUPER SIMPLE Online Multiplayer - NO TURN BLOCKING!
class OnlineMultiplayer {
    constructor() {
        this.roomCode = null;
        this.playerNumber = null;
        this.playerName = localStorage.getItem('playerName') || 'Player';
        this.gameRef = null;
        this.gameListener = null;
        
        // Simple player ID for uniqueness
        this.playerId = this.generatePlayerId();
        
        // Load saved player number from localStorage
        this.loadPlayerNumber();
        
        // Move synchronization control
        this.isMovePending = false;
        this.pendingMoveData = null;
        this.lastConfirmedMoveCount = 0;
        this.moveTimeout = null;
        
        // Forfeit detection - DISABLED (reverting)
        // this.presenceRef = null;
        // this.heartbeatInterval = null;
        // this.opponentDisconnectTimeout = null;
        
        // Disabled presence tracking setup (revert)
        // this.setupPresenceTracking();
        
        console.log('🔧 OnlineMultiplayer instance created');
        console.log('👤 Player ID:', this.playerId);
        console.log('🔢 Loaded player number:', this.playerNumber);
        
        // Set up presence tracking
        // this.setupPresenceTracking();
    }

    init() {
        this.setupPlayerName();
        console.log('Simple online multiplayer initialized');
    }

    setupPlayerName() {
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            nameInput.value = this.playerName;
            nameInput.addEventListener('change', (e) => {
                this.playerName = e.target.value || 'Player';
                localStorage.setItem('playerName', this.playerName);
            });
        }
    }

    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    async createRoom() {
        try {
            // Clear any old player data first
            this.clearPlayerData();
            
            this.roomCode = this.generateRoomCode();
            this.gameRef = firebase.database().ref(`rooms/${this.roomCode}`);

            // Set and save player number 1
            this.savePlayerNumber(1);

            const initialState = {
                players: {
                    player1: { 
                        name: this.playerName, 
                        connected: true,
                        playerId: this.playerId,
                        lastSeen: firebase.database.ServerValue.TIMESTAMP
                    },
                    player2: null
                },
                gameState: this.getInitialGameState(),
                status: 'waiting',
                created: Date.now()
            };

            await this.gameRef.set(initialState);
            this.setupGameListener();
            
            console.log('✅ Room created:', this.roomCode);
            console.log('🎮 Player 1 (Creator):', {
                playerId: this.playerId,
                playerNumber: this.playerNumber,
                name: this.playerName
            });
            
            return this.roomCode;
        } catch (error) {
            console.error('Failed to create room:', error);
            throw error;
        }
    }

    async joinRoom(roomCode) {
        try {
            // Clear any old player data first
            this.clearPlayerData();
            
            this.roomCode = roomCode.toUpperCase();
            this.gameRef = firebase.database().ref(`rooms/${this.roomCode}`);

            const snapshot = await this.gameRef.once('value');
            if (!snapshot.exists()) {
                throw new Error('Room not found');
            }

            const roomData = snapshot.val();
            if (roomData.players.player2) {
                throw new Error('Room is full');
            }

            // Set and save player number 2
            this.savePlayerNumber(2);

            await this.gameRef.child('players/player2').set({
                name: this.playerName,
                connected: true,
                playerId: this.playerId,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });

            await this.gameRef.child('status').set('playing');

            this.setupGameListener();
            
            console.log('✅ Joined room:', this.roomCode);
            console.log('🎮 Player 2 (Joiner):', {
                playerId: this.playerId,
                playerNumber: this.playerNumber,
                name: this.playerName
            });
            
            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    }

    getInitialGameState() {
        const board = [];
        for (let row = 0; row < 8; row++) {
            board[row] = [];
            for (let col = 0; col < 8; col++) {
                // Use the same pattern as local game: dark squares are playable
                const isDarkSquare = (row + col) % 2 === 1;
                
                if (isDarkSquare) {
                    if (row < 3) {
                        board[row][col] = { player: 2, isKing: false }; // Player 2 pieces (top)
                    } else if (row > 4) {
                        board[row][col] = { player: 1, isKing: false }; // Player 1 pieces (bottom)
                    } else {
                        board[row][col] = null; // Empty dark square
                    }
                } else {
                    board[row][col] = 'light'; // Light square (not playable)
                }
            }
        }

        return {
            board: board,
            currentPlayer: 1,
            moveCount: 0,
            lastMove: null,
            gameOver: false
        };
    }

    setupGameListener() {
        if (!this.gameRef) return;

        console.log('🎧 Setting up Firebase listener for room:', this.roomCode);

        this.gameListener = this.gameRef.on('value', (snapshot) => {
            const data = snapshot.val();
            console.log('🔥 Firebase data received:', data);
            
            if (!data) {
                console.log('❌ No data received from Firebase');
                return;
            }

            // Handle player updates
            if (data.players) {
                this.handlePlayerUpdates(data.players);
            }

            // Handle game state updates
            if (data.gameState && window.game) {
                console.log('🎮 Processing game state update...');
                this.handleGameStateUpdate(data.gameState);
            } else if (!window.game) {
                console.log('⚠️ Window.game not available yet');
            } else if (!data.gameState) {
                console.log('⚠️ No gameState in Firebase data');
            }

            // Handle status changes
            if (data.status === 'playing' && window.game) {
                console.log('🚀 Game status is playing, starting game...');
                this.startGame();
            }
        }, (error) => {
            console.error('❌ Firebase listener error:', error);
        });

        console.log('✅ Firebase listener set up successfully');
    }

    handlePlayerUpdates(players) {
        if (!players) return;

        const player1Name = players.player1?.name || 'Player 1';
        const player2Name = players.player2?.name || 'Waiting...';

        // Update waiting room
        const player1Element = document.getElementById('player1Name');
        const player2Slot = document.getElementById('player2Slot');

        if (player1Element) {
            player1Element.textContent = player1Name;
        }

        if (player2Slot) {
            if (players.player2) {
                player2Slot.innerHTML = `<i class="fas fa-user"></i><span>${player2Name}</span>`;
                player2Slot.className = 'player-slot filled';
            } else {
                player2Slot.innerHTML = `<i class="fas fa-user-plus"></i><span>Waiting...</span>`;
                player2Slot.className = 'player-slot empty';
            }
        }

        // Update game screen
        const onlinePlayer1 = document.getElementById('onlinePlayer1Name');
        const onlinePlayer2 = document.getElementById('onlinePlayer2Name');
        if (onlinePlayer1) onlinePlayer1.textContent = player1Name;
        if (onlinePlayer2) onlinePlayer2.textContent = player2Name;

        // Check for forfeit - DISABLED (revert)
        // if (window.currentGameMode === 'online' && window.game && !window.game.gameOver) {
        //     this.checkForForfeit(players);
        // }

        console.log('👥 Players updated:', {
            player1: player1Name,
            player2: player2Name,
            player1Connected: players.player1?.connected,
            player2Connected: players.player2?.connected
        });
    }

    // Check if opponent has forfeited
    checkForForfeit(players) {
        const opponent = this.playerNumber === 1 ? players.player2 : players.player1;
        const opponentNumber = this.playerNumber === 1 ? 2 : 1;
        
        if (!opponent) return;

        // Check if opponent is disconnected
        if (opponent.connected === false) {
            console.log('🚪 Opponent disconnected, starting forfeit timer');
            
            // Clear any existing timeout
            if (this.opponentDisconnectTimeout) {
                clearTimeout(this.opponentDisconnectTimeout);
            }
            
            // Start forfeit countdown (30 seconds)
            this.opponentDisconnectTimeout = setTimeout(() => {
                console.log('⏰ Opponent forfeit timeout reached');
                this.handleOpponentForfeit(opponent.name);
            }, 30000); // 30 seconds to reconnect
            
            // Show reconnection message
            if (window.game) {
                window.game.showTemporaryMessage(`${opponent.name} disconnected. Waiting 30 seconds...`, 5000);
            }
        } else {
            // Opponent reconnected, cancel forfeit
            if (this.opponentDisconnectTimeout) {
                console.log('✅ Opponent reconnected, canceling forfeit');
                clearTimeout(this.opponentDisconnectTimeout);
                this.opponentDisconnectTimeout = null;
                
                if (window.game) {
                    window.game.showTemporaryMessage(`${opponent.name} reconnected!`, 2000);
                }
            }
        }
    }

    // Handle opponent forfeit
    handleOpponentForfeit(opponentName) {
        console.log('🏆 Opponent forfeited, declaring victory');
        
        if (window.game) {
            // End the game with forfeit victory
            window.game.gameOver = true;
            window.game.winner = this.playerNumber;
            
            // Show forfeit victory modal
            this.showForfeitVictoryModal(opponentName);
            
            // Update game state in Firebase
            if (this.gameRef) {
                this.gameRef.child('gameState').update({
                    gameOver: true,
                    winner: this.playerNumber,
                    forfeit: true,
                    forfeitPlayer: this.playerNumber === 1 ? 2 : 1
                });
            }
        }
    }

    // Show forfeit victory modal
    showForfeitVictoryModal(opponentName) {
        // Create forfeit modal if it doesn't exist
        let forfeitModal = document.getElementById('forfeitModal');
        if (!forfeitModal) {
            forfeitModal = document.createElement('div');
            forfeitModal.id = 'forfeitModal';
            forfeitModal.className = 'modal-overlay';
            forfeitModal.innerHTML = `
                <div class="glass-card modal-card">
                    <h2>🏆 Victory by Forfeit!</h2>
                    <p id="forfeitMessage">Your opponent has left the game.</p>
                    <div class="modal-buttons">
                        <button id="forfeitPlayAgain" class="btn-primary">Play Again</button>
                        <button id="forfeitBackToMenu" class="btn-secondary">Back to Menu</button>
                    </div>
                </div>
            `;
            document.body.appendChild(forfeitModal);
            
            // Add event listeners
            document.getElementById('forfeitPlayAgain').addEventListener('click', () => {
                this.hideForfeitModal();
                window.game.resetGame();
            });
            
            document.getElementById('forfeitBackToMenu').addEventListener('click', () => {
                this.hideForfeitModal();
                window.game.showWelcomeScreen();
            });
        }
        
        // Update message and show modal
        document.getElementById('forfeitMessage').textContent = `${opponentName} has left the game. You win by forfeit!`;
        forfeitModal.classList.add('active');
    }

    // Hide forfeit modal
    hideForfeitModal() {
        const forfeitModal = document.getElementById('forfeitModal');
        if (forfeitModal) {
            forfeitModal.classList.remove('active');
        }
    }

    handleGameStateUpdate(gameState) {
        // Ensure board has correct light/dark sentinels before any logic
        gameState.board = sanitizeBoard(gameState.board);

        if (!window.game) {
            console.log('❌ handleGameStateUpdate: window.game not available');
            return;
        }
        
        console.log('🎮 [SYNC] Firebase state update received');
        console.log('🔍 [SYNC] Received game state:', {
            currentPlayer: gameState.currentPlayer,
            moveCount: gameState.moveCount,
            lastMove: gameState.lastMove,
            lastMovePlayerId: gameState.lastMove?.playerId
        });
        console.log('🔍 [SYNC] Current local state:', {
            currentPlayer: window.game.currentPlayer,
            moveCount: window.game.moveCount,
            isMovePending: this.isMovePending,
            lastConfirmedMoveCount: this.lastConfirmedMoveCount,
            myPlayerId: this.playerId
        });

        // Handle Hezzek o Nfokh penalty first
        if (gameState.lastMove && gameState.lastMove.hezzekPenalty) {
            console.log('🚨 [SYNC] Penalty detected in game state');
            handleHezzekPenalty(gameState.lastMove);
        }
        
        // Check if this move was made by me or the other player
        const moveWasMadeByMe = gameState.lastMove?.playerId === this.playerId;
        const moveOccurred = gameState.moveCount > (this.lastConfirmedMoveCount || 0);
        
        console.log('🔍 [SYNC] Move analysis:', {
            moveWasMadeByMe,
            moveOccurred,
            isMovePending: this.isMovePending
        });
        
        // Check if this is confirming our pending move
        if (this.isMovePending && moveWasMadeByMe && moveOccurred) {
            console.log('✅ [SYNC] Our move confirmed by Firebase - unlocking');
            this.unlockMoves();
            
            // Check if our local state matches Firebase state
            const localMatchesFirebase = (
                window.game.currentPlayer === gameState.currentPlayer &&
                window.game.moveCount === gameState.moveCount &&
                JSON.stringify(window.game.board) === JSON.stringify(gameState.board)
            );
            
            if (localMatchesFirebase) {
                console.log('✅ [SYNC] My move confirmed - local state matches Firebase');
                this.lastConfirmedMoveCount = gameState.moveCount || 0;
                return; // No need to update, we're already in sync
            } else {
                console.log('⚠️ [SYNC] My move confirmed but local state differs - syncing...');
            }
        }
        
        // CRITICAL FIX: If this is the other player's move, FORCE the update
        if (!moveWasMadeByMe && moveOccurred) {
            console.log('🔄 [SYNC] Other player made a move - FORCING update...');
            this.showDebugMessage('🔄 Other player moved');
            
            // FORCE apply the state immediately - skip all comparisons
            console.log('🔄 [SYNC] Applying other player\'s move state...');
            
            // Set game mode first to ensure it's recognized as online
            window.currentGameMode = 'online';
            window.game.gameMode = 'online';
            
            // Apply state changes
            window.game.board = JSON.parse(JSON.stringify(gameState.board));
            window.game.currentPlayer = gameState.currentPlayer;
            window.game.moveCount = gameState.moveCount;
            window.game.lastMove = gameState.lastMove;
            window.game.gameOver = gameState.gameOver;

            // Clear any selections
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            
            // FORCE visual update
            this.forceVisualRefresh();
            
            // Update our tracking
            this.lastConfirmedMoveCount = gameState.moveCount || 0;
            
            console.log('✅ [SYNC] Other player\'s move applied and display updated');
            this.showDebugMessage('✅ Move synchronized');
            return; // Early return after successful update
        }
        
        // Update our last confirmed move count
        this.lastConfirmedMoveCount = gameState.moveCount || 0;
        
        // Validate board structure before applying
        if (!this.validateBoardStructure(gameState.board)) {
            console.error('❌ [SYNC] Invalid board structure received, regenerating...');
            gameState.board = this.getInitialGameState().board;
        }
        
        // Set game mode first to ensure it's recognized as online
        window.currentGameMode = 'online';
        window.game.gameMode = 'online';
        
        // Store previous state for comparison
        const previousCurrentPlayer = window.game.currentPlayer;
        const previousMoveCount = window.game.moveCount || 0;
        
        console.log('🔍 [SYNC] Previous state:', {
            previousCurrentPlayer,
            previousMoveCount
        });
        
        // Check if state actually changed
        const stateChanged = (
            gameState.currentPlayer !== previousCurrentPlayer ||
            gameState.moveCount !== previousMoveCount ||
            JSON.stringify(gameState.board) !== JSON.stringify(window.game.board)
        );
        
        if (!stateChanged) {
            console.log('📋 [SYNC] No state changes detected, skipping update');
            return;
        }
        
        console.log('🔄 [SYNC] Applying Firebase game state...');
        this.showDebugMessage('🔄 Syncing from Firebase');
        
        // Apply state changes
        window.game.board = JSON.parse(JSON.stringify(gameState.board));
        window.game.currentPlayer = gameState.currentPlayer;
        window.game.moveCount = gameState.moveCount;
        window.game.lastMove = gameState.lastMove;
        window.game.gameOver = gameState.gameOver;

        // Handle selection and turn changes
        const turnChanged = previousCurrentPlayer !== gameState.currentPlayer;
        const gameStateMoveOccurred = gameState.moveCount > previousMoveCount;
        const isMyTurnNow = this.playerNumber === gameState.currentPlayer;
        
        console.log('🔍 [SYNC] Turn analysis:', {
            turnChanged,
            gameStateMoveOccurred,
            isMyTurnNow,
            isMovePending: this.isMovePending
        });
        
        // Clear selection when appropriate
        if (turnChanged && gameStateMoveOccurred) {
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            console.log('🧹 [SYNC] Cleared selection after move');
        } else if (!isMyTurnNow && window.game.selectedPiece) {
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            console.log('🧹 [SYNC] Cleared selection - not my turn');
        }

        // Update display immediately
        window.game.renderBoard();
        window.game.updateUI();
        this.updateOnlineUI();
        
        console.log('✅ [SYNC] Firebase state applied and display updated');
        this.showDebugMessage('✅ Firebase sync complete');
    }

    // Apply game state with smooth animations
    applyStateWithAnimation(gameState, previousCurrentPlayer, previousMoveCount) {
        // Store the move that happened
        const moveOccurred = gameState.moveCount > previousMoveCount;
        
        // Update game state
        window.game.board = JSON.parse(JSON.stringify(gameState.board));
        window.game.currentPlayer = gameState.currentPlayer;
        window.game.moveCount = gameState.moveCount;
        window.game.lastMove = gameState.lastMove;
        window.game.gameOver = gameState.gameOver;

        console.log('✅ [SYNC] Game state applied:', {
            newCurrentPlayer: window.game.currentPlayer,
            newMoveCount: window.game.moveCount,
            moveOccurred: moveOccurred
        });

        // Handle selection and turn changes
        const turnChanged = previousCurrentPlayer !== gameState.currentPlayer;
        const isMyTurnNow = this.playerNumber === gameState.currentPlayer;
        
        console.log('🔍 [SYNC] Turn analysis:', {
            turnChanged,
            moveOccurred,
            isMyTurnNow,
            isMovePending: this.isMovePending
        });
        
        // Clear selection when needed
        if (turnChanged && moveOccurred) {
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            console.log('🧹 [SYNC] Cleared selection after confirmed move');
        } else if (!isMyTurnNow && window.game.selectedPiece) {
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            console.log('🧹 [SYNC] Cleared selection - not my turn');
        }

        // Update display with smooth animation
        this.animateStateUpdate(moveOccurred);
        
        console.log('✅ [SYNC] Animation and UI update completed');
    }

    // Animate the state update for smoother visuals
    animateStateUpdate(moveOccurred) {
        // Add animation class to board for smooth transitions
        const boardElement = document.getElementById('gameBoard');
        if (boardElement) {
            boardElement.classList.add('state-updating');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                boardElement.classList.remove('state-updating');
            }, 300);
        }
        
        // Update display
        window.game.renderBoard();
        window.game.updateUI();
        
        // Update online-specific UI elements
        this.updateOnlineUI();
        
        if (moveOccurred) {
            console.log('🎨 [SYNC] Animated move confirmation');
        }
    }

    // Helper method for updating game display
    updateGameDisplay() {
        try {
            window.game.renderBoard();
            window.game.updateUI();
            
            // Update online-specific UI elements
            this.updateOnlineUI();
        } catch (error) {
            console.error('Error updating game display:', error);
        }
    }

    // Update online-specific UI elements
    updateOnlineUI() {
        try {
            const playerText = document.getElementById('playerText');
            const playerIndicator = document.getElementById('currentPlayer');
            
            if (playerText && playerIndicator) {
                const isMyTurn = this.isMyTurn();
                
                if (isMyTurn) {
                    playerText.textContent = 'Your Turn';
                    playerText.style.color = '#4CAF50';
                } else {
                    const opponentNumber = this.playerNumber === 1 ? 2 : 1;
                    playerText.textContent = `Player ${opponentNumber}'s Turn`;
                    playerText.style.color = '#FF9800';
                }
                
                // Update the player color indicator
                if (playerIndicator.querySelector('.player-color')) {
                    playerIndicator.querySelector('.player-color').className = `player-color player${window.game.currentPlayer}`;
                }
            }
            
            // Update room code display
            const roomCodeElement = document.getElementById('currentRoomCode');
            if (roomCodeElement && this.roomCode) {
                roomCodeElement.textContent = this.roomCode;
            }
        } catch (error) {
            console.error('Error updating online UI:', error);
        }
    }

    validateBoardStructure(board) {
        if (!board || !Array.isArray(board)) {
            console.error('Board is not an array');
            return false;
        }
        
        if (board.length !== 8) {
            console.error('Board has wrong number of rows:', board.length);
            return false;
        }
        
        for (let row = 0; row < 8; row++) {
            if (!Array.isArray(board[row])) {
                console.error(`Board row ${row} is not an array`);
                return false;
            }
            if (board[row].length !== 8) {
                console.error(`Board row ${row} has wrong length: ${board[row].length}`);
                return false;
            }
        }
        
        return true;
    }

    startGame() {
        // Ensure player number is loaded before starting
        if (!this.playerNumber) {
            this.loadPlayerNumber();
        }
        
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');

        const onlineInfoCard = document.getElementById('onlineInfoCard');
        if (onlineInfoCard) {
            onlineInfoCard.style.display = 'block';
        }

        const gameModeElement = document.getElementById('gameMode');
        if (gameModeElement) {
            gameModeElement.textContent = 'Online Multiplayer';
        }

        // Set game mode BEFORE starting the game
        window.currentGameMode = 'online';
        
        // Start the game
        window.startGame('online');
        
        // Ensure game mode is set after game initialization
        if (window.game) {
            window.game.gameMode = 'online';
            window.currentGameMode = 'online';
        }
        
        // Double-check player number after game start
        if (!this.playerNumber) {
            console.error('❌ Player number lost during game start!');
            this.loadPlayerNumber();
        }
        
        // Flip board if I'm player 2
        this.applyBoardOrientation();
        
        // CRITICAL: Force initial board sync from Firebase
        this.forceBoardSync();
        
        // Start presence tracking - DISABLED (revert)
        // this.startHeartbeat();
        // this.updatePresence(true);
        
        console.log('🎮 Online game started - Player number:', this.playerNumber, 'Game mode:', window.currentGameMode);
    }

    // Force board synchronization from Firebase
    async forceBoardSync() {
        if (!this.gameRef) return;
        
        try {
            console.log('🔄 Forcing initial board sync from Firebase...');
            const snapshot = await this.gameRef.child('gameState').once('value');
            const gameState = snapshot.val();
            
            if (gameState && window.game) {
                console.log('✅ Initial board sync received:', gameState);
                
                // Force apply the Firebase state regardless of local state
                window.game.board = JSON.parse(JSON.stringify(gameState.board));
                window.game.currentPlayer = gameState.currentPlayer;
                window.game.moveCount = gameState.moveCount || 0;
                window.game.lastMove = gameState.lastMove;
                window.game.gameOver = gameState.gameOver || false;
                
                // Update our tracking
                this.lastConfirmedMoveCount = gameState.moveCount || 0;
                
                // Flip board if needed (may fire before startGame in reconnections)
                this.applyBoardOrientation();
                
                // Force visual update
                this.forceVisualRefresh();
                
                console.log('✅ Initial board sync complete');
                this.showDebugMessage('✅ Board synced');
            }
        } catch (error) {
            console.error('❌ Failed to sync initial board:', error);
            this.showDebugMessage('❌ Sync failed');
        }
    }

    // Handle connection restoration
    handleConnectionRestore() {
        if (!this.gameRef || !this.roomCode) return;
        
        console.log('🔄 Handling connection restore for room:', this.roomCode);
        
        // Re-establish game listener
        this.setupGameListener();
        
        // Refresh current game state
        this.gameRef.once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data && data.gameState) {
                    console.log('🔄 Refreshing game state after reconnection');
                    this.handleGameStateUpdate(data.gameState);
                }
            })
            .catch(error => {
                console.error('❌ Failed to refresh game state after reconnection:', error);
            });
    }

    // Enhanced isMyTurn with move locking
    isMyTurn() {
        // Check Firebase connection first
        if (!window.isFirebaseReady()) {
            console.log('❌ Firebase not ready - connection issue');
            return false;
        }

        // Block if we have a pending move
        if (this.isMovePending) {
            console.log('❌ Move is pending - blocking new moves');
            return false;
        }

        // First, make sure we have our player number
        if (!this.playerNumber) {
            this.loadPlayerNumber(); // Try to reload from localStorage
            
            // If still no player number after loading, this might be a reconnection issue
            if (!this.playerNumber) {
                console.warn('⚠️ No player number found - might need to rejoin game');
                return false;
            }
        }

        console.log('🔍 Enhanced turn check:', {
            myPlayerNumber: this.playerNumber,
            currentGamePlayer: window.game?.currentPlayer,
            gameMode: window.currentGameMode,
            hasGameRef: !!this.gameRef,
            roomCode: this.roomCode,
            firebaseReady: window.isFirebaseReady(),
            isMovePending: this.isMovePending
        });

        // Basic checks with better error reporting
        if (!this.gameRef) {
            console.log('❌ No game reference - not connected to room');
            return false;
        }
        
        if (!window.game) {
            console.log('❌ No game instance');
            return false;
        }
        
        if (!this.playerNumber) {
            console.log('❌ No player number assigned');
            return false;
        }

        // Make sure we're in online mode
        if (window.currentGameMode !== 'online' && window.game?.gameMode !== 'online') {
            console.log('❌ Not in online mode');
            return false;
        }

        // Simple turn check
        const currentTurn = window.game.currentPlayer;
        const isMyTurn = this.playerNumber === currentTurn;

        console.log('🎯 TURN RESULT:', {
            myPlayerNumber: this.playerNumber,
            currentTurn: currentTurn,
            isMyTurn: isMyTurn,
            movePending: this.isMovePending
        });

        return isMyTurn;
    }

    async sendMove(fromRow, fromCol, toRow, toCol, capturedPieces = [], promoted = false) {
        if (!this.gameRef) {
            console.log('❌ No game reference');
            return false;
        }

        // Check if we can make a move
        if (!this.isMyTurn()) {
            console.log('❌ Not your turn or move pending!', {
                myPlayerNumber: this.playerNumber,
                currentGamePlayer: window.game?.currentPlayer,
                isMovePending: this.isMovePending
            });
            this.showDebugMessage('❌ Not your turn!');
            return false;
        }

        // IMMEDIATE MOVE LOCKING - prevent rapid moves
        this.isMovePending = true;
        this.pendingMoveData = {
            fromRow, fromCol, toRow, toCol, 
            capturedPieces, promoted,
            timestamp: Date.now()
        };

        console.log('🔒 MOVE LOCKED - sending move:', this.pendingMoveData);
        this.showDebugMessage('📤 Sending move...');

        // Set a timeout to unlock moves if Firebase doesn't respond
        this.moveTimeout = setTimeout(() => {
            console.warn('⏰ Move timeout - unlocking moves');
            this.unlockMoves();
            this.showDebugMessage('⏰ Move timeout');
        }, 10000); // 10 second timeout

        try {
            console.log('📤 Sending move via transaction...');
            
            // Store original state for potential rollback
            const originalBoard = JSON.parse(JSON.stringify(window.game.board));
            const originalCurrentPlayer = window.game.currentPlayer;
            const originalMoveCount = window.game.moveCount;
            
            // Apply move locally IMMEDIATELY for responsive feedback
            const piece = window.game.board[fromRow][fromCol];
            
            // Move the piece
            window.game.board[toRow][toCol] = piece;
            window.game.board[fromRow][fromCol] = null;
            
            // Handle captures
            if (capturedPieces && capturedPieces.length > 0) {
                capturedPieces.forEach(cap => {
                    window.game.board[cap.row][cap.col] = null;
                });
            }
            
            // Handle promotion
            if (promoted && piece) {
                piece.isKing = true;
            }
            
            // Ensure board markers are consistent before rendering/UI
            sanitizeBoard(window.game.board);
            
            // Update turn and move count
            window.game.currentPlayer = window.game.currentPlayer === 1 ? 2 : 1;
            window.game.moveCount = (window.game.moveCount || 0) + 1;
            
            // Update last move
            window.game.lastMove = {
                from: { row: fromRow, col: fromCol },
                to: { row: toRow, col: toCol },
                captured: capturedPieces || [],
                promoted: promoted
            };
            
            // Clear selection
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            
            // Update UI immediately for responsive feedback
            window.game.renderBoard();
            window.game.updateUI();
            
            console.log('✅ Move applied locally for immediate feedback');
            this.showDebugMessage('✅ Move applied locally');
            
            // Use Firebase transaction for atomic updates
            const result = await this.gameRef.child('gameState').transaction((currentState) => {
                console.log('🔄 Transaction function called with state:', currentState);
                
                if (!currentState) {
                    console.error('❌ No game state in transaction');
                    return; // Abort transaction
                }

                // Double-check turn hasn't changed during the delay
                if (currentState.currentPlayer !== this.playerNumber) {
                    console.log('❌ Turn changed during transaction, aborting');
                    return; // Abort transaction
                }

                // Validate piece still exists and belongs to us (use original state)
                const originalPiece = currentState.board[fromRow][fromCol];
                if (!originalPiece || originalPiece.player !== this.playerNumber) {
                    console.error('❌ Invalid piece state in transaction');
                    return; // Abort transaction
                }

                // Create new state atomically
                const newState = {
                    ...currentState,
                    currentPlayer: currentState.currentPlayer === 1 ? 2 : 1,
                    moveCount: (currentState.moveCount || 0) + 1,
                    lastMove: {
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol },
                        captured: capturedPieces,
                        promoted: promoted,
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        playerId: this.playerId
                    }
                };

                // Deep clone board to avoid reference issues
                newState.board = JSON.parse(JSON.stringify(currentState.board));
                
                // Apply the move
                newState.board[toRow][toCol] = newState.board[fromRow][fromCol];
                newState.board[fromRow][fromCol] = null;

                // Handle captures
                if (capturedPieces && capturedPieces.length > 0) {
                    capturedPieces.forEach(cap => {
                        if (newState.board[cap.row] && newState.board[cap.row][cap.col]) {
                            newState.board[cap.row][cap.col] = null;
                        }
                    });
                }

                // Handle promotion
                if (promoted && newState.board[toRow][toCol]) {
                    newState.board[toRow][toCol].isKing = true;
                }

                // Ensure board markers are consistent
                sanitizeBoard(newState.board);

                console.log('✅ Transaction prepared:', {
                    fromPlayer: currentState.currentPlayer,
                    toPlayer: newState.currentPlayer,
                    moveCount: newState.moveCount
                });

                return newState;
            });

            console.log('🔄 Transaction result:', result);

            if (result.committed) {
                console.log('✅ Move transaction committed successfully');
                this.showDebugMessage('✅ Move sent to Firebase');
                // Local state is already updated, Firebase will confirm via listener
                return true;
            } else {
                console.log('❌ Transaction was aborted - reverting local state');
                this.showDebugMessage('❌ Move failed - reverting');
                
                // Revert local state
                window.game.board = originalBoard;
                window.game.currentPlayer = originalCurrentPlayer;
                window.game.moveCount = originalMoveCount;
                window.game.lastMove = null;
                
                // Update UI to show reverted state
                window.game.renderBoard();
                window.game.updateUI();
                
                this.unlockMoves();
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to send move:', error);
            this.showDebugMessage('❌ Connection error');
            
            // Revert local state on error
            console.log('🔄 Reverting local state due to error...');
            
            // Restore original state
            window.game.board = originalBoard;
            window.game.currentPlayer = originalCurrentPlayer;
            window.game.moveCount = originalMoveCount;
            window.game.lastMove = null;
            
            // Clear selection
            window.game.selectedPiece = null;
            window.game.validMoves = [];
            
            // Update UI to show reverted state
            window.game.renderBoard();
            window.game.updateUI();
            
            console.log('✅ Local state reverted');
            
            this.unlockMoves();
            return false;
        }
    }

    // Unlock moves and clear pending state
    unlockMoves() {
        console.log('🔓 UNLOCKING MOVES');
        this.isMovePending = false;
        this.pendingMoveData = null;
        
        if (this.moveTimeout) {
            clearTimeout(this.moveTimeout);
            this.moveTimeout = null;
        }
    }

    async leaveRoom() {
        try {
            if (this.gameRef && this.playerId) {
                // Try to update connection status
                const playerKey = this.playerNumber === 1 ? 'player1' : 'player2';
                await this.gameRef.child(`players/${playerKey}/connected`).set(false);
            }
            this.cleanup();
        } catch (error) {
            console.error('Error leaving room:', error);
            this.cleanup();
        }
    }

    cleanup(clearPlayerData = true) {
        console.log('🧹 Cleaning up online multiplayer session, clearPlayerData:', clearPlayerData);
        
        if (this.gameListener && this.gameRef) {
            this.gameRef.off('value', this.gameListener);
            this.gameListener = null;
        }
        
        // Stop presence tracking
        // this.stopHeartbeat();
        
        // Clear forfeit timeout
        // if (this.opponentDisconnectTimeout) {
        //     clearTimeout(this.opponentDisconnectTimeout);
        //     this.opponentDisconnectTimeout = null;
        // }
        
        this.roomCode = null;
        this.gameRef = null;
        
        // Only clear player data if specifically requested (e.g., when truly leaving)
        if (clearPlayerData) {
            this.clearPlayerData();
        }
        
        console.log('🧹 Cleanup completed');
    }

    // Generate unique player ID
    generatePlayerId() {
        const existingId = localStorage.getItem('dama_player_id');
        if (existingId) {
            return existingId;
        }
        
        const newId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('dama_player_id', newId);
        return newId;
    }

    // Set up presence tracking for forfeit detection
    setupPresenceTracking() {
        // Set up page visibility change detection
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 Page hidden - player may be leaving');
                this.updatePresence(false);
            } else {
                console.log('📱 Page visible - player returned');
                this.updatePresence(true);
            }
        });

        // Set up beforeunload detection (when user closes tab/browser)
        window.addEventListener('beforeunload', () => {
            console.log('🚪 Player leaving page - updating presence');
            this.updatePresence(false);
            if (this.gameRef && this.playerNumber) {
                // Try to mark player as disconnected
                const playerKey = this.playerNumber === 1 ? 'player1' : 'player2';
                this.gameRef.child(`players/${playerKey}/connected`).set(false);
                this.gameRef.child(`players/${playerKey}/lastSeen`).set(firebase.database.ServerValue.TIMESTAMP);
            }
        });

        // Set up mobile-specific events
        window.addEventListener('pagehide', () => {
            console.log('📱 Mobile page hide - player leaving');
            this.updatePresence(false);
        });

        window.addEventListener('pageshow', () => {
            console.log('📱 Mobile page show - player returned');
            this.updatePresence(true);
        });
    }

    // Update player presence in Firebase
    updatePresence(isPresent) {
        if (!this.gameRef || !this.playerNumber) return;

        const playerKey = this.playerNumber === 1 ? 'player1' : 'player2';
        const updates = {
            [`players/${playerKey}/connected`]: isPresent,
            [`players/${playerKey}/lastSeen`]: firebase.database.ServerValue.TIMESTAMP
        };

        this.gameRef.update(updates).catch(error => {
            console.error('Failed to update presence:', error);
        });
    }

    // Start heartbeat to maintain presence
    startHeartbeat() {
        // if (this.heartbeatInterval) {
        //     clearInterval(this.heartbeatInterval);
        // }

        // this.heartbeatInterval = setInterval(() => {
        //     if (this.gameRef && this.playerNumber && !document.hidden) {
        //         this.updatePresence(true);
        //     }
        // }, 10000); // Update every 10 seconds
    }

    // Stop heartbeat
    stopHeartbeat() {
        // if (this.heartbeatInterval) {
        //     clearInterval(this.heartbeatInterval);
        //     this.heartbeatInterval = null;
        // }
    }

    // Save player number to localStorage
    savePlayerNumber(playerNumber) {
        this.playerNumber = playerNumber;
        localStorage.setItem('dama_player_number', playerNumber.toString());
        console.log('💾 Player number saved:', playerNumber);
    }

    // Load player number from localStorage
    loadPlayerNumber() {
        const saved = localStorage.getItem('dama_player_number');
        if (saved) {
            this.playerNumber = parseInt(saved);
            console.log('🔄 Player number loaded from storage:', this.playerNumber);
        }
    }

    // Clear player data
    clearPlayerData() {
        this.playerNumber = null;
        localStorage.removeItem('dama_player_number');
        console.log('🗑️ Player data cleared');
    }

    // Show temporary message for debugging
    showDebugMessage(message, duration = 3000) {
        // Remove existing message
        const existingMessage = document.getElementById('debug-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message element
        const messageElement = document.createElement('div');
        messageElement.id = 'debug-message';
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            border: 1px solid #444;
        `;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, duration);
    }

    // Force a complete visual refresh - use when synchronization issues occur
    forceVisualRefresh() {
        console.log('🔄 FORCING complete visual refresh...');
        
        if (!window.game) {
            console.log('❌ No game instance for visual refresh');
            return;
        }
        
        try {
            // Clear any cached rendering state
            const boardElement = document.getElementById('gameBoard');
            if (boardElement) {
                boardElement.innerHTML = '';
                
                // Add mobile-specific improvements to board
                boardElement.style.touchAction = 'manipulation';
                boardElement.style.userSelect = 'none';
                boardElement.style.webkitUserSelect = 'none';
                boardElement.style.webkitTouchCallout = 'none';
            }
            
            // Force complete re-render
            window.game.renderBoard();
            window.game.updateUI();
            this.updateOnlineUI();
            
            // Add visual feedback
            this.showDebugMessage('🔄 Visual refresh');
            
            console.log('✅ Visual refresh complete');
        } catch (error) {
            console.error('❌ Error during visual refresh:', error);
        }
    }

    // Flip board visually for Player 2 so their pieces appear at the bottom
    applyBoardOrientation() {
        const boardElement = document.getElementById('gameBoard');
        if (!boardElement) return;
        if (this.playerNumber === 2) {
            boardElement.classList.add('flipped');
        } else {
            boardElement.classList.remove('flipped');
        }
    }
}

const onlineMultiplayer = new OnlineMultiplayer();

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Initializing onlineMultiplayer on DOMContentLoaded');
    onlineMultiplayer.init();
    
    // Ensure the global reference is set
    window.onlineMultiplayer = onlineMultiplayer;
    
    // Verify the setup
    console.log('✅ OnlineMultiplayer setup complete:', {
        localInstance: !!onlineMultiplayer,
        windowInstance: !!window.onlineMultiplayer,
        sameInstance: onlineMultiplayer === window.onlineMultiplayer,
        instanceId: onlineMultiplayer.constructor.name
    });
});

// Set the global reference immediately as well
window.onlineMultiplayer = onlineMultiplayer;

console.log('🔧 OnlineMultiplayer module loaded:', {
    localInstance: !!onlineMultiplayer,
    windowInstance: !!window.onlineMultiplayer,
    sameInstance: onlineMultiplayer === window.onlineMultiplayer
});

// UI Functions
function hideAllScreens() {
    const screens = ['welcomeScreen', 'modeSelector', 'multiplayerSelector', 'onlineSelector', 'aiSelector', 'waitingRoom', 'gameScreen'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove('active');
    });
}

function showMultiplayerOptions() {
    hideAllScreens();
    document.getElementById('multiplayerSelector').classList.add('active');
}

function showOnlineOptions() {
    hideAllScreens();
    document.getElementById('onlineSelector').classList.add('active');
}

async function createOnlineRoom() {
    try {
        showLoadingState('Creating room...');
        console.log('🔧 Creating room with instance:', window.onlineMultiplayer);
        const roomCode = await window.onlineMultiplayer.createRoom();
        console.log('✅ Room created, player number set to:', window.onlineMultiplayer.playerNumber);
        showWaitingRoom(roomCode);
    } catch (error) {
        hideLoadingState();
        alert('Failed to create room: ' + error.message);
    }
}

async function joinOnlineRoom() {
    const roomCode = document.getElementById('roomCodeInput').value.trim();
    if (!roomCode) {
        alert('Please enter a room code');
        return;
    }

    try {
        showLoadingState('Joining room...');
        console.log('🔧 Joining room with instance:', window.onlineMultiplayer);
        await window.onlineMultiplayer.joinRoom(roomCode);
        console.log('✅ Room joined, player number set to:', window.onlineMultiplayer.playerNumber);
        showWaitingRoom(roomCode);
    } catch (error) {
        hideLoadingState();
        alert('Failed to join room: ' + error.message);
    }
}

function findQuickMatch() {
    alert('Quick Match feature coming soon! For now, use Create Room or Join Room.');
}

function showWaitingRoom(roomCode) {
    hideAllScreens();
    hideLoadingState();
    document.getElementById('waitingRoom').classList.add('active');
    document.getElementById('roomCodeDisplay').textContent = roomCode;
}

function leaveWaitingRoom() {
    console.log('🔧 Leaving waiting room with instance:', window.onlineMultiplayer);
    
    // If game hasn't started yet, we can clear player data
    // If game is active, preserve player data for reconnection
    const shouldClearData = !window.game || window.game.gameMode !== 'online';
    
    if (shouldClearData) {
        window.onlineMultiplayer.leaveRoom(); // This calls cleanup(true)
    } else {
        // Game is active, just disconnect listeners but keep player data
        window.onlineMultiplayer.cleanup(false); // Don't clear player data
    }
    
    hideAllScreens();
    document.getElementById('multiplayerSelector').classList.add('active');
}

function copyRoomCode() {
    const roomCode = document.getElementById('roomCodeDisplay').textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
        const button = document.querySelector('.copy-btn');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    });
}

function showLoadingState(message) {
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'modal-overlay';
        loadingOverlay.innerHTML = `
            <div class="glass-card modal-card">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p id="loadingMessage">${message}</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Send Hezzek o Nfokh penalty to Firebase
async function sendHezzekPenaltyToFirebase(penaltyData) {
    if (!isFirebaseReady()) {
        console.error('Firebase not ready for penalty');
        return false;
    }

    // Prefer the active onlineMultiplayer instance's reference
    let gameStateRef = null;
    if (window.onlineMultiplayer && window.onlineMultiplayer.gameRef) {
        gameStateRef = window.onlineMultiplayer.gameRef.child('gameState');
    } else if (typeof gameId !== 'undefined') {
        gameStateRef = firebase.database().ref(`games/${gameId}/gameState`);
    }

    if (!gameStateRef) {
        console.error('❌ Could not resolve gameState reference for penalty');
        return false;
    }

    try {
        console.log('🚨 Sending Hezzek penalty to Firebase:', penaltyData);
        
        // Set pending state
        pendingMoveData = penaltyData;
        isMovePending = true;
        game.showTemporaryMessage('Applying penalty...', 1000);

        const result = await gameStateRef.transaction((currentState) => {
            if (!currentState) {
                console.error('No gameState found in transaction');
                return;
            }

            // Deep clone board
            const newBoard = JSON.parse(JSON.stringify(currentState.board));
            const eliminatedPiece = penaltyData.eliminatedPiece;
            
            if (newBoard[eliminatedPiece.row] && newBoard[eliminatedPiece.row][eliminatedPiece.col]) {
                newBoard[eliminatedPiece.row][eliminatedPiece.col] = null;
            }

            const updatedState = {
                ...currentState,
                board: newBoard,
                currentPlayer: currentState.currentPlayer === 1 ? 2 : 1,
                moveCount: (currentState.moveCount || 0) + 1,
                lastMove: {
                    from: eliminatedPiece,
                    to: eliminatedPiece,
                    hezzekPenalty: true,
                    player: penaltyData.player,
                    eliminatedPiece: eliminatedPiece,
                    actualCaptures: penaltyData.actualCaptures,
                    maxCaptures: penaltyData.maxCaptures,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    playerId: window.onlineMultiplayer ? window.onlineMultiplayer.playerId : null
                }
            };

            // Ensure board markers are consistent
            sanitizeBoard(updatedState.board);

            console.log('🔄 Penalty transaction update:', updatedState);
            return updatedState;
        });

        if (result.committed) {
            console.log('✅ Penalty sent successfully');
            return true;
        } else {
            console.error('❌ Penalty transaction failed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error sending penalty to Firebase:', error);
        return false;
    } finally {
        isMovePending = false;
        pendingMoveData = null;
    }
}

// Handle Hezzek o Nfokh penalty from Firebase
function handleHezzekPenalty(penaltyData) {
    console.log('🚨 Handling Hezzek penalty:', penaltyData);
    
    const eliminatedPiece = penaltyData.eliminatedPiece;
    const playerName = penaltyData.player === 1 ? 'Player 1' : 'Player 2';
    
    // Apply penalty to local game state
    if (game.board[eliminatedPiece.row] && game.board[eliminatedPiece.row][eliminatedPiece.col]) {
        game.board[eliminatedPiece.row][eliminatedPiece.col] = null;
    }

    // Ensure board markers are consistent after local penalty application
    sanitizeBoard(game.board);

    // Record the penalty in move history
    const penaltyReason = penaltyData.actualCaptures === 0 ? 
        'missing capture' : 
        `capturing only ${penaltyData.actualCaptures} instead of ${penaltyData.maxCaptures} pieces`;
        
    game.lastMove = {
        from: eliminatedPiece,
        to: eliminatedPiece,
        hezzekONfokh: true,
        player: penaltyData.player,
        eliminatedPiece: eliminatedPiece,
        actualCaptures: penaltyData.actualCaptures,
        maxCaptures: penaltyData.maxCaptures,
        description: `${playerName} - Hezzek o Nfokh! Piece at (${eliminatedPiece.row},${eliminatedPiece.col}) eliminated for ${penaltyReason}`
    };
    game.moveHistory.push(game.lastMove);

    // Show penalty modal
    const captureInfo = penaltyData.actualCaptures === 0 ? 
        'You had pieces that could capture!' :
        `You captured ${penaltyData.actualCaptures} piece${penaltyData.actualCaptures > 1 ? 's' : ''} but could have captured ${penaltyData.maxCaptures}!`;
        
    const pieceInfo = `The piece at position (${eliminatedPiece.row + 1},${eliminatedPiece.col + 1}) has been eliminated as punishment.`;
    
    document.getElementById('hezzekMessage').textContent = `${playerName}: ${captureInfo} ${pieceInfo}`;
    document.getElementById('hezzekModal').classList.add('active');

    // Update UI
    game.renderBoard();
    game.updateUI();
    
    // Check if game is over after penalty
    if (game.checkGameOver()) {
        setTimeout(() => {
            game.hideHezzekModal();
            game.showGameOver();
        }, 3000);
    }
}

// Utility: ensure light squares marked correctly
function sanitizeBoard(board) {
    if (!board || board.length !== 8) return board;
    for (let r = 0; r < 8; r++) {
        // Ensure row exists
        if (!Array.isArray(board[r])) {
            board[r] = new Array(8).fill(null);
        }
        // Ensure row has length 8
        if (board[r].length < 8) {
            board[r].length = 8;
        }
        for (let c = 0; c < 8; c++) {
            const isDark = (r + c) % 2 === 1;
            const cell = board[r][c];
            if (isDark) {
                // Dark square: should be null or piece object
                if (cell === 'light' || cell === undefined) {
                    board[r][c] = null;
                }
            } else {
                // Light square: must be sentinel 'light'
                if (cell !== 'light') {
                    board[r][c] = 'light';
                }
            }
        }
    }
    return board;
}

// Call sanitizer in handleGameStateUpdate immediately
// inside handleGameStateUpdate after parameter line

 