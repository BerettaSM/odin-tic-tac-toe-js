'use strict';

var TicTacToe = (function hideInternals() {
    const EMPTY_CELL = ' ';

    const ARRAY_POSITION_REGEX = /^[0-8]$/;
    const BOARD_POSITION_REGEX = /^[A-C][1-3]$/i;

    const SYMBOLS = ['X', 'O'];
    const CENTER = 5;
    const CORNERS = [0, 2, 6, 8];
    const EDGES = [1, 3, 5, 7];

    const winConditions = {
        'horizontal-top': [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left': [0, 3, 6],
        'vertical-center': [1, 4, 7],
        'vertical-right': [2, 5, 8],
        'diagonal-left': [0, 4, 8],
        'diagonal-right': [2, 4, 6],
    };

    var publicAPI = {
        Game,
        Player,
        Bot,
        parseToArrayPosition,
        parseToBoardPosition,
        winConditions: Utils.deepClone(winConditions),
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
                for (let symbol of SYMBOLS) {
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
            return SYMBOLS[nextPlayerIdx];
        }
    }

    // ============ PLAYERS ================

    function BasePlayer(name, symbol) {
        return {
            name,
            symbol,
            score: 0,
        };
    }

    function Player(name, symbol) {
        return Object.assign(BasePlayer(name, symbol));
    }

    function Bot(name, symbol) {
        var mySymbol = symbol;

        var plays = [
            function getWinningPlay(board) {
                for (let row of Object.values(winConditions)) {
                    let rowSymbols = getSymbolsOnRow(board, row);
                    let numberOfBotPlacedSymbols = countSymbols(
                        rowSymbols,
                        (rowSymbol) => rowSymbol === mySymbol
                    );

                    if (numberOfBotPlacedSymbols !== 2) {
                        continue;
                    }

                    let emptyCellIndex = rowSymbols.findIndex(
                        (rowSymbol) => rowSymbol == EMPTY_CELL
                    );
                    if (emptyCellIndex === -1) {
                        continue;
                    }

                    return row[emptyCellIndex];
                }

                return null;
            },
            function getDefensivePlay(board) {
                for (let row of Object.values(winConditions)) {
                    let rowSymbols = getSymbolsOnRow(board, row);
                    let numberOfOtherPlayerPlaceSymbols = countSymbols(
                        rowSymbols,
                        (rowSymbol) =>
                            rowSymbol !== mySymbol && rowSymbol !== EMPTY_CELL
                    );

                    if (numberOfOtherPlayerPlaceSymbols !== 2) {
                        continue;
                    }

                    let emptyCellIndex = rowSymbols.findIndex(
                        (rowSymbol) => rowSymbol == EMPTY_CELL
                    );
                    if (emptyCellIndex === -1) {
                        continue;
                    }

                    return row[emptyCellIndex];
                }

                return null;
            },
            function getCornerPlay(board) {},
            function getCompletionPlay(board) {
                for (let row of Object.values(winConditions)) {
                    let rowSymbols = getSymbolsOnRow(board, row);
                    let numberOfBotPlacedSymbols = countSymbols(
                        rowSymbols,
                        (rowSymbol) => rowSymbol === mySymbol
                    );

                    if (numberOfBotPlacedSymbols !== 1) {
                        continue;
                    }

                    let emptyCells = row.filter(
                        (rowIndex) => board[rowIndex] == EMPTY_CELL
                    );

                    if (emptyCells.length !== 2) {
                        continue;
                    }

                    let randomEmptyCellIndex = Utils.getRandomChoice(
                        ...emptyCells
                    );

                    return randomEmptyCellIndex;
                }

                return null;
            },
            function getRandomPlay(board) {
                var availablePositions = board
                    .map((_, index) => index)
                    .filter((index) => board[index] === EMPTY_CELL);

                return Utils.getRandomChoice(...availablePositions);
            },
        ];

        return Object.assign(BasePlayer(name, symbol), {
            play: async function (board) {
                // Winning play first -> try to win.
                var play1 = plays[0](board);
                console.log(
                    'Winning play:',
                    play1 !== null ? parseToBoardPosition(play1) : null,
                    play1
                );

                // Defensive play -> check if loss is iminent and act accordingly.
                var play2 = plays[1](board);
                console.log(
                    'Defensive play:',
                    play2 !== null ? parseToBoardPosition(play2) : null,
                    play2
                );

                // Try to play the CORNERS ?

                // var play3 = plays[2](board);
                // console.log(
                //     'Corner play:',
                //     play3 !== null ? parseToBoardPosition(play3) : null,
                //     play3
                // );

                // Completion play -> Try to place a symbol to set up wins.
                var play4 = plays[3](board);
                console.log(
                    'Completion play:',
                    play4 !== null ? parseToBoardPosition(play4) : null,
                    play4
                );

                // Random play -> just random
                var play5 = plays[4](board);
                console.log(
                    'Random play:',
                    play5 !== null ? parseToBoardPosition(play5) : null,
                    play5
                );

                // Shouldn't get here. ¯\_(ツ)_/¯
                // throw new Error(
                //     'No positions available! Something wrong is not quite right... 😅'
                // );
            },
        });
    }

    // ========== BOARD UTILS ==============

    function getGameTurn(board) {
        return board.filter((cell) => cell !== EMPTY_CELL).length;
    }

    function getOppositeCorner(corner) {
        if (corner == null) {
            return null;
        }
        // sanity check
        if (corner < 0 || corner > 8) {
            throwGameError('No such corner exists.');
        }
        return Math.abs(corner - 8);
    }

    function getSymbolsOnRow(board, row) {
        return row.map((pos) => board[pos]);
    }

    function countSymbols(row, predicate) {
        return row.filter(predicate).length;
    }

    function throwGameError(message = 'Something went wrong') {
        var error = new Error(message);
        error.name = 'TicTacToeError';
        throw error;
    }

    function parseToArrayPosition(play) {
        if (!BOARD_POSITION_REGEX.test(play)) {
            throwGameError(`Invalid position "${play}" received`);
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    }

    function parseToBoardPosition(play) {
        if (!ARRAY_POSITION_REGEX.test(play)) {
            throwGameError(`Invalid board index "${play}" received`);
        }
        var row = Math.floor(play / 3) + 65;
        var col = (Number(play) % 3) + 1;
        return `${String.fromCharCode(row)}${col}`;
    }
})();
