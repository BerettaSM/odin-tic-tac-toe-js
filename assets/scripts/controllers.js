'use strict';

var Controllers = (function hideInternals() {
    var GameTypes = {
        PLAYER_VS_PLAYER: 'PLAYER_VS_PLAYER',
        PLAYER_VS_BOT: 'PLAYER_VS_BOT',
        BOT_VS_BOT: 'BOT_VS_BOT',
    };

    var { BotDifficulty } = TicTacToe;

    var baseConfig = {
        type: GameTypes.PLAYER_VS_PLAYER,
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        difficulty: BotDifficulty.EASY,
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

        var instance = {
            nextTurn,
            rematch,
        };

        Object.defineProperties(instance, {
            board: {
                get() {
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
        });

        return instance;

        // =====================================

        function nextTurn(tentativePlay) {
            try {
                _game.placeAtPosition(tentativePlay);

                if (_game.isOver) {
                    var winner = _players.find(
                        (p) => p.symbol === _game.winner
                    );

                    winner && winner.score++;

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

    return publicAPI;

    // =====================================

    function createPlayers(config) {
        var { type, player1Name, player2Name, difficulty } = config;
        var { Player, Bot } = TicTacToe;

        var players;

        switch (type) {
            case GameTypes.PLAYER_VS_PLAYER:
                players = [
                    new Player(player1Name, 'X'),
                    new Player(player2Name, 'O'),
                ];
                break;

            case GameTypes.PLAYER_VS_BOT:
                players = [
                    new Player(player1Name, 'X'),
                    new Bot('Bot McBotFace', 'O', difficulty),
                ];
                break;

            case GameTypes.BOT_VS_BOT:
                players = [
                    new Bot('Bot McBotFace', 'X', difficulty),
                    new Bot('Another Bot', 'O', difficulty),
                ];
                break;

            default:
                throw new Error(`Unknown game type: "${type}."`);
        }

        return players;
    }
})();
