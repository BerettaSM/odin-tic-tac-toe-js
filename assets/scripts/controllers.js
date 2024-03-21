'use strict';

var Controllers = (function hideInternals() {
    const GameTypes = Object.freeze({
        PLAYER_VS_PLAYER: 'PLAYER_VS_PLAYER',
        PLAYER_VS_BOT: 'PLAYER_VS_BOT',
        BOT_VS_BOT: 'BOT_VS_BOT',
    });

    var { BotDifficulty } = TicTacToe;

    var baseConfig = {
        gameType: GameTypes.PLAYER_VS_PLAYER,
        P1Name: 'Player 1',
        P2Name: 'Player 2',
        botDifficulty: BotDifficulty.EASY,
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
    function GameController(config = {}) {
        config = Object.assign({}, baseConfig, config);

        var _game = new TicTacToe.Game();
        var _players = createPlayers(config);
        var _scores = { X: 0, O: 0 };

        var instance = {
            nextTurn,
            rematch,
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

        return Object.freeze(instance);

        // =====================================

        function nextTurn(tentativePlay) {
            try {
                _game.placeAtPosition(tentativePlay);

                if (_game.isOver) {
                    var winner = _players.find(
                        (p) => p.symbol === _game.winner
                    );

                    if(winner) {
                        _scores[winner.symbol]++;
                    }

                    config.onGameOverCallback(winner, _game.winningRow);
                }
            } catch (e) {
                if (e instanceof Error && e.name === 'TicTacToeError') {
                    config.onInvalidPlayCallback(tentativePlay, e.message);
                }
                throw e;
            }
        }

        function rematch() {
            _game.reset();
        }
    }

    // Controls a basic game in browser console.
    function BasicUIController() {}

    var publicAPI = {
        GameController,
        BasicUIController,
        GameTypes,
    };

    return Object.freeze(publicAPI);

    // =====================================

    function createPlayers(config) {
        var { gameType, P1Name, P2Name, botDifficulty } = config;
        var { Player, Bot } = TicTacToe;

        var players;

        switch (gameType) {
            case GameTypes.PLAYER_VS_PLAYER:
                players = [
                    new Player(P1Name, 'X'),
                    new Player(P2Name, 'O'),
                ];
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
