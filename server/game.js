var Card = function(color, number) {
	this.color = color;
	this.number = number;
	this.status = false;
}
var Game = function() {
	this.cards = new Array();
	this.player = {};
	this.system = new Array();
	this.start = true;
	this.last = -1;
}
Game.prototype = {
	init: function(player1, player2) {
		this.first = player1;
		for (var i = 0; i < 13; i++) {
			this.cards.push(new Card(true, i));
			this.cards.push(new Card(false, i));
		}
		this.shuffle();
		this.player[player1] = new Array();
		this.player[player2] = new Array();
		for (var i in this.cards) {
			if (this.cards[i].color) {
				if (this.player[player1].length < 2) {
					this.player[player1].push(i);
				} else if (this.player[player2].length < 2) {
					this.player[player2].push(i);
				} else {
					this.system.push(i);
				}
			}
		}
		for (var i in this.cards) {
			if (!this.cards[i].color) {
				if (this.player[player1].length < 4) {
					this.player[player1].push(i);
				} else if (this.player[player2].length < 4) {
					this.player[player2].push(i);
				} else {
					this.system.push(i);
				}
			}
		}
		that = this;
		this.player[player1].sort(function(a, b) {
			var ca = that.cards[a];
			var cb = that.cards[b];
			return ca.number == cb.number ? cb.color - ca.color : cb.number - ca.number;
		});
		this.player[player2].sort(function(a, b) {
			var ca = that.cards[a];
			var cb = that.cards[b];
			return ca.number == cb.number ? cb.color - ca.color : cb.number - ca.number;
		});
	},
	shuffle: function() {
		for (var i = this.cards.length - 1; i >= 0; i--) {
			var j = parseInt(Math.random() * i);
			var tp = this.cards[i];
			this.cards[i] = this.cards[j];
			this.cards[j] = tp;
			this.cards[i].id = i;
		}
	}
}
module.exports = Game;