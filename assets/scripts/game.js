'use strict';

var TicTacToe = (function hideInternals() {
    const EMPTY_CELL = ' ';

    var arrayPositionRegex = /^[0-8]$/;
    var boardPositionRegex = /^[A-C][1-3]$/i;

    var symbols = ['X', 'O'];

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

    var publicAPI = {
        Game,
        Player,
        Bot,
        parseToArrayPosition,
        parseToBoardPosition,
    };

    return publicAPI;

    // =======================================

    function Game() {
        var _board = Array(9).fill(EMPTY_CELL);
        var _turn = 0;
        var _isOver = false;
        var _winner = null;
        var _winningRow = null;

        var instance = {
            placeAtPosition,
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
            currentSymbol: {
                get() {
                    return getNextSymbol();
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
            winner: {
                get() {
                    return _winner;
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

        function placeAtPosition(tentativePlay) {
            // Throws an error if game is already over.
            if (_isOver) {
                throwGameError('Game is already over');
            }

            // Parse the given position to an array index.
            var index = parseToArrayPosition(tentativePlay);

            // If position is already taken throw an error.
            if (_board[index] != EMPTY_CELL) {
                throwGameError('Position is already taken');
            }

            var symbol = getNextSymbol();

            // The happy path, just place the symbol at the position.
            _board[index] = symbol;

            // Check for winner/tie.
            checkForGameOver();

            // Pass the turn.
            _turn++;
        }

        function reset() {
            _board = Array(9).fill(EMPTY_CELL);
            _turn = 0;
            _isOver = false;
            _winner = null;
            _winningRow = null;
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
                for (let symbol of symbols) {
                    if (
                        placedSymbols.every(
                            (placedSymbol) => placedSymbol === symbol
                        )
                    ) {
                        _winner = symbol;
                        _winningRow = row;
                        _isOver = true;
                        return;
                    }
                }
            }

            // If there's no winner, check for a tie.
            if (_board.every((pos) => pos != EMPTY_CELL)) {
                _isOver = true;
            }
        }

        function getNextSymbol() {
            var nextPlayerIdx = _turn % 2;
            return symbols[nextPlayerIdx];
        }
    }

    // ============ PLAYERS ================

    function BasePlayer(name, symbol) {
        return {
            name,
            symbol,
            score: 0
        }
    }

    function Player(name, symbol) {
        return Object.assign(BasePlayer(name, symbol))
    }

    function Bot(name, symbol) {
        return Object.assign(BasePlayer(name, symbol), {
            play: async function(board) {
                throwGameError('Not implemented');
            }
        });
    }

    // ========== BOARD UTILS ==============

    function throwGameError(message = 'Something went wrong') {
        var error = new Error(message);
        error.name = 'TicTacToeError';
        throw error;
    }

    function parseToArrayPosition(play) {
        if (!boardPositionRegex.test(play)) {
            throwGameError(`Invalid position "${play}" received`);
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    }

    function parseToBoardPosition(play) {
        if (!arrayPositionRegex.test(play)) {
            throwGameError(`Invalid board index "${play}" received`);
        }
        var row = Math.floor(play / 3) + 65;
        var col = (Number(play) % 3) + 1;
        return `${String.fromCharCode(row)}${col}`;
    }

})();
