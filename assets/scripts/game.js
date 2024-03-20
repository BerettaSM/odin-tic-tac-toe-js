'use strict';

var TicTacToe = (function hideInternals() {
    // ========== MODULE INTERNALS ==========

    const EMPTY_CELL = ' ';

    var arrayPositionRegex = /^[0-8]$/;
    var boardPositionRegex = /^[A-C][1-3]$/i;

    var winConditions = {
        'horizontal-top': [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left': [0, 3, 6],
        'vertical-center': [1, 4, 7],
        'vertical-right': [2, 5, 8],
        'diagonal-left': [0, 4, 8],
        'diagonal-right': [2, 4, 6],
    };

    var baseConfig = {
        onGameOverCallback: function onGameOver(winner, winningRow) {
            if (!winner) {
                console.log('Tie!');
            } else {
                console.log('Winner is', winner.name);
                console.log('Winning row:', winningRow);
            }
        },
        onInvalidPlayCallback: function onInvalidPlay(boardPosition, motive) {
            console.log('Could not place symbol at position', boardPosition);
            console.log('Motive:', motive);
        },
    };

    function Game(player1, player2, config = {}) {
        config = Object.assign({}, baseConfig, config);

        // onGameOverCallback is called with the winner as argument, or null if a tie happened.
        // onInvalidPlayCallback is called with the invalid position on the board, and the motive.
        var { onGameOverCallback, onInvalidPlayCallback } = config;

        var _players = [player1, player2];
        validatePlayers(_players);
        _players = _players.map((p) => Utils.clone(p));

        var _board = Array(9).fill(EMPTY_CELL);
        var _turn = 0;
        var _isOver = false;
        var _winner = null;
        var _winningRow = null;
        var _turnInProgress = false;

        var instance = {
            nextTurn,
            print,
            reset,
            toString,
        };

        // Define getters.
        Object.defineProperties(instance, {
            board: {
                get() {
                    return Array.from(_board);
                },
                configurable: false,
                enumerable: false,
            },
            isOver: {
                get() {
                    return _isOver;
                },
                configurable: false,
                enumerable: false,
            },
            players: {
                get() {
                    return _players.map((p) => Utils.clone(p));
                },
                configurable: false,
                enumerable: false,
            },
            winner: {
                get() {
                    return _winner ? Utils.clone(_winner) : null;
                },
                configurable: false,
                enumerable: false,
            },
            winningRow: {
                get() {
                    return _winningRow;
                },
                configurable: false,
                enumerable: false,
            },
        });

        return instance;

        // =======================================

        async function nextTurn() {
            // Throws an error if game is already over.
            if (_isOver) {
                throw new Error('Game is already over.');
            }

            // Check if it's currently waiting for player input.
            // Since this is an asynchronous call, we'll only allow
            // a new call to this function when the previous is
            // already finished.
            if (_turnInProgress) {
                throw new Error('A game turn is already in progress.');
            }

            // Start of game turn.
            _turnInProgress = true;

            var player = getNextPlayer();

            // Create a copy of current game board to avoid mutation from outside.
            var boardCopy = Array.from(_board);

            // Keep asking the next player for a play until we receive a valid one.
            while (true) {
                // Wait for player to choose a position.
                let tentativePlay = await player.play(boardCopy);

                try {
                    // Parse the given position to an array index using the translator.
                    let index = toArrayPosition(tentativePlay);

                    // If position is already taken, trigger an error and ask again.
                    if (_board[index] != EMPTY_CELL) {
                        throw new Error('Position is already taken');
                    }

                    // Set the position and stop asking by breaking out.
                    _board[index] = player.symbol;
                    break;
                } catch (e) {
                    // Trigger the callback function to possibly show a message.
                    onInvalidPlayCallback(
                        tentativePlay,
                        e.message || 'Something went wrong'
                    );
                }
            }

            // Check for winner/tie.
            checkForGameOver();

            // Pass the turn.
            _turn++;

            // End of turn
            _turnInProgress = false;
        }

        function reset() {
            _board = Array(9).fill(EMPTY_CELL);
            _turn = 0;
            _turnInProgress = false;
            _isOver = false;
            _winner = null;
            _winningRow = null;
        }

        function print() {
            console.log('============= TIC TAC TOE =============\n');
            console.log('Scores:\n');
            for (let player of _players) {
                console.log(` -> ${player.name}: ${player.score}`);
            }
            console.log();
            console.log(toString());
        }

        function toString() {
            var str = '  -------------\n';
            for (let i = 0; i < 3; i++) {
                str += String.fromCharCode(i + 65);
                str += ' | ';
                str += _board.slice(i * 3, i * 3 + 3).join(' | ');
                str += ' |\n';
                str += '  -------------\n';
            }
            str += '    1   2   3\n';
            return str;
        }

        // ============ INTERNALS ================

        function checkForGameOver() {
            // Do nothing if game is already over.
            if (_isOver) {
                return;
            }

            // Check for a winner.
            for (let [row, positions] of Object.entries(winConditions)) {
                let placedSymbols = positions.map(
                    (position) => _board[position]
                );
                for (let player of _players) {
                    if (
                        placedSymbols.every(
                            (symbol) => symbol === player.symbol
                        )
                    ) {
                        player.score++;
                        _winner = player;
                        _winningRow = row;
                        _isOver = true;
                        onGameOverCallback(Utils.clone(_winner), row);
                        return;
                    }
                }
            }

            // If there's no winner, check for a tie.
            if (_board.every((pos) => pos != EMPTY_CELL)) {
                _isOver = true;
                onGameOverCallback();
            }
        }

        function getNextPlayer() {
            var nextPlayerIdx = _turn % 2;
            return _players[nextPlayerIdx];
        }
    }

    // ============ PLAYERS ================

    function BasePlayer(name, symbol) {
        this.name = name;
        this.symbol = symbol;
        this.score = 0;
    }

    BasePlayer.prototype.play = async function (board) {
        throw new Error(
            'All player types must implement their own play function.'
        );
    };

    function Player(name, symbol) {
        BasePlayer.call(this, name, symbol);
    }

    Player.prototype = Object.create(BasePlayer.prototype);

    Player.prototype.constructor = Player;

    Player.prototype.play = async function (board) {
        return window.prompt(`Enter cell for symbol '${this.symbol}': `);
    };

    function Bot(name, symbol) {
        BasePlayer.call(this, name, symbol);
    }

    Bot.prototype = Object.create(BasePlayer.prototype);

    Bot.prototype.constructor = Bot;

    Bot.prototype.play = async function (board) {
        throw new Error('Not implemented');
    };

    function validatePlayers(players) {
        if (players.length !== 2) {
            throw new Error('Two players are required to play.');
        }

        for (let player of players) {
            if (!player || !(player instanceof BasePlayer)) {
                throw new Error(
                    "All players must be within the prototype chain of 'BasePlayer'."
                );
            }

            if (
                !player.symbol ||
                player.symbol.length !== 1 ||
                player.symbol === EMPTY_CELL
            ) {
                throw new Error(
                    `A single character is expected as a player symbol. Received: "${player.symbol}".`
                );
            }
        }

        if (players[0].symbol === players[1].symbol) {
            throw new Error('Players must have different symbols.');
        }
    }

    function toArrayPosition(play) {
        if (!boardPositionRegex.test(play)) {
            throw new Error(`Invalid position "${play}" received`);
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    }

    function toBoardPosition(play) {
        if (!arrayPositionRegex.test(play)) {
            throw new Error(`Invalid board index "${play}" received`);
        }
        var row = Math.floor(play / 3) + 65;
        var col = (Number(play) % 3) + 1;
        return `${String.fromCharCode(row)}${col}`;
    }

    var publicAPI = {
        Game,
        BasePlayer,
        Player,
        // Bot,
        toArrayPosition,
        toBoardPosition,
    };

    return publicAPI;
})();
