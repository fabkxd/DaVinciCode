var PlaySocket = function() {
    this.socket = null;
    this.username = $('span#username').text();
    this.target = $('span#target').text();
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
    	this.socket.on('play_control', function(control) {
		    $('.play_control').attr('disabled', !control);
            if (control) {
                $('span#target_info').text('is online');
            } else {
                $('span#target_info').text('is offline');
            }
		});
        this.socket.on('play_message', function(type, content) {
            that.message(type, content);
        });
        this.socket.on('play_game', function(game) {
            that.displayGame(game);
        });
    },
    message: function(type, content) {
    	var chat_box = $("div#play_chat_box");
        chat_box.append('<div><div class="play_chat_message ' + type + '">' + content + '</div></div>');
        chat_box.scrollTop(600);
    },
    displayGame: function(game) {
        var html = '';
        alert(JSON.stringify(game));
        for (var card in game.player[this.username]) {
            alert(username);
        }
        $('div#play_game').html('lalala');
    }
};

window.onload = function() {
    new PlaySocket().ready();
};