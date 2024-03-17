
function Player(name, symbol) {
    this.name = name;
    this.symbol = symbol;
}

Player.prototype.clone = function() {
    var clone = Object.create(Player.prototype);
    clone.name = this.name;
    clone.symbol = this.symbol;
    return clone;
}

Player.prototype.play = async function(board) {
    // return board[0][1] or 'A1', for example
    return window.prompt('Enter play: ', '');
}

function Game(player1, player2) {
    this._board = Array(9).fill(' ');
    this._players = [player1, player2];
    this._turn = 0;
    this._isOver = false;
    this._winner = null;
    this._winningRow = null;
    this._winConditions = {
        'horizontal-top':    [0, 1, 2],
        'horizontal-center': [3, 4, 5],
        'horizontal-bottom': [6, 7, 8],
        'vertical-left':     [0, 3, 6],
        'vertical-center':   [1, 4, 7],
        'vertical-right':    [2, 5, 8],
        'diagonal-left':     [0, 4, 8],
        'diagonal-right':    [2, 4, 6],
    };
}

Object.defineProperty(Game.prototype, 'board', {
    get() {
        return Array.from(this._board);
    },
    configurable: false,
    enumerable: false,
});

Object.defineProperty(Game.prototype, 'isOver', {
    get() {
        return this._isOver;
    },
    configurable: false,
    enumerable: false,
});

Object.defineProperty(Game.prototype, 'winningRow', {
    get() {
        return this._winningRow;
    },
    configurable: false,
    enumerable: false,
});

Object.defineProperty(Game.prototype, 'winner', {
    get() {
        return this._winner ? this._winner.clone() : null;
    },
    configurable: false,
    enumerable: false,
});

Game.prototype._nextPlayer = function() {
    var nextPlayerIdx = this._turn % 2;
    this._turn++;
    return this._players[nextPlayerIdx];
}

Game.prototype.nextTurn = async function() {
    // Throws an error if game is already over
    if(this._isOver) {
        throw new Error('Game is already over.');
    }
    
    // Get next player
    var player = this._nextPlayer();

    // Keep asking the next player for a play until it receives a valid one.
    while(true) {
        var tentativePlay = await player.play(this.board);

        try {
            let index = Translator.toArrayPosition(tentativePlay);
            
            if(this._board[index] != ' ') {
                throw new Error('Invalid');
            }
    
            this._board[index] = player.symbol;

            break;
        }
        catch {
            // Send a notification warning that the play is invalid.
            console.log('Invalid play');
        }

    };

    this._checkForGameOver();
}

var Translator = {
    arrayPositionRegex: /^[0-8]$/,
    boardPositionRegex: /^[A-C][1-3]$/i,
    toArrayPosition(play) {
        if(!this.boardPositionRegex.test(play)) {
            throw new Error(
                `Unparseable play received. Received: "${play}".
                 Expected: "A1" through "C3".`
            );
        }
        var row = play[0].toUpperCase().charCodeAt(0) - 65;
        var col = Number(play[1]) - 1;
        return row * 3 + col;
    },
    toBoardPosition(play) {
        if(!this.arrayPositionRegex.test(play)) {
            throw new Error(
                `Unparseable play received. Received: "${play}".
                 Expected: 0 through 8.`
            );
        }
        var row = Math.floor(play / 3) + 65;
        var col = Number(play) % 3 + 1;
        return `${String.fromCharCode(row)}${col}`
    },
}

Game.prototype._checkForWinner = function() {
    for(let [row, positions] of Object.entries(this._winConditions)) {
        let placedSymbols = positions.map(position => this.board[position]);
        for(let player of this._players) {
            if(placedSymbols.every(symbol => symbol === player.symbol)) {
                this._winner = player;
                this._winningRow = row;
                this._isOver = true;
                return;
            }
        }
    }
}

Game.prototype._checkForTie = function() {
    if(this._board.every(pos => pos != ' ')) {
        this._isOver = true;
    }
}

Game.prototype._checkForGameOver = function() {
    // Check for win or tie
    if(this._isOver) {
        return;
    }
    this._checkForWinner();
    this._checkForTie();
}

Game.prototype.toString = function() {
    var str = '-------------\n';
    for(let i = 0;i < 3;i++) {
        console.log('hi')
        str += '| ';
        str += this._board.slice(i * 3, i * 3 + 3).join(' | ');
        str += ' |\n'
        str += '-------------\n';
    }
    return str;
}