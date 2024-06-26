'use strict';

var GameService = (function hideInternals() {
    var { BotDifficulty, GameTypes } = TicTacToe;

    var baseConfig = {
        botDifficulty: BotDifficulty.EASY,
        botArtificialPlayDelayRange: null, // [ 1500, 3500 ] -> In ms, pick random value inside range.
        gameType: GameTypes.PLAYER_VS_PLAYER,
        P1Name: 'Player 1',
        P2Name: 'Player 2',
        eventTarget: document.createElement('div'), // Just a dummy event target in case one was not passed in.
    };

    return GameService;

    // =======================================

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
                    return mapBoardToCells(_game.board);
                },
            },
            currentPlayer: {
                get() {
                    return Utils.clone(
                        getPlayer(_players, _game.currentSymbol)
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

        async function playTurn(tentativePlay, signal) {
            var player = getPlayer(_players, _game.currentSymbol);

            if ('play' in player) {
                // Player is actually a bot, wait for him to play.
                tentativePlay = player.play([..._game.board]);

                // Artificial wait, as to convey that the bot is thinking.
                await handleArtificialBotDelay(player);

                // If signal.cancelled was set to true,
                // a cleanup function was called and we
                // throw an error to stop bot from playing.
                if(signal.cancelled) {
                    throw new Error('cancelled');
                }
            }

            _game.placeAtPosition(tentativePlay);

            if (_game.isOver) {
                let winner = getPlayer(_players, _game.winner);

                if (winner) {
                    _scores[winner.symbol]++;
                }

                let winningCells = _game.winningRow
                    ? TicTacToe.scoringRows[_game.winningRow].map(
                          TicTacToe.parseToBoardPosition
                      )
                    : null;

                dispatchEvent(GameEvents.GAME_OVER, {
                    winner,
                    winningRow: _game.winningRow,
                    winningCells,
                    newScore: _scores[winner?.symbol],
                });
            }

            var nextPlayer = getPlayer(_players, _game.currentSymbol);

            dispatchEvent(GameEvents.GAME_NEW_TURN, {
                player: nextPlayer.name,
                symbol: nextPlayer.symbol,
            });
        }

        function rematch() {
            _game.reset();
            dispatchEvent(GameEvents.GAME_START);
        }

        function init(config) {
            _config = Object.assign({}, baseConfig, config);
            _players = createPlayers(_config);
            _game = new TicTacToe.Game();
        }

        // =======================================

        async function handleArtificialBotDelay(bot) {
            let [min, max] = _config.botArtificialPlayDelayRange;
            let timeout = Utils.getRandomNumber(min, max);

            dispatchEvent(GameEvents.BOT_DELAY_START, {
                name: bot.name,
                symbol: bot.symbol,
                delay: timeout,
            });

            await Utils.sleep(timeout);

            dispatchEvent(GameEvents.BOT_DELAY_END, {
                name: bot.name,
                symbol: bot.symbol,
            });
        }

        function dispatchEvent(eventType, payload = {}) {
            _config.eventTarget.dispatchEvent(
                new CustomEvent(eventType, {
                    detail: payload,
                }));
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

    function getPlayer(players, symbol) {
        return players.find((p) => p.symbol === symbol);
    }

    function mapBoardToCells(board) {
        var { parseToBoardPosition } = TicTacToe;

        return board.reduce((state, value, index) => {
            state[parseToBoardPosition(index)] = value;
            return state;
        }, {});
    }
})();
