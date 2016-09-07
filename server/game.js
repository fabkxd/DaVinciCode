var Card = function(color, number) {
	this.color = color;
	this.number = number;
}
var Game = function() {
	this.player = {};
	this.system = new Array();
	this.status = false;
}
Game.prototype = {
	init: function(player1, player2) {
		var cards = new Array();
		for (var i = 0; i < 13; i++) {
			cards.push(new Card(true, i));
			cards.push(new Card(false, i));
		}
		console.log(cards);
		cards = this.shuffle(cards);
		console.log(cards);
		this.player[player1] = new Array();
		this.player[player2] = new Array();
		for (var card in cards) {
			if (card.color) {
				if (this.player[player1].length < 2) {
					this.player[player1].push(card);
				} else if (this.player[player2].length < 2) {
					this.player[player2].push(card);
				} else {
					this.system.push(card);
				}
			}
		}
		for (var card in cards) {
			if (!card.color) {
				if (this.player[player1].length < 4) {
					this.player[player1].push(card);
				} else if (this.player[player2].length < 4) {
					this.player[player2].push(card);
				} else {
					this.system.push(card);
				}
			}
		}
		this.player[player1].sort(this.sortOrder);
		this.player[player2].sort(this.sortOrder);
	},
	shuffle: function(cards) {
		for (var i = cards.length - 1; i > 0; i--) {
			var j = parseInt(Math.random() * i);
			var tp = cards[i];
			cards[i] = cards[j];
			cards[j] = tp;
			cards[i].id = i;
		}
	},
	sortOrder: function(a, b) {
		return a.number == b.number ? b.color - a.color : b.number - a.number;
	}
}
module.exports = Game;