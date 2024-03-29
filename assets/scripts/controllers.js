'use strict';

var ConsoleGameController = (function hideInternals() {
    var { BotDifficulty, GameTypes } = TicTacToe;

    return Controller;

    // =====================================

    function Controller(gameService) {
        var _signal = {
            cancelled: false,
        };

        var instance = {
            init,
        };

        return Utils.createInitProxy(instance);

        // =====================================

        async function init() {
            await _init(gameService, _signal);
        }
    }

    // =========== INTERNALS ===============

    async function _init(gameService, signal) {
        // Collect options: players names, game type, bot difficulty
        var config = collectConfig();

        // init the game service with configs
        gameService.init({
            ...config,
            botArtificialPlayDelayRange: [1000, 3500],
        });

        var replay;

        do {
            let tentativePlay;

            while (!gameService.isGameOver) {
                printGame(gameService);

                if (!('play' in gameService.currentPlayer)) {
                    // If there's no play method on current player
                    // it means it's not a bot, so we ask
                    // ask for input.
                    tentativePlay = askForInput(
                        'Enter a board position ( e.g.: A1 ): '
                    );
                }

                try {
                    // The tentative play gets internally ignored
                    // if the current player is a bot.
                    await gameService.playTurn(tentativePlay, signal);
                } catch (e) {
                    if (e instanceof Error && e.name === 'TicTacToeError') {
                        window.alert(e.message);
                    } else {
                        throw e;
                    }
                }
            }

            // Announce the winner and any errors
            printGame(gameService);

            gameService.rematch();

            // ask if player wants to play again, then loop back.
            replay = askForInput(
                'Would you like to play again? (yes/no): '
            ).toLowerCase()[0];
        } while (replay !== 'n');
    }

    function printGame(gameService) {
        console.clear();
        var str = '========== Tic Tac Toe ==========\n';

        str += '\n -- SCORES --\n\n';

        for (let { name, symbol } of gameService.players) {
            var isCurrentPlayer = gameService.currentPlayer.symbol === symbol;
            str += `${
                isCurrentPlayer ? ' TURN --> ' : '          '
            }${name} ( ${symbol} ): ${gameService.scores[symbol]} points\n`;
        }

        str += '\n  -------------\n';
        for (let i = 0; i < 3; i++) {
            str += String.fromCharCode(i + 65);
            str += ' | ';
            str += Object.values(gameService.board)
                .slice(i * 3, i * 3 + 3)
                .join(' | ');
            str += ' |\n';
            str += '  -------------\n';
        }
        str += '    1   2   3\n\n';

        if (gameService.isGameOver) {
            let { winner, winningRow } = gameService;

            str += `${
                winner
                    ? `${winner.name} ( ${winner.symbol} ) won on row ${winningRow}!`
                    : "It's a tie!"
            }\n\n`;
        }

        console.log(str);
    }

    function collectConfig() {
        // game type first
        var gameType = askForOption('Choose a game type, or cancel to abort.', {
            'Player VS Player': GameTypes.PLAYER_VS_PLAYER,
            'Player VS Bot': GameTypes.PLAYER_VS_BOT,
            'Bot VS Bot (Spectate)': GameTypes.BOT_VS_BOT,
        });

        var botDifficulty;
        // if game includes a bot, ask difficulty
        if (gameType !== GameTypes.PLAYER_VS_PLAYER) {
            botDifficulty = askForOption(
                'Choose a bot difficulty, or cancel to abort.',
                {
                    Easy: BotDifficulty.EASY,
                    Medium: BotDifficulty.MEDIUM,
                    Hard: BotDifficulty.HARD,
                }
            );
        }
        // collect names (Only appliable to players)
        var P1Name, P2Name;
        if (gameType !== GameTypes.BOT_VS_BOT) {
            P1Name = askForInput('( Player "X" ) Enter your name: ', 'Player');
        }
        if (gameType === GameTypes.PLAYER_VS_PLAYER) {
            P2Name = askForInput('( Player "O" ) Enter your name: ', 'Player');
        }

        return {
            gameType,
            botDifficulty,
            P1Name,
            P2Name,
        };
    }

    function askForInput(description, defaultValue) {
        var input;

        while (true) {
            input = window.prompt(description);

            if (input == null) {
                // User hit cancel.
                throw new Error('cancelled');
            }

            input = input.trim() || defaultValue;

            if (input && input.length > 0) {
                break;
            }

            window.alert(`Invalid input! Please, try again...`);
        }

        return input;
    }

    function askForOption(description, optionsObj = {}) {
        var options = Object.keys(optionsObj);

        // Sanity check
        if (options.length === 0) {
            throw new Error('You must supply an object with options.');
        }

        var menu = `${description}\n\n${createMenu(
            options
        )}\nYour choice ( Defaults to "${options[0]}" if left empty ): `;

        var choice, input;

        while (true) {
            input = window.prompt(menu);

            if (input == null) {
                // User hit cancel.
                throw new Error('cancelled');
            }

            if (input === '') {
                choice = 0;
                break;
            }

            choice = Number(input) - 1;

            if (isFinite(choice) && options[choice] != undefined) {
                break;
            }

            window.alert('Invalid option! Please, try again...');
        }

        return optionsObj[options[choice]];
    }

    function createMenu(options) {
        var string = '';

        for (let i = 0; i < options.length; i++) {
            let optionIndex = (i + 1).toString().padStart(5, ' ');
            string += `${optionIndex}) ${options[i]}\n`;
        }

        return string;
    }
})();

