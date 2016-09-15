var PlaySocket = function() {
    this.socket = null;
    this.username = $('span#username').text();
    this.target = $('span#target').text();
    this.message_num = 1;
    this.game = null;
    this.stage = -1;
    this.func_card = 0;
    this.selected_syst = null;
    this.selected_oppo = null;
    this.last = -1;
};
PlaySocket.prototype = {
    ready: function() {
        var that = this;
        $(document).keypress(function(event) {
            var e = event || window.event;
            var k = e.keyCode || e.which;
            var textarea = $("textarea#play_chat_text");
            if (k == 13 && textarea.is(":focus")) {
                if (textarea.val().length > 0) {
                    that.message('message_mine', textarea.val());
                    that.socket.emit('play_message', textarea.val());
                    textarea.val('');
                }
                return false;
            }
        })
        this.socket = io.connect();
        this.socket.on('connect', function() {
        	that.socket.emit('play_ready', that.username, that.target);
        });
    	this.socket.on('connetion_break', function() {
		    $('textarea#play_chat_text').attr('disabled', true);
            $('span#target_info').text('is offline');
            $('button#play_button').attr('disabled', true);
            $('button.card').unbind();
            $("button.card").removeAttr("onclick");
            that.message('message_syst', that.target + ' is disconnected!');
		});
        this.socket.on('play_message', function(type, content) {
            that.message(type, content);
            if (type == 'message_syst' && content.indexOf('true') != -1) {
                var card = $('button#' + that.selected_oppo);
                card.removeClass('back');
                that.game.cards[card.attr('id').split('_')[1]].status = true;
                if (that.win(false)) {
                    that.stage = 4;
                    that.message('message_syst', that.target + ' has won the game!');
                    $('div#play_info').html('<span>YOU LOST! </span>Click OK to restart.');
                    $('button#play_button').text('OK');
                    $('button#play_button').attr('disabled', false);
                }
            }
        });
        this.socket.on('play_game', function(game) {
            that.game = game;
            if (that.game.start) {
                that.stage = 0;
                $('span#target_info').text('is online');
                $('textarea#play_chat_text').attr('disabled', false);
                var mine = game.player[that.username];
                for (var i in mine) {
                    if (game.cards[mine[i]].number == 12) {
                        if (game.cards[mine[i]].color) {
                            that.func_card += 1;
                        } else {
                            that.func_card += 2;
                        }
                    }
                }
                if (game.first != that.username) {
                    that.displayGame();
                    $('div#play_info').html('Please wait your opponent\'s operation.');
                    that.game.start = false;
                    return;
                }
            }
            that.playGame();
        });
        this.socket.on('click_card', function(selected, type) {
            if (type == 'syst') {
                that.clickSyst(selected.id, selected.style, false);
            } else if (type == 'oppo') {
                that.clickOppo(selected, false);
            }
        });
    },
    message: function(type, content) {
    	var chat_box = $("div#play_chat_box");
        chat_box.append('<div><div class="play_chat_message ' + type + '">' + content + '</div></div>');
        chat_box.scrollTop(600 + 300 * (this.message_num++));
    },
    displayGame: function() {
        var html = '';
        var cards = this.game.cards;
        var oppo = this.game.player[this.target];
        for (var i in oppo) {
            html += this.game.start ? '' : this.getHtml(cards[oppo[i]], 'oppo');
        }
        $('div#card_oppo').html(html);

        var syst = this.game.system;
        html = '';
        var html2 = '';
        for (var i in syst) {
            var html0 = this.getHtml(cards[syst[i]], 'syst');
            if (cards[syst[i]].color) {
                html += html0;
            }
            else {
                html2 += html0;
            }
        }
        $('div#card_syst1').html(html);
        $('div#card_syst2').html(html2);

        html = '';
        var mine = this.game.player[this.username];
        for (var i in mine) {
            html += this.getHtml(cards[mine[i]], 'mine');
        }
        $('div#card_mine').html(html);
    },
    getHtml: function(card, type) {
        var html = '<button class="card btn btn-hg btn-block';
        if (card.color) {
            html += ' btn-default';
        }
        else {
            html += ' btn-inverse';
        }
        if (!card.status) {
            html += ' back';
        }
        html += '" id="card_' + card.id + '">';
        if (card.status || type == 'mine') {
            html += card.number < 12 ? card.number : '-';   
        }
        html += '</button>';
        return html;
    },
    playGame: function() {
        if (this.stage == 0) {
            this.displayGame();
            if (this.func_card == 0) {
                if (this.last != -1) {
                    this.game.last = this.last;
                    $('div#card_mine>button#card_' + this.last).css('border', '8px solid #3498db');
                }
                this.stage = 1;
                $('button#play_button').text('END');
                $('button#play_button').attr('disabled', false);
                $('div#play_info').html('Please check your cards and press END to end your turn.');
            } else if (this.func_card % 2 == 1) {
                $('div#play_info').html('Please select where to place your white functional card.');
                this.showFuncChoice();
                this.func_card -= 1;
            } else {
                $('div#play_info').html('Please select where to place your black functional card.');
                this.showFuncChoice();
                this.func_card -= 2;
            }
        } else if (this.stage == 1) {
            if (this.game.system.length == 0) {
                this.stage = 3;
                this.playGame();
            }
            this.displayGame();
            if (this.game.last != -1) {
                $('div#card_oppo>button.card#card_' + this.game.last).css('border', '8px solid #3498db');
            }
            this.selected_syst = null;
            $('div#play_info').html('Please pick a card on the deck and press OK to confirm.');
            $('button#play_button').text('OK');
            var that = this;
            $('div#card_syst1>button.card').bind('click', function(e) {
                that.clickSyst($(e.target).attr('id'), 'btn-default', true);
            });
            $('div#card_syst2>button.card').bind('click', function(e) {
                that.clickSyst($(e.target).attr('id'), 'btn-inverse', true);
            });
        } else if (this.stage == 2) {
            $('div#play_info').html('Please pick a card of your opponent\'s and press OK to confirm.');
            var that = this;
            $('div#card_oppo>button.card').bind('click', function(e) {
                that.clickOppo($(e.target).attr('id'), true);
            });
        } else if (this.stage == 3) {
            var ind_oppo = this.selected_oppo.split('_')[1];
            var ind_syst = this.selected_syst == null ? null : this.selected_syst.id.split('_')[1];
            var card_oppo = this.game.cards[ind_oppo];
            var card_syst = ind_syst == null ? null : this.game.cards[ind_syst];
            var guess = -1;
            while (true) {
                var input = prompt('Please guess the number of your chosen card, 0-12, 12 for the functional card.', 0);
                guess = parseInt(input);
                if (!isNaN(guess) && guess >= 0 && guess <= 12) {
                    break;
                }
            }
            var right = card_oppo.number == guess;
            var info = this.username + ' guess ' + (card_oppo.color ? 'white ' : 'black ') + guess + ' and it\'s ' + right + '!';
            this.message('message_syst', info);
            this.socket.emit('guess', guess, card_oppo.color, right);
            if (right) {
                card_oppo.status = true;
                $('button#' + this.selected_oppo).text(guess == 12 ? '-' : guess);
                if (this.win(true)) {
                    this.stage = 4;
                    this.playGame();
                    return;
                } else if (confirm('You are right and are you going to go on guessing?')) {
                    this.stage = 2;
                    this.playGame();
                    return;
                }
            } else if (card_syst != null) {
                card_syst.status = true;
            }
            if (card_syst != null) {
                this.insertCard(card_syst);
            }
        } else if (this.stage == 4) {
            $('div#play_info').html('<span>YOU WIN! </span>Click OK to restart.');
            this.message('message_syst', this.username + ' has won the game!');
            $('button#play_button').text('OK');
            $('button#play_button').attr('disabled', false);
        }
    },
    showFuncChoice: function(card) {
        card = card == null ? -1 : card.id;
        var cards = this.game.cards;
        var mine = this.game.player[this.username];
        var html = '<button class="card btn btn-hg btn-primary btn-block back" onclick="play_socket.confirmInsertion(' + card + ', -1)"></button>';
        var st = this.stage == 0 ? (this.func_card == 3 ? 2 : 1) : 0;
        for (var i = st; i < mine.length; i++) {
            html += this.getHtml(cards[mine[i]], 'mine');
            html += '<button class="card btn btn-hg btn-primary btn-block back" onclick="play_socket.confirmInsertion(' + card + ', ' + mine[i] +')"></button>';
        }
        $('div#card_mine').html(html);   
    },
    confirmInsertion: function(card, ind) {
        var mine = this.game.player[this.username];
        var arr = new Array();
        var st = this.stage == 0 ? (this.func_card + 2) / 2 : 0;
        card = card == -1 ? mine[0] : card;
        if (this.stage == 0 && this.func_card == 2) {
            arr.push(mine[1]);
        }
        if (ind == -1) {
            arr.push(card);
        }
        for (var i = st; i < mine.length; i++) {
            arr.push(mine[i]);
            if (mine[i] == ind) {
                arr.push(card);
            }
        }
        this.game.player[this.username] = arr;
        if (this.stage == 3) {
            var syst = this.game.system;
            arr = new Array();
            for (var i in syst) {
                if (syst[i] != card) {
                    arr.push(syst[i]);
                }
            }
            this.game.system = arr;
            this.stage = 0;
            this.func_card = 0;
            this.last = card;
        }
        this.playGame();
    },
    clickPlayButton: function() {
        if (this.stage == 4) {
            $('div#play_info').html('Please wait your opponent\'s operation.');
            $('button#play_button').attr('disabled', true);
            this.socket.emit('play_ready', this.username, this.target);
        } else if ($('button#play_button').text() == 'OK') {
            $('button.card').unbind();
            $('button#play_button').attr('disabled', true);
            this.stage++;
            this.playGame();
            return;      
        } else {
            if (this.game.start) {
                this.game.start = false;
            }
            $('button#play_button').attr('disabled', true);
            $('div#play_info').html('Please wait your opponent\'s operation.');
            this.socket.emit('play_game', this.game);
        }
    },
    clickSyst: function(id, style, self) {
        if (this.selected_syst != null) {
            $('button#' + this.selected_syst.id).removeClass('btn-primary');
            $('button#' + this.selected_syst.id).addClass(this.selected_syst.style);
        }
        var btn = $('button#' + id);
        btn.removeClass(style);
        btn.addClass('btn-primary');
        this.selected_syst = {
            id: btn.attr('id'),
            style: style
        };
        if (self && $('button#play_button').attr('disabled')) {
            $('button#play_button').attr('disabled', false);
        }
        if (self) {
            this.socket.emit('click_card', this.selected_syst, 'syst');
        }
    },
    clickOppo: function(id, self) {
        var btn = $('button#' + id);
        if (self && !btn.hasClass('back')) {
            return;
        }
        if (this.selected_oppo != null) {
            $('button#' + this.selected_oppo).css('border', 'none');
        }
        btn.css('border', '8px solid #1abc9c');
        this.selected_oppo = btn.attr('id');
        if (self && $('button#play_button').attr('disabled')) {
            $('button#play_button').attr('disabled', false);
        }
        if (self) {
            this.socket.emit('click_card', this.selected_oppo, 'oppo');
        }
    },
    insertCard: function(card) {
        if (card.number == 12) {
            $('button#card_' + card.id).text('-');
            this.func_card = card.color ? 1 : 2;
            $('div#play_info').html('Please select where to place your selected ' + (card.color ? 'white' : 'black') + ' functional card.');
            this.showFuncChoice(card);
            this.func_card = 0;
        } else {
            var mine = this.game.player[this.username];
            var arr = this.insertionPlace(card);
            if (arr.length == 1) {
                this.confirmInsertion(card.id, arr[0]);
            } else {
                $('button#card_' + card.id).text(card.number);
                $('div#play_info').html('Please select where to place your selected card.');
                var cards = this.game.cards;
                var html = '';
                var ind = 0;
                if (arr[0] == -1) {
                    html += '<button class="card btn btn-hg btn-primary btn-block back" onclick="play_socket.confirmInsertion(' + card.id + ', -1)"></button>';
                    ind++;
                }
                for (var i = 0; i < mine.length; i++) {
                    html += this.getHtml(cards[mine[i]], 'mine');
                    if (arr[ind] == mine[i]) {
                        ind++;
                        html += '<button class="card btn btn-hg btn-primary btn-block back" onclick="play_socket.confirmInsertion(' + card.id + ', ' + mine[i] +')"></button>';
                    }
                }
                $('div#card_mine').html(html);
            }
        }
    },
    insertionPlace: function(card) {
        var cards = this.game.cards;
        var mine = this.game.player[this.username];
        var ind = -1;
        for (var i in mine) {
            var cur = cards[mine[i]];
            if (cur.number == 12) {
                continue;
            } else if (cur.number == card.number && !card.color || cur.number > card.number) {
                ind = cur.id;
            } else {
                break;
            }
        }
        var arr = new Array();
        arr.push(ind);
        var i = 0;
        while (i != -1 && i < mine.length && mine[i] != ind) {
            i++;
        }
        i++;
        while (i < mine.length && cards[mine[i]].number == 12) {
            arr.push(mine[i++]);
        }
        return arr;
    },
    win: function(self) {
        var cards = self ? this.game.player[this.target] : this.game.player[this.username];
        for (var i in cards) {
            if (!this.game.cards[cards[i]].status) {
                return false;
            }
        }
        return true;
    }
};

var play_socket = null;
window.onload = function() {
    play_socket = new PlaySocket();
    play_socket.ready();
};
window.onbeforeunload = function() {
    return 'Are you sure to leave this page? The game will end!';
}