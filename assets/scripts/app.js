'use strict';

var App = (function hideInternals() {
    const ACTIVE_PAGE_CLASS = 'main__page-active';

    var { GameTypes } = TicTacToe;

    var events = Object.freeze({
        GAME_START: 'game-start',
    });

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
    var startButton = main.querySelector('button[data-id="start-action"]');
    var resetButton = main.querySelector('button[data-id="reset-action"]');
    var returnButton = main.querySelector('button[data-id="return-action"]');

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

        curPage.addEventListener('transitionend', function focusFirstFocusable(event) {
            if(event.target !== event.currentTarget || !firstFocusable) {
                // If the element is not firing on the page or there's no focusable,
                // do nothing.
                return;
            }

            firstFocusable.focus();

            // Remove event to prevent bubbling on multiple elements.
            curPage.removeEventListener('transitionend', focusFirstFocusable);
        });

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

        var gameController;

        startButton.addEventListener('click', function startGame(event) {
            window.dispatchEvent(new CustomEvent(GameEvents.GAME_START));

            var gameService = new GameService();
            gameController = new DOMGameController(gameService);

            gameController.init({
                ...state,
                botArtificialPlayDelayRange: [1500, 3500],
                domElements: {
                    resetButton,
                    board,
                },
            });

            
        });

        returnButton.addEventListener('click', function returnToMainMenu() {
            startButton.disabled = false;
            gameController?.cleanUp();
            changeToPage(0);
        });

        window.addEventListener(GameEvents.GAME_START, function onGameStart() {
            startButton.disabled = true;
            returnButton.disabled = true;
        });

        window.addEventListener(GameEvents.GAME_OVER, function enableMainMenuButton() {
            returnButton.disabled = false;
            resetButton.disabled = false;
        });
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
var footerYearSpan = document.querySelector('span[data-id="footer-year"]');
footerYearSpan.textContent = new Date().getFullYear();
// =====================================

App.init();
