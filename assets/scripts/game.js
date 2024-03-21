'use strict';

var TicTacToe = (function hideInternals() {
    const ARRAY_POSITION_REGEX = /^[0-8]$/;
    const BOARD_POSITION_REGEX = /^[A-C][1-3]$/i;
    const EMPTY_CELL = ' ';
    const SYMBOLS = ['X', 'O'];
    const CENTER = 4;
    const CORNERS = [0, 2, 6, 8];
    const TIC_TAC_TOE_ROW = {
        'horizontal-top': [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left': [0, 3, 6],
        'vertical-center': [1, 4, 7],
        'vertical-right': [2, 5, 8],
        'diagonal-left': [0, 4, 8],
        'diagonal-right': [2, 4, 6],
    };

    const BotDifficulty = Object.freeze({
        EASY: 'EASY',
        MEDIUM: 'MEDIUM',
        HARD: 'HARD',
    });

    var publicAPI = {
        Game,
        Player,
        Bot,
        parseToArrayPosition,
        parseToBoardPosition,
        TIC_TAC_TOE_ROW: Utils.deepClone(TIC_TAC_TOE_ROW),
        BotDifficulty,
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
            },
            currentSymbol: {
                get() {
                    return getNextSymbol();
                },
            },
            isOver: {
                get() {
                    return _isOver;
                },
            },
            winner: {
                get() {
                    return _winner;
                },
            },
            winningRow: {
                get() {
                    return _winningRow;
                },
            },
        });

        return Object.freeze(instance);

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
            for (let [row, positions] of Object.entries(TIC_TAC_TOE_ROW)) {
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
            var nextSymbolIndex = _turn % 2;
            return SYMBOLS[nextSymbolIndex];
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
        return BasePlayer(name, symbol);
    }

    function Bot(name, symbol, difficulty = BotDifficulty.EASY) {
        var mySymbol = symbol;

        var plays = {
            win: {
                baseChance: 0.5,
                fn: function getWinningPlay(board) {
                    for (let row of Object.values(TIC_TAC_TOE_ROW)) {
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
            },
            defense: {
                baseChance: 0.6,
                fn: function getDefensivePlay(board) {
                    for (let row of Object.values(TIC_TAC_TOE_ROW)) {
                        let rowSymbols = getSymbolsOnRow(board, row);
                        let numberOfOtherPlayerPlaceSymbols = countSymbols(
                            rowSymbols,
                            (rowSymbol) =>
                                rowSymbol !== mySymbol &&
                                rowSymbol !== EMPTY_CELL
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
            },
            corner: {
                baseChance: 0.7,
                fn: function getCornerPlay(board) {
                    var currentTurn = getGameTurn(board);

                    if (currentTurn === board.length) {
                        // There's no empty cell for some reason.
                        return null;
                    }

                    switch (currentTurn) {
                        case 0:
                            // Place on random corner.
                            return Utils.getRandomChoice(CORNERS);
                        case 1:
                            let takenCorner = CORNERS.filter(
                                (corner) => board[corner] !== EMPTY_CELL
                            )[0];
                            let isACornerTaken =
                                takenCorner != undefined &&
                                board[takenCorner] !== mySymbol;

                            // If opponent already placed at corner,
                            // place at center to counter,
                            // otherwise place at a random corner.
                            return isACornerTaken
                                ? CENTER
                                : Utils.getRandomChoice(CORNERS);
                        case 2:
                            let myCorner = CORNERS.filter(
                                (corner) => board[corner] !== EMPTY_CELL
                            ).find((corner) => board[corner] === mySymbol);
                            let oppositeCorner = getOppositeCorner(myCorner);
                            let isCenterEmpty = board[CENTER] === EMPTY_CELL;

                            // Favor taking the center,
                            // then taking the opposite corner,
                            // or simply another corner.
                            return isCenterEmpty
                                ? CENTER
                                : oppositeCorner != null &&
                                  board[oppositeCorner] === EMPTY_CELL
                                ? oppositeCorner
                                : Utils.getRandomChoice(
                                      CORNERS.filter(
                                          (corner) =>
                                              board[corner] !== EMPTY_CELL
                                      )
                                  );

                        case 4:
                            let emptyCorners = CORNERS.filter(
                                (corner) => board[corner] === EMPTY_CELL
                            );

                            // Try to complete a third corner(possibly) to setup a trap.
                            return Utils.getRandomChoice(emptyCorners);
                        default:
                            return null;
                    }
                },
            },
            completion: {
                baseChance: 0.8,
                fn: function getCompletionPlay(board) {
                    for (let row of Object.values(TIC_TAC_TOE_ROW)) {
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

                        let randomEmptyCellIndex =
                            Utils.getRandomChoice(emptyCells);

                        return randomEmptyCellIndex;
                    }

                    return null;
                },
            },
            random: {
                fn: function getRandomPlay(board) {
                    var availablePositions = board
                        .map((_, index) => index)
                        .filter((index) => board[index] === EMPTY_CELL);

                    return Utils.getRandomChoice(availablePositions);
                },
            },
        };

        return Object.assign(BasePlayer(name, symbol), {
            play: async function (board) {
                var [positionIndex] = Object.values(plays)
                    .map(({ baseChance, fn }) => {
                        if (baseChance == null) {
                            return fn;
                        }
                        var chance = getPlayChanceByDifficulty(
                            difficulty,
                            baseChance
                        );
                        return Math.random() < chance ? fn : null;
                    })
                    .filter((fn) => !!fn)
                    .map((fn) => fn(board))
                    .filter((index) => index != null);

                if (positionIndex == null) {
                    // Shouldn't get here. ¯\_(ツ)_/¯
                    throw new Error(
                        'No positions available! Something wrong is not quite right... 😅'
                    );
                }

                return parseToBoardPosition(positionIndex);
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

    function getPlayChanceByDifficulty(difficulty, baseChance) {
        switch (difficulty) {
            case BotDifficulty.EASY:
                return baseChance / 2;
            case BotDifficulty.HARD:
                return 1;
            default:
                return baseChance;
        }
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
