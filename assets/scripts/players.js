function Player(name, symbol) {
    this.name = name;
    this.symbol = symbol;
}

Player.prototype.clone = function () {
    var thisPrototype = Object.getPrototypeOf(this);
    var clone = Object.create(thisPrototype);
    clone.name = this.name;
    clone.symbol = this.symbol;
    return clone;
};

Player.prototype.play = async function (board) {
    // return board[0][1] or 'A1', for example
    return window.prompt('Enter play: ', '');
};

// function Bot(name, symbol) {
//     Player.call(this, name, symbol)
// }

// Bot.prototype = Object.create(Player.prototype)

// Bot.prototype.constructor = Bot;

