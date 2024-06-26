'use strict';

var TicTacToe = (function hideInternals() {
    const ARRAY_POSITION_REGEX = /^[0-8]$/;
    const BOARD_POSITION_REGEX = /^[A-C][1-3]$/i;
    const EMPTY_CELL = ' ';
    const SYMBOLS = ['X', 'O'];
    const CENTER = 4;
    const CORNERS = [0, 2, 6, 8];
    const TIC_TAC_TOE_ROW = Utils.deepFreeze({
        'horizontal-top': [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left': [0, 3, 6],
        'vertical-center': [1, 4, 7],
        'vertical-right': [2, 5, 8],
        'diagonal-left': [0, 4, 8],
        'diagonal-right': [2, 4, 6],
    });

    const BOT_DIFFICULTY_MULTIPLIERS = {
        EASY: 0.25,
        MEDIUM: 0.75,
        HARD: 1.75,
        VERY_HARD: 4,
    }

    const BotDifficulty = Object.freeze({
        EASY: 'EASY',
        MEDIUM: 'MEDIUM',
        HARD: 'HARD',
        VERY_HARD: 'VERY_HARD',
    });
    const GameTypes = Object.freeze({
        PLAYER_VS_PLAYER: 'PLAYER_VS_PLAYER',
        PLAYER_VS_BOT: 'PLAYER_VS_BOT',
        BOT_VS_BOT: 'BOT_VS_BOT',
    });

    var publicAPI = {
        Game,
        Player,
        Bot,
        parseToArrayPosition,
        parseToBoardPosition,
        scoringRows: TIC_TAC_TOE_ROW,
        BotDifficulty,
        GameTypes,
    };

    return Object.freeze(publicAPI);

    // =======================================

    function Game() {
        var _symbols = [...SYMBOLS];
        Utils.shuffle(_symbols);
        var _board = Array(9).fill(EMPTY_CELL);
        var _turn = 0;
        var _isOver = false;
        var _winner = null;
        var _winningRow = null;

        var instance = {
            placeAtPosition,
            reset,
        };

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
                throwGameError('Game is already over.');
            }

            // Parse the given position to an array index.
            var index = parseToArrayPosition(tentativePlay);

            // If position is already taken throw an error.
            if (_board[index] != EMPTY_CELL) {
                throwGameError(`Position "${tentativePlay}" is already taken.`);
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
            Utils.shuffle(_symbols);
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
                for (let symbol of _symbols) {
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
            return _symbols[nextSymbolIndex];
        }
    }

    // ============ PLAYERS ================

    function BasePlayer(name, symbol) {
        return {
            name,
            symbol,
        };
    }

    function Player(name, symbol) {
        return BasePlayer(name, symbol);
    }

    function Bot(name, symbol, difficulty = BotDifficulty.EASY) {
        var botSymbol = symbol;

        var botPlays = [
            // [ function, chance ]
            [getWinningPlay, 0.4],
            [getDefensivePlay, 0.55],
            [getCornerPlay, 0.3],
            [getCompletionPlay, 0.65],
            [getRandomPlay],
        ];

        return Object.assign(BasePlayer(name, symbol), {
            play: function (board) {
                if (!Array.isArray(board)) {
                    throw new Error(
                        'The bot requires the board to decide on a play.'
                    );
                }

                var [positionIndex] = Object.values(botPlays)

                    // Get plays based on difficulty/chance.
                    .map(([playFn, baseChance]) => {
                        // No base chance means the function get added to the pool.
                        if (baseChance == null) {
                            return playFn;
                        }
                        
                        var difficultyMultipler = BOT_DIFFICULTY_MULTIPLIERS[difficulty];
                        var chance = baseChance * difficultyMultipler;

                        return Math.random() < chance ? playFn : null;
                    })

                    // Leave only functions that got past.
                    .filter((playFn) => !!playFn)

                    // Call them and get a board position to play.
                    .map((playFn) => playFn(board, botSymbol))

                    // Pick the value from the first function that resolved
                    // on a valid board position.
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

    // =========== BOT UTILS ===============

    function getWinningPlay(board, botSymbol) {
        for (let row of Object.values(TIC_TAC_TOE_ROW)) {
            let rowSymbols = getSymbolsOnRow(board, row);
            let numberOfBotPlacedSymbols = countSymbols(
                rowSymbols,
                (rowSymbol) => rowSymbol === botSymbol
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
    }

    function getDefensivePlay(board, botSymbol) {
        for (let row of Object.values(TIC_TAC_TOE_ROW)) {
            let rowSymbols = getSymbolsOnRow(board, row);
            let numberOfOtherPlayerPlaceSymbols = countSymbols(
                rowSymbols,
                (rowSymbol) =>
                    rowSymbol !== botSymbol && rowSymbol !== EMPTY_CELL
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
    }

    function getCornerPlay(board, botSymbol) {
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
                let isACornerTaken = takenCorner != undefined;

                // If opponent already placed at corner,
                // place at center to counter,
                // otherwise place at a random corner.
                return isACornerTaken ? CENTER : Utils.getRandomChoice(CORNERS);
            case 2:
                let botCorners = CORNERS.filter(
                    (corner) => board[corner] === botSymbol
                );
                let oppositeCorner = getOppositeCorner(botCorners[0]);
                let isOppositeCornerEmpty =
                    oppositeCorner != null &&
                    board[oppositeCorner] === EMPTY_CELL;
                let isCenterEmpty = board[CENTER] === EMPTY_CELL;

                // Favor taking the center,
                // then taking the opposite corner,
                // or simply another corner.
                return isCenterEmpty
                    ? CENTER
                    : isOppositeCornerEmpty
                    ? oppositeCorner
                    : Utils.getRandomChoice(
                          CORNERS.filter(
                              (corner) => board[corner] === EMPTY_CELL
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
    }

    function getCompletionPlay(board, botSymbol) {
        for (let row of Object.values(TIC_TAC_TOE_ROW)) {
            let rowSymbols = getSymbolsOnRow(board, row);
            let numberOfBotPlacedSymbols = countSymbols(
                rowSymbols,
                (rowSymbol) => rowSymbol === botSymbol
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

            let randomEmptyCellIndex = Utils.getRandomChoice(emptyCells);

            return randomEmptyCellIndex;
        }

        return null;
    }

    function getRandomPlay(board) {
        var availablePositions = board
            .map((_, index) => index)
            .filter((index) => board[index] === EMPTY_CELL);

        return Utils.getRandomChoice(availablePositions);
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
            throw new Error(`No such corner exists. Corner: "${corner}"`);
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
            throwGameError(`Invalid position "${play}" received.`);
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    }

    function parseToBoardPosition(play) {
        if (!ARRAY_POSITION_REGEX.test(play)) {
            throwGameError(`Invalid board index "${play}" received.`);
        }
        var row = Math.floor(play / 3) + 65;
        var col = (Number(play) % 3) + 1;
        return `${String.fromCharCode(row)}${col}`;
    }
})();
