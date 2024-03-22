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
        onInvalidPlayCallback: function onInvalidPlay(position, motive) {
            console.log(`Invalid play at position ${position}.`);
            console.log(`Motive: ${motive}`);
        },
    };

    // GameController: Responsible for overall game flow.
    function GameController() {
        var initiated = false;
        var _config = null;
        var _game = null;
        var _players = null;
        var _scores = { X: 0, O: 0 };

        var instance = {
            nextTurn,
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
                    return Utils.clone(
                        _players.find((p) => p.symbol === _game.currentSymbol)
                    );
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
        });

        return new Proxy(instance, {
            get: function(target, prop) {
                if(!initiated && prop !== 'init') {
                    throw new Error('You must initiate the game by calling .init().');
                }
                return target[prop];
            },
        });

        // =====================================

        function nextTurn(tentativePlay) {
            if(!initiated) {
                throw new Error('You must initiate the controller by calling .init().')
            }

            try {
                _game.placeAtPosition(tentativePlay);

                if (_game.isOver) {
                    var winner = _players.find(
                        (p) => p.symbol === _game.winner
                    );

                    if (winner) {
                        _scores[winner.symbol]++;
                    }

                    _config.onGameOverCallback(winner, _game.winningRow);
                }
            } catch (e) {
                if (e instanceof Error && e.name === 'TicTacToeError') {
                    _config.onInvalidPlayCallback(tentativePlay, e.message);
                }
                throw e;
            }
        }

        function rematch() {
            _game.reset();
        }

        function init(config) {
            if(initiated) {
                throw new Error('Cannot initiate the controller again.');
            }
            initiated = true;
            _config = Object.assign({}, baseConfig, config);
            _players = createPlayers(_config);
            _game = new TicTacToe.Game();
        }
    }

    // Controls a basic game in browser console.
    function BasicUIController(gameController) {

        var instance = {};

        return instance;

        // =====================================


    }

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
})();
