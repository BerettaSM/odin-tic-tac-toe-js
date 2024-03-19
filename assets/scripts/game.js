var TicTacToeGame = (function hideInternals() {
    const EMPTY_CELL = ' ';

    var winConditions = {
        'horizontal-top':    [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left':     [0, 3, 6],
        'vertical-center':   [1, 4, 7],
        'vertical-right':    [2, 5, 8],
        'diagonal-left':     [0, 4, 8],
        'diagonal-right':    [2, 4, 6],
    };

    var baseConfig = {
        boardTranslator: new BoardTranslator(),
        onGameOverCallback: function onGameOver(winner) {
            console.log('Winner is', winner.name);
        },
        onInvalidPlayCallback: function onInvalidPlay(boardPosition, motive) {
            console.log('Could not place symbol at position', boardPosition);
            console.log('Motive:', motive);
        },
    };

    // onGameOverCallback is called with the winner as argument, or null if a tie happened.
    // onInvalidPlayCallback is called with the invalid position on the board, and the motive.
    function Game(player1, player2, config = {}) {
        config = Object.assign({}, baseConfig, config);
        validateBoardTranslator(config.boardTranslator);
        this._players = [player1, player2];
        validatePlayers(this._players);
        this._boardTranslator = config.boardTranslator;
        this._board = Array(9).fill(EMPTY_CELL);
        this._turn = 0;
        this._turnInProgress = false;
        this._isOver = false;
        this._winner = null;
        this._winningRow = null;
        this._onGameOver = config.onGameOverCallback;
        this._onInvalidPlay = config.onInvalidPlayCallback;
    }

    Game.prototype.nextTurn = async function () {
        // Throws an error if game is already over.
        if (this._isOver) {
            throw new Error('Game is already over.');
        }

        // Check if it's currently waiting for player input.
        // Since this is an asynchronous call, we'll only allow
        // a new call to this function when the previous is
        // already finished.
        if (this._turnInProgress) {
            throw new Error('A game turn is already in progress.');
        }

        // Start of game turn.
        this._turnInProgress = true;

        // Get next player.
        var player = this._nextPlayer();

        // Keep asking the next player for a play until we receive a valid one.
        while (true) {
            let tentativePlay = await player.play(this.board);

            try {
                // Parse the given position to an array index using the translator.
                let index =
                    this._boardTranslator.toArrayPosition(tentativePlay);

                // If position is already taken, trigger an error and ask again.
                if (this._board[index] != EMPTY_CELL) {
                    throw new Error('Position is already taken');
                }

                // Set the position and stop asking by breaking out.
                this._board[index] = player.symbol;
                break;
            } catch (e) {
                // Trigger the callback function to possibly show a message.
                this._onInvalidPlay(
                    tentativePlay,
                    e.message || 'Something went wrong'
                );
            }
        }

        // Check for winner/tie.
        this._checkForGameOver();

        // End of turn
        this._turnInProgress = false;
    };

    Game.prototype.toString = function () {
        var str = '-------------\n';
        for (let i = 0; i < 3; i++) {
            str += '| ';
            str += this._board.slice(i * 3, i * 3 + 3).join(' | ');
            str += ' |\n';
            str += '-------------\n';
        }
        return str;
    };

    // ========== INTERNALS ==========

    function validatePlayers(players) {
        if (players.length !== 2) {
            throw new Error('Two players are required to play.');
        }

        for (let player of players) {
            if (!player || !(player instanceof Player)) {
                throw new Error(
                    "All players must be within the prototype chain of 'Player'."
                );
            }

            if (!player.symbol || player.symbol.length !== 1 || player.symbol === EMPTY_CELL) {
                throw new Error(
                    `A single character is expected as a player symbol. Received: "${player.symbol}".`
                );
            }
        }

        if (players[0].symbol === players[1].symbol) {
            throw new Error('Players must have different symbols.');
        }
    }

    function validateBoardTranslator(translator) {
        if (!translator || !(translator instanceof BoardTranslator)) {
            throw new Error(
                "The board translator must be within the prototype chain of 'BoardTranlator'."
            );
        }
    }

    Game.prototype._nextPlayer = function () {
        var nextPlayerIdx = this._turn % 2;
        this._turn++;
        return this._players[nextPlayerIdx];
    };

    Game.prototype._checkForGameOver = function () {
        // Do nothing if game is already over.
        if (this._isOver) {
            return;
        }

        // Check for a winner.
        for (let [row, positions] of Object.entries(winConditions)) {
            let placedSymbols = positions.map(
                (position) => this.board[position]
            );
            for (let player of this._players) {
                if (placedSymbols.every((symbol) => symbol === player.symbol)) {
                    this._winner = player.clone();
                    this._winningRow = row;
                    this._isOver = true;
                    this._onGameOver(this._winner);
                    return;
                }
            }
        }

        // If there's no winner, check for a tie.
        if (this._board.every((pos) => pos != EMPTY_CELL)) {
            this._isOver = true;
            this._onGameOver(null);
        }
    };

    Object.defineProperties(Game.prototype, {
        board: {
            get() {
                return Array.from(this._board);
            },
            configurable: false,
            enumerable: false,
        },
        isOver: {
            get() {
                return this._isOver;
            },
            configurable: false,
            enumerable: false,
        },
        winner: {
            get() {
                return this._winner ? this._winner.clone() : null;
            },
            configurable: false,
            enumerable: false,
        },
        winningRow: {
            get() {
                return this._winningRow;
            },
            configurable: false,
            enumerable: false,
        },
    });

    // ===============================

    return Game;
})();

function BoardTranslator() {
    this.arrayPositionRegex = /^[0-8]$/;
    this.boardPositionRegex = /^[A-C][1-3]$/i;
}

BoardTranslator.prototype.toArrayPosition = function (play) {
    if (!this.boardPositionRegex.test(play)) {
        throw new Error(
            `Invalid position "${play}" received`
        );
    }
    var row = play[0].toUpperCase().charCodeAt(0) - 65;
    var col = Number(play[1]) - 1;
    return row * 3 + col;
};

BoardTranslator.prototype.toBoardPosition = function (play) {
    if (!this.arrayPositionRegex.test(play)) {
        throw new Error(
            `Invalid board index "${play}" received`
        );
    }
    var row = Math.floor(play / 3) + 65;
    var col = (Number(play) % 3) + 1;
    return `${String.fromCharCode(row)}${col}`;
};