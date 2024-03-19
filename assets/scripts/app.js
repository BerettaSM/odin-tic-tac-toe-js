function Player(name, symbol) {
    this.name = name;
    this.symbol = symbol;
}

Player.prototype.clone = function () {
    var thisPrototype = Object.getPrototypeOf(this);
    var clone = Object.create(thisPrototype);
    clone.name = this.name;
    clone.symbol = this.symbol;
    return clone;
};

Player.prototype.play = async function (board) {
    // return board[0][1] or 'A1', for example
    return window.prompt('Enter play: ', '');
};

// function Bot(name, symbol) {
//     Player.call(this, name, symbol)
// }

// Bot.prototype = Object.create(Player.prototype)

// Bot.prototype.constructor = Bot;

var BoardTranslator = {
    arrayPositionRegex: /^[0-8]$/,
    invalidArrayPositionMessage: '',
    boardPositionRegex: /^[A-C][1-3]$/i,
    toArrayPosition(play) {
        if (!this.boardPositionRegex.test(play)) {
            throw new Error(
                `Unparseable play received. Received: "${play}".
                 Expected: "A1" through "C3".`
            );
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    },
    toBoardPosition(play) {
        if (!this.arrayPositionRegex.test(play)) {
            throw new Error(
                `Unparseable play received. Received: "${play}".
                 Expected: 0 through 8.`
            );
        }
        var row = Math.floor(play / 3) + 65;
        var col = (Number(play) % 3) + 1;
        return `${String.fromCharCode(row)}${col}`;
    },
};

var Game = (function (boardTranslator) {

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

    // onGameOverCallback is called with the winner as argument, or null if a tie happened.
    // onInvalidPlayCallback is called with the invalid position on the board, and the motive.
    function Game(player1, player2, onGameOverCallback, onInvalidPlayCallback) {
        this._board = Array(9).fill(' ');
        this._players = [player1, player2];
        this._turn = 0;
        this._isOver = false;
        this._winner = null;
        this._winningRow = null;
        this._onGameOver =
            onGameOverCallback ||
            function onGameOver(winner) {
                console.log('Winner is', winner.name);
            };
        this._onInvalidPlay =
            onInvalidPlayCallback ||
            function onInvalidPlay(boardPosition, motive) {
                console.log(
                    'Could not place symbol at position',
                    boardPosition
                );
                console.log('Motive:', motive);
            };
    }

    Game.prototype.nextTurn = async function () {
        // Throws an error if game is already over
        if (this._isOver) {
            throw new Error('Game is already over.');
        }

        // Get next player
        var player = this._nextPlayer();

        // Keep asking the next player for a play until it receives a valid one.
        while (true) {
            var tentativePlay = await player.play(this.board);

            try {
                // Parse the given position to an array index using the translator.
                let index = boardTranslator.toArrayPosition(tentativePlay);

                // If already taken, trigger the callback with pertinent information and ask again.
                if (this._board[index] != EMPTY_CELL) {
                    throw new Error('Position is already taken');
                }

                // Set the position and stop asking by breaking out.
                this._board[index] = player.symbol;
                break;
            } catch (e) {
                // This trigger if the translator is incapable of parsing the position.
                this._onInvalidPlay(
                    tentativePlay,
                    e.message || 'Something went wrong'
                );
            }
        }

        // Check for winner/tie.
        this._checkForGameOver();
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
})(Object.assign({}, BoardTranslator));
