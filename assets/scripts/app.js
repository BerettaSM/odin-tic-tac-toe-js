'use strict';

var App = (function hideInternals() {
    const ACTIVE_PAGE_CLASS = 'main__page-active';

    var { BotDifficulty, GameTypes } = TicTacToe;

    var state = {
        currentPage: 0,
        gameType: null,
        botDifficulty: null,
        P1Name: null,
        P2Name: null,
    };

    var main = document.querySelector('main.main');
    var pages = main.querySelectorAll('.main__page');

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
    var startButton = main.querySelector('button[data-id="start-action"]');

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

        pages.forEach(function removeActiveClass(page) {
            page.classList.remove(ACTIVE_PAGE_CLASS);
        });

        var page = pages[pageNumber];
        page.classList.add(ACTIVE_PAGE_CLASS);
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

            adjustNamesForm(gameType);

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
    }

    function adjustNamesForm(gameType) {
        var p2FormControl = form.querySelector('input#p2').parentElement;

        if (gameType === GameTypes.PLAYER_VS_PLAYER) {
            p2FormControl.classList.remove('hidden');
        } else {
            p2FormControl.classList.add('hidden');
        }
    }
})();

App.init();
