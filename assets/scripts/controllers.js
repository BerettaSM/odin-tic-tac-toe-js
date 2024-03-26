'use strict';

var ConsoleGameController = (function hideInternals() {
    var { BotDifficulty, GameTypes } = TicTacToe;

    return Controller;

    // =====================================

    function Controller(gameService) {
        var instance = {
            init,
        };

        return Utils.createInitProxy(instance);

        // =====================================

        function init() {
            _init(gameService);
        }
    }

    // =========== INTERNALS ===============

    async function _init(gameService) {
        // Warn the player the game will be played through the browser console
        window.alert(
            'This TicTacToe game will be played through the browser console.\n\n' +
                'Press CTRL + SHIFT + J on Google Chrome.\n' +
                'Press CTRL + SHIFT + I on Firefox.\n\n' +
                'Alternatively, search for the console option on settings.'
        );

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
                    await gameService.playTurn(tentativePlay);
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

        console.log('Thanks for playing! :)');
    }

    function printGame(gameService) {
        console.clear();
        var str = '========== Tic Tac Toe ==========\n';

        str += '\n -- SCORES --\n\n';

        for (let { name, symbol } of gameService.players) {
            str += `${name} ( ${symbol} ): ${gameService.scores[symbol]} points\n`;
        }

        str += '\n  -------------\n';
        for (let i = 0; i < 3; i++) {
            str += String.fromCharCode(i + 65);
            str += ' | ';
            // TODO: Fix how the board is iterated.
            str += gameService.board
                .slice(i * 3, i * 3 + 3)
                .map((entry) => entry.value)
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
        var gameType = askForOption('Choose a game type.', {
            'Player VS Player': GameTypes.PLAYER_VS_PLAYER,
            'Player VS Bot': GameTypes.PLAYER_VS_BOT,
            'Bot VS Bot (Spectate)': GameTypes.BOT_VS_BOT,
        });

        var botDifficulty;
        // if game includes a bot, ask difficulty
        if (gameType !== GameTypes.PLAYER_VS_PLAYER) {
            botDifficulty = askForOption('Choose a bot difficulty.', {
                Easy: BotDifficulty.EASY,
                Medium: BotDifficulty.MEDIUM,
                Hard: BotDifficulty.HARD,
            });
        }
        // collect names (Only appliable to players)
        var P1Name, P2Name;
        if (gameType !== GameTypes.BOT_VS_BOT) {
            P1Name = askForInput('( Player "X" ) Enter your name: ');
        }
        if (gameType === GameTypes.PLAYER_VS_PLAYER) {
            P2Name = askForInput('( Player "O" ) Enter your name: ');
        }

        return {
            gameType,
            botDifficulty,
            P1Name,
            P2Name,
        };
    }

    function askForInput(description) {
        var input;

        while (true) {
            input = window.prompt(description)?.trim();

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
            try {
                input = window.prompt(menu);

                if (input === '') {
                    choice = 0;
                    break;
                }

                choice = Number(input) - 1;

                if (options[choice] != undefined) {
                    break;
                }
            } catch {}

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

// This controller is responsible only for the game section,
// on the last page. Page navigation will be handled elsewhere.
var DOMGameController = (function hideInternals() {
    return Controller;

    // =====================================

    function Controller(gameService) {
        // var _config = null;
        var _resetButtonEle = null;
        var _gameBoardEle = null;

        var instance = {
            init,
            cleanUp,
        };

        return Utils.createInitProxy(instance);

        // =====================================

        // var baseConfig = {
        //     botDifficulty: BotDifficulty.EASY,
        //     botArtificialPlayDelayRange: [1500, 3500] || null,
        //     gameType: GameTypes.PLAYER_VS_PLAYER,
        //     P1Name: null,
        //     P2Name: null,
        //     onGameOverCallback: null,
        //     onBotStartThinkingCallback: null,
        //     onBotDoneThinkingCallback: null,
        //     domElements: {
        //         resetButton: '...',
        //         boardCells: {
        //             A1: element,
        //         },
        //     },
        // };

        async function init(config) {
            var {
                domElements: { resetButton, board },
                ...serviceConfig
            } = config;
            gameService.init({ ...serviceConfig, onGameOverCallback });

            _resetButtonEle = resetButton;
            _resetButtonEle.addEventListener('click', handleResetClick);

            _gameBoardEle = board;
            _gameBoardEle.addEventListener('click', handleCellClick);

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
            gameService.rematch();
            updateUI();
            hideWinningRows();
            await checkForBot();
        }

        // function adjustBoardCellButtons() {
        //     var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');
        //     // If game is over or next player is a bot, disable all cell buttons
        //     if (gameService.isGameOver || 'play' in gameService.currentPlayer) {
        //         cellButtons.forEach((button) => (button.disabled = true));
        //     }
        //     // else enable only the empty cell buttons
        //     else {
        //         var boardState = gameService.board;

        //         cellButtons.forEach((button) => {
        //             var cellID = button.dataset.cell;

        //             var isEmpty = boardState[cellID] === ' ';
        //             button.disabled = !isEmpty;
        //         });
        //     }
        // }

        function updateUI() {
            var boardState = gameService.board;
            var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');

            var shouldDisableAllButtons = gameService.isGameOver || 'play' in gameService.currentPlayer;

            cellButtons.forEach(function updateCell(button) {
                var cellID = button.dataset.cell;
                button.textContent = boardState[cellID];
                var isEmpty = boardState[cellID] === ' ';
                button.disabled = shouldDisableAllButtons || !isEmpty;
            });
        }

        async function checkForBot() {
            if (
                !gameService.isGameOver &&
                'play' in gameService.currentPlayer
            ) {
                await gameService.playTurn();
                updateUI();
                await checkForBot();
            }
        }

        function onGameOverCallback(winner, winningRow, winningCells) {
            // mark the winning row, if any
            if (winningRow) {
                var row = _gameBoardEle.querySelector(
                    `[data-row-id="${winningRow}"]`
                );
                row.classList.add('visible');
            }

            // enabled rematch button
            _resetButtonEle.disabled = false;

            // update scores and info on ui
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
            _resetButtonEle.removeEventListener('click', handleResetClick);
            _gameBoardEle.removeEventListener('click', handleCellClick);

            var cellButtons = _gameBoardEle.querySelectorAll('[data-cell]');

            cellButtons.forEach(function disableButton(button) {
                button.disabled = true;
                button.textContent = '';
            });

            hideWinningRows();
        }
    }
})();
