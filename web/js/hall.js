var HallSocket = function() {
    this.socket = null;
    this.username = $('a#username').text();
    this.target = null;
};
HallSocket.prototype = {
    ready: function() {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
        	that.socket.emit('user_ready', that.username);
        });
    	this.socket.on('ready_users', function(ready_users) {
		    that.display(ready_users);
		});
        this.socket.on('make_pair', function(type, tar) {
            if (type == 'req') {
                if (that.target == null && confirm(tar + ' ask for playing with you, agree or not?')) {
                    that.socket.emit('make_pair', 'res', tar);
                    $('input#hall_target').val(tar);
                    $('form#hall_go').submit();
                } else {
                    that.socket.emit('make_pair', 'ref', tar);
                }
            } else if (type == 'res' && tar == that.target) {
                $('input#hall_target').val(tar);
                $('form#hall_go').submit();
            } else if (type == 'ref' && tar == that.target) {
                $('span#hall_info').text(tar + ' refuse your request');
                that.target = null;
                alert(tar + ' refuse your request');
            }
        });
    },
    display: function(ready_users) {
    	var html = "";
    	for (i in ready_users)
    		if (ready_users[i] != this.username) {
    		html += '<div class="col-md-3"><button class="btn btn-primary btn-hg btn-block" onclick="hall_socket.makePair(\''
    		+ ready_users[i] + '\')"> ' + ready_users[i] + '</button></div>';
    	}
    	$('div#hall_users').html(html);
    },
    makePair: function(tar) {
        if (this.target != tar && confirm('sure to choose ' + tar + ' as opponent?')) {    
            $('div#hall_users>div>button').addClass('disabled');
            this.socket.emit('make_pair', 'req', tar);
            this.target = tar;
            $('span#hall_info').text('wait ' + tar + ' to respond');
            setTimeout(function() {
                $('div#hall_users>div>button').removeClass('disabled');
            }, 10000);
        }
    }
};

var hall_socket = null;
window.onload = function() {
    hall_socket = new HallSocket();
    hall_socket.ready();
};