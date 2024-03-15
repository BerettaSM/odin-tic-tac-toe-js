
function Player(name, symbol) {
    this.name = name;
    this.symbol = symbol;
}

Player.prototype.play = function(board) {
    // return board[0][1] or 'A1', for example
}

function Game(player1, player2) {
    this._board = Array(9).fill(' ');
    this._players = [player1, player2];
    this._turn = -1;
    this._isOver = false;
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

Game.prototype._nextPlayer = function() {
    this._turn++;
    var nextPlayerIdx = this._turn % 2;
    return this._players[nextPlayerIdx];
}

Game.prototype.nextTurn = function() {
    // Throws an error if game is already over
    if(this.isOver) {
        throw new Error('Game is already over.');
    }
    
    // Get next player
    var player = this._nextPlayer();

    // Keep asking the next player for a play until it receives a valid one.
    let play;

    do {
        play = player.play();
    } while(!this._validatePlay(play));

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

Game.prototype._validatePlay = function(play) {
    try {
        var index = Translator.toArrayPosition(play);
        
        if(this._board[index] != ' ') {
            throw new Error('Invalid');
        }

        return true;
    }
    catch {
        return false;
    }
}

Game.prototype.checkForWin = function() {
    // either returns null, the winner,
    // or some special character to symbolize ties
}

// Player
//    -> symbol (X, O)
//    -> play(boardState) -> boardPosition
// Game
//    -> 2 players
//    -> board
//    -> player turn
//    -> ask for play
//    -> validate play
//    -> check for win