var DOMGameController = (function hideInternals() {
    return Controller;

    // =====================================

    function Controller(gameService) {
        var _resetButtonEle = null;
        var _gameBoardEle = null;
        var _scoreBoardEle = null;
        var _xSymbol = null;
        var _oSymbol = null;

        var _signal = {
            cancelled: false,
        };

        var instance = {
            init,
            cleanUp,
        };

        return Utils.createInitProxy(instance);

        // =====================================

        async function init(config) {
            var {
                domElements: {
                    resetButton,
                    gameBoard,
                    scoreBoard,
                    xSymbol,
                    oSymbol,
                },
                ...serviceConfig
            } = config;

            gameService.init({
                ...serviceConfig,
                eventTarget: window,
            });

            _xSymbol = xSymbol;
            _oSymbol = oSymbol;

            _scoreBoardEle = scoreBoard;

            _resetButtonEle = resetButton;
            _resetButtonEle.addEventListener('click', handleResetClick);

            _gameBoardEle = gameBoard;
            _gameBoardEle.addEventListener('click', handleCellClick);

            window.addEventListener(GameEvents.GAME_START, onGameStart);
            window.addEventListener(GameEvents.GAME_OVER, onGameOver);
            window.addEventListener(GameEvents.GAME_NEW_TURN, onGameNewTurn);
            window.addEventListener(GameEvents.BOT_DELAY_START, onBotDelayStart);
            window.addEventListener(GameEvents.BOT_DELAY_END, onBotDelayEnd);

            updateUI();

            await checkForBot();
        }

        // This handler is added to the overall board,
        // and the actual button is found through event bubbling.
        async function handleCellClick({ target }) {
            if (!target.hasAttribute('data-cell')) {
                // Click occurred within board, but not actually on a button.
                return;
            }
            var cellID = target.dataset.cell;
            await gameService.playTurn(cellID);
            updateUI();
            await checkForBot();
        }

        async function handleResetClick() {
            _resetButtonEle.disabled = true;
            var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');
            cellButtons.forEach(function removeBlinkClass(button) {
                button.classList.remove('blink');
                button.innerHTML = '';
            });
            gameService.rematch();
            updateUI();
            hideWinningRows();
            await checkForBot();
        }

        function updateUI() {
            var boardState = gameService.board;
            var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');

            var shouldDisableAllButtons =
                gameService.isGameOver || 'play' in gameService.currentPlayer;

            cellButtons.forEach(function updateCell(button) {
                var cellID = button.dataset.cell;
                var isEmpty = boardState[cellID] === ' ';
                if (!isEmpty && button.children.length === 0) {
                    button.appendChild(getCellSymbol(boardState[cellID]));
                    button.classList.add('blink');
                }
                button.disabled = shouldDisableAllButtons || !isEmpty;
            });
        }

        async function checkForBot() {
            if (
                !gameService.isGameOver &&
                'play' in gameService.currentPlayer
            ) {
                try {
                    await gameService.playTurn(null, _signal);
                    updateUI();
                    await checkForBot();
                } catch (e) {
                    if (e instanceof Error && e.message == 'cancelled') {
                        console.log('Bot play was cancelled.');
                    } else {
                        throw e;
                    }
                }
            }
        }

        function hideWinningRows() {
            var rows = _gameBoardEle.querySelectorAll(
                '.game-board__winner-line'
            );

            rows.forEach(function hideRow(row) {
                row.classList.remove('visible');
            });
        }

        function cleanUp() {
            _signal.cancelled = true;

            _resetButtonEle.removeEventListener('click', handleResetClick);
            _gameBoardEle.removeEventListener('click', handleCellClick);

            window.removeEventListener(GameEvents.GAME_START, onGameStart);
            window.removeEventListener(GameEvents.GAME_OVER, onGameOver);
            window.removeEventListener(GameEvents.GAME_NEW_TURN, onGameNewTurn);
            window.removeEventListener(GameEvents.BOT_DELAY_START, onBotDelayStart);
            window.removeEventListener(GameEvents.BOT_DELAY_END, onBotDelayEnd);

            var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');

            cellButtons.forEach(function disableButton(button) {
                button.disabled = true;
                button.innerHTML = '';
                button.classList.remove('blink');
            });

            hideWinningRows();
        }

        function getCellSymbol(value) {
            switch (value) {
                case 'X':
                    return _xSymbol.cloneNode(true);
                case 'O':
                    return _oSymbol.cloneNode(true);
                default:
                    return ' ';
            }
        }

        // ============= EVENTS ================

        function onGameStart() {
            _resetButtonEle.disabled = true;
            _resetButtonEle.querySelector('.pushable__label').textContent =
                'Playing...';

            var { name, symbol } = gameService.currentPlayer;

            window.dispatchEvent(
                new CustomEvent(GameEvents.GAME_NEW_TURN, {
                    detail: {
                        player: name,
                        symbol,
                    },
                })
            );
        }

        function onGameOver(event) {
            if (winner) {
                scoreBoard.querySelector(
                    `[data-psymbol="${winner.symbol}"] .score`
                ).textContent = newScore;
            }

            var { winner, winningRow, newScore } = event.detail;
            // mark the winning row, if any
            if (winningRow) {
                var row = _gameBoardEle.querySelector(
                    `[data-row-id="${winningRow}"]`
                );
                row.classList.add('visible');
                // enabled rematch button
                _resetButtonEle.disabled = false;
                _resetButtonEle.querySelector('.pushable__label').textContent =
                    'Rematch';
                _scoreBoardEle.querySelector(
                    `[data-psymbol="${winner.symbol}"] .score`
                ).textContent = newScore;
            } else {
                _gameBoardEle.classList.add('tie');

                setTimeout(function () {
                    _gameBoardEle.classList.remove('tie');
                    _resetButtonEle.disabled = false;
                    _resetButtonEle.querySelector(
                        '.pushable__label'
                    ).textContent = 'Rematch';
                }, 2000);
            }
        }

        function onGameNewTurn(event) {
            var { symbol } = event.detail;

            for (let pInfo of _scoreBoardEle.querySelectorAll(
                '.game-score__player'
            )) {
                pInfo.classList.remove('current');
            }

            _scoreBoardEle
                .querySelector(`[data-psymbol="${symbol}"]`)
                .classList.add('current');
        }

        function onBotDelayStart(event) {
            console.log('Bot start thinking', event.detail);
        }

        function onBotDelayEnd(event) {
            console.log('Bot done', event.detail);
        }
    }
})();
