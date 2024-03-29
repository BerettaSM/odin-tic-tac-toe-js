'use strict';

var App = (function hideInternals() {
    const ACTIVE_PAGE_CLASS = 'main__page-active';

    var { GameTypes } = TicTacToe;

    var state = {
        currentPage: 0,
        gameType: null,
        botDifficulty: null,
        P1Name: null,
        P2Name: null,
    };

    var main = document.querySelector('main.main');
    var pages = main.querySelectorAll('.main__page');

    for (let i = 0; i < pages.length; i++) {
        pages[i].style.setProperty('--i', i);
    }

    // Main page
    var playDomMatchButton = main.querySelector('[data-id="play-dom-match"]');
    var playConsoleMatchButton = main.querySelector(
        '[data-id="play-console-match"]'
    );

    // Game type page
    var typesMenu = main.querySelector('menu[data-id="game-type"]');

    // Bot difficulty page
    var botDifficultyMenu = main.querySelector(
        'menu[data-id="bot-difficulty"]'
    );

    // Names form page
    var form = main.querySelector('form.form');

    // Board page
    var board = main.querySelector('[data-id="board"]');
    var scoreBoard = main.querySelector('.game-score');
    var startButton = main.querySelector('button[data-id="start-action"]');
    var resetButton = main.querySelector('button[data-id="reset-action"]');
    var returnButton = main.querySelector('button[data-id="return-action"]');

    // Symbols
    var xSymbolSvg = document
        .querySelector('template[data-id="symbol-x-template"]')
        .content.cloneNode(true).children[0];
    var oSymbolSvg = document
        .querySelector('template[data-id="symbol-o-template"]')
        .content.cloneNode(true).children[0];

    var publicAPI = {
        init,
    };

    return Utils.createInitProxy(publicAPI);

    // =====================================

    function init() {
        changeToPage(0);
        setupListeners();
        populateFormLabels();
    }

    // =========== INTERNALS ===============

    function changeToPage(pageNumber) {
        if (pageNumber < 0 || pageNumber >= pages.length) {
            throw new Error(`Page number ${pageNumber} does not exist.`);
        }

        var prevPage = pages[state.currentPage];
        prevPage.classList.remove(ACTIVE_PAGE_CLASS);

        // Make the previous page invisible to screen readers
        prevPage.setAttribute('aria-hidden', true);

        // disable buttons and inputs to prevent focus.
        prevPage.querySelectorAll('input, button').forEach((element) => {
            element.disabled = true;
        });

        var curPage = pages[pageNumber];
        curPage.classList.add(ACTIVE_PAGE_CLASS);

        // Make the current page visible to screen readers
        curPage.setAttribute('aria-hidden', false);

        // Enable all inputs and buttons that should be enabled.
        curPage
            .querySelectorAll('[data-default-enabled]')
            .forEach((element) => {
                element.disabled = false;
            });

        // Change the css index variable that causes the slide-in transition.
        pages.forEach((page, index) => {
            var transformIndex = index - pageNumber;
            page.style.setProperty('--i', transformIndex);
        });

        var firstFocusable = curPage.querySelector('[data-default-focus]');

        curPage.addEventListener(
            'transitionend',
            function focusFirstFocusable(event) {
                if (event.target !== event.currentTarget || !firstFocusable) {
                    // If the element is not firing on the page or there's no focusable,
                    // do nothing.
                    return;
                }

                firstFocusable.focus();

                // Remove event to prevent bubbling on multiple elements.
                curPage.removeEventListener(
                    'transitionend',
                    focusFirstFocusable
                );
            }
        );

        state.currentPage = pageNumber;
    }

    function populateFormLabels() {
        var labels = form.querySelectorAll('.form__control label');

        labels.forEach(function splitLabelIntoSpans(label) {
            var frag = document.createDocumentFragment();

            for (let i in label.textContent) {
                var char = label.textContent[i];
                let span = document.createElement('span');
                span.classList.add('letter');
                span.style.setProperty('--i', i);
                span.textContent = char;
                frag.appendChild(span);
            }

            label.textContent = '';
            label.appendChild(frag);
        });
    }

    function setupListeners() {
        var displayHowToPlayMessage = false;

        playConsoleMatchButton.addEventListener(
            'click',
            async function startConsoleMatch() {
                if (!displayHowToPlayMessage) {
                    window.alert(
                        'This TicTacToe game will be played through the browser console.\n' +
                            'Make sure to have it open the next time you click the play button.\n\n' +
                            'Press CTRL + SHIFT + J on Google Chrome.\n' +
                            'Press CTRL + SHIFT + I on Firefox.\n\n' +
                            'Alternatively, search for the console option on settings.'
                    );
                    displayHowToPlayMessage = true;
                    return;
                }

                playConsoleMatchButton.disabled = true;
                playDomMatchButton.disabled = true;
                playConsoleMatchButton.querySelector(
                    '.pushable__label'
                ).textContent = 'Ongoing match on console...';

                try {
                    await Utils.sleep(500);
                    var consoleController = new ConsoleGameController(
                        new GameService()
                    );
                    await consoleController.init();
                } catch (e) {
                    if (!(e instanceof Error && e.message === 'cancelled')) {
                        throw e;
                    }
                } finally {
                    playConsoleMatchButton.disabled = false;
                    playDomMatchButton.disabled = false;
                    playConsoleMatchButton.querySelector(
                        '.pushable__label'
                    ).textContent = 'Play a match (browser console)';
                }

                console.clear();
                console.log('Thanks for playing! :)');
            }
        );

        playDomMatchButton.addEventListener(
            'click',
            function moveToSecondPage() {
                changeToPage(1);
            }
        );

        typesMenu.addEventListener('click', function selectGameType(event) {
            var button = event.target.closest('button[data-id]');
            if (!button) {
                // Click didn't occur on a button.
                return;
            }

            var gameType = button.dataset.id;
            state.gameType = gameType;

            adjustNamesForm();

            if (gameType !== GameTypes.PLAYER_VS_PLAYER) {
                changeToPage(2);
            } else {
                changeToPage(3);
            }
        });

        botDifficultyMenu.addEventListener(
            'click',
            function selectBotDifficulty(event) {
                var button = event.target.closest('button[data-id]');
                if (!button) {
                    // Click didn't occur on a button.
                    return;
                }

                var botDifficulty = button.dataset.id;
                state.botDifficulty = botDifficulty;

                if (state.gameType !== GameTypes.BOT_VS_BOT) {
                    changeToPage(3);
                } else {
                    changeToPage(4);
                }
            }
        );

        form.addEventListener('submit', function collectNames(event) {
            event.preventDefault();

            var names = new FormData(event.target);
            var P1Name = names.get('p1')?.trim() || 'Player ( X )';
            var P2Name = names.get('p2')?.trim() || 'Player ( O )';

            state.P1Name = P1Name;
            state.P2Name = P2Name;

            changeToPage(4);
        });

        var gameService;
        var gameController;

        startButton.addEventListener('click', function startGame() {
            startButton.disabled = true;
            startButton.classList.add('hidden');
            resetButton.classList.remove('hidden');

            gameService = new GameService();
            gameController = new DOMGameController(gameService);

            gameController.init({
                ...state,
                botArtificialPlayDelayRange: [1500, 3500],
                domElements: {
                    resetButton,
                    board,
                    xSymbol: xSymbolSvg,
                    oSymbol: oSymbolSvg,
                },
            });

            window.dispatchEvent(new CustomEvent(GameEvents.GAME_START));

            gameService.players.forEach(function updatePlayerOnUI(player) {
                var { name, symbol } = player;
                var pInfo = scoreBoard.querySelector(
                    `[data-psymbol="${symbol}"]`
                );
                var pName = name.includes(`( ${symbol} )`)
                    ? name
                    : `${name} ( ${symbol} )`;
                pInfo.querySelector('.name').textContent = pName;
                pInfo.querySelector('.score').textContent = '0';
            });

            scoreBoard.classList.add('visible');
        });

        returnButton.addEventListener('click', function returnToMainMenu() {
            startButton.disabled = false;
            startButton.classList.remove('hidden');
            resetButton.classList.add('hidden');
            resetButton.querySelector('.pushable__label').textContent =
                'Rematch';
            scoreBoard.classList.remove('visible');
            gameController?.cleanUp();
            changeToPage(0);
        });

        window.addEventListener(GameEvents.GAME_START, function onGameStart() {
            resetButton.disabled = true;
            resetButton.querySelector('.pushable__label').textContent =
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
        });

        window.addEventListener(
            GameEvents.GAME_OVER,
            function updateUiSections(event) {
                var { winner, newScore } = event.detail;

                resetButton.disabled = false;
                resetButton.querySelector('.pushable__label').textContent =
                    'Rematch';

                if (winner) {
                    scoreBoard.querySelector(
                        `[data-psymbol="${winner.symbol}"] .score`
                    ).textContent = newScore;
                }
            }
        );

        window.addEventListener(
            GameEvents.GAME_NEW_TURN,
            function updateActivePlayer(event) {
                var { symbol } = event.detail;

                for (let pInfo of scoreBoard.querySelectorAll(
                    '.game-score__player'
                )) {
                    pInfo.classList.remove('current');
                }

                scoreBoard
                    .querySelector(`[data-psymbol="${symbol}"]`)
                    .classList.add('current');
            }
        );
    }

    function adjustNamesForm() {
        var p2NameInput = form.querySelector('input#p2');
        var p2FormControl = p2NameInput.parentElement;

        if (state.gameType === GameTypes.PLAYER_VS_PLAYER) {
            p2NameInput.setAttribute('data-default-enabled', '');
            p2FormControl.classList.remove('hidden');
        } else {
            p2NameInput.removeAttribute('data-default-enabled');
            p2FormControl.classList.add('hidden');
        }
    }
})();

// =====================================
{
    let footerYearSpan = document.querySelector('span[data-id="footer-year"]');
    footerYearSpan.textContent = new Date().getFullYear();

    if (Utils.hasTouchSupport()) {
        // If on mobile, disable the console play option,
        // since its unlikely the user will even be able to play
        // that way.
        let button = document.querySelector('[data-id="play-console-match"]');
        button.disabled = true;
        button.style.display = 'none';
    }
}
// =====================================

App.init();
