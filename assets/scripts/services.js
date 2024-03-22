var GameService = (function hideInternals() {
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

    return GameService;

    // GameService: Responsible for overall game flow.
    function GameService() {
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

        function getPlayer(symbol) {
            return _players.find((p) => p.symbol === symbol);
        }

        function rematch() {
            _game.reset();
        }

        function init(config) {
            _config = Object.assign({}, baseConfig, config);
            _players = createPlayers(_config);
            _game = new TicTacToe.Game();
        }
    }

    // ============ INTERNALS ================

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
