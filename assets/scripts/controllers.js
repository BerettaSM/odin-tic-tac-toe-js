'use strict';

var Controllers = (function hideInternals() {
    var { BotDifficulty, GameTypes } = TicTacToe;

    var baseConfig = {
        botDifficulty: BotDifficulty.EASY,
        gameType: GameTypes.PLAYER_VS_PLAYER,
        P1Name: 'Player 1',
        P2Name: 'Player 2',
        onGameOverCallback: function onGameOver(winner, winningRow) {
            if (!winner) {
                console.log('Tie!');
            } else {
                console.log(`${winner.name} won!`);
                console.log(`Victory at ${winningRow}`);
            }
        },
    };

    var publicAPI = {
        GameController,
        BasicUIController,
        GameTypes,
    };

    return Object.freeze(publicAPI);

    // =====================================

    function createPlayers({ botDifficulty, gameType, P1Name, P2Name }) {
        var { Player, Bot } = TicTacToe;

        var players;

        switch (gameType) {
            case GameTypes.PLAYER_VS_PLAYER:
                players = [new Player(P1Name, 'X'), new Player(P2Name, 'O')];
                break;

            case GameTypes.PLAYER_VS_BOT:
                players = [
                    new Player(P1Name, 'X'),
                    new Bot('Bot McBotFace', 'O', botDifficulty),
                ];
                break;

            case GameTypes.BOT_VS_BOT:
                players = [
                    new Bot('Bot McBotFace', 'X', botDifficulty),
                    new Bot('Another Bot', 'O', botDifficulty),
                ];
                break;

            default:
                throw new Error(`Unknown game gameType: "${gameType}."`);
        }

        return players;
    }

    // GameController: Responsible for overall game flow.
    function GameController() {
        var _config = null;
        var _game = null;
        var _players = null;
        var _scores = { X: 0, O: 0 };

        var instance = {
            playTurn,
            rematch,
            init,
        };

        Object.defineProperties(instance, {
            board: {
                get() {
                    // TODO: Make a mapping function
                    //       to ease access to board cells
                    //       from outside.
                    return _game.board;
                },
            },
            currentPlayer: {
                get() {
                    return Utils.clone(getPlayer(_game.currentSymbol));
                },
            },
            isGameOver: {
                get() {
                    return _game.isOver;
                },
            },
            players: {
                get() {
                    return _players.map(Utils.clone);
                },
            },
            scores: {
                get() {
                    return Object.assign({}, _scores);
                },
            },
            winner: {
                get() {
                    return _game.winner
                        ? Utils.clone(
                              _players.find((p) => p.symbol === _game.winner)
                          )
                        : null;
                },
            },
            winningRow: {
                get() {
                    return _game.winningRow;
                },
            },
        });

        return Utils.createInitProxy(instance);

        // =====================================

        function playTurn(tentativePlay) {
            var player = getPlayer(_game.currentSymbol);

            if ('play' in player) {
                // Player is actually a bot, wait for him to play.
                // This will possibly be async in the future,
                // to add delays to bot answers.
                let botPlay = player.play([..._game.board]);
                _game.placeAtPosition(botPlay);
            } else {
                // Just use the provided tentativePlay.
                _game.placeAtPosition(tentativePlay);
            }

            if (_game.isOver) {
                var winner = _players.find((p) => p.symbol === _game.winner);

                if (winner) {
                    _scores[winner.symbol]++;
                }

                _config.onGameOverCallback(winner, _game.winningRow);
            }
        }

        function rematch() {
            _game.reset();
        }

        function init(config) {
            _config = Object.assign({}, baseConfig, config);
            _players = createPlayers(_config);
            _game = new TicTacToe.Game();
        }

        // ============ INTERNALS ================

        function getPlayer(symbol) {
            return _players.find((p) => p.symbol === symbol);
        }
    }

    // Controls a basic game in browser console.
    function BasicUIController(gameController) {
        var instance = {
            init,
        };

        return Utils.createInitProxy(instance);

        // =====================================

        function init() {
            // Warn the player the game will be played through the browser console
            window.alert(
                'This TicTacToe game will be played through the browser console.\n\n' +
                    'Press CTRL + SHIFT + J on Google Chrome.\n' +
                    'Press CTRL + SHIFT + I on Firefox.\n\n' +
                    'Alternatively, search for the console option on settings.'
            );

            // Collect options: players names, game type, bot difficulty
            var config = collectConfig();

            // init the game controller with configs
            gameController.init(config);

            var replay;

            do {
                let tentativePlay;

                while (!gameController.isGameOver) {
                    printGame();

                    if (!('play' in gameController.currentPlayer)) {
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
                        gameController.playTurn(tentativePlay);
                    } catch (e) {
                        if (e instanceof Error && e.name === 'TicTacToeError') {
                            window.alert(e.message);
                        }
                    }
                }

                // Announce the winner and any errors
                printGame();

                gameController.rematch();

                // ask if player wants to play again, then loop back.
                replay = askForInput(
                    'Would you like to play again? (yes/no): '
                ).toLowerCase()[0];
            } while (replay !== 'n');

            console.log('Thanks for playing! :)');
        }

        // ============ INTERNALS ================

        function printGame() {
            console.clear();
            var str = '========== Tic Tac Toe ==========\n';

            str += '\n -- SCORES --\n\n';

            for (let { name, symbol } of gameController.players) {
                str += `${name} ( ${symbol} ): ${gameController.scores[symbol]} points\n`;
            }

            str += '\n  -------------\n';
            for (let i = 0; i < 3; i++) {
                str += String.fromCharCode(i + 65);
                str += ' | ';
                str += gameController.board.slice(i * 3, i * 3 + 3).join(' | ');
                str += ' |\n';
                str += '  -------------\n';
            }
            str += '    1   2   3\n\n';

            if (gameController.isGameOver) {
                let { winner, winningRow } = gameController;

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
    }
})();
