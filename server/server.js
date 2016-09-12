var express = require('express');
var body_parser = require('body-parser');
var dvc = express();
var server = require('http').createServer(dvc);
var session = require('express-session');
var redis_store = require('connect-redis')(session);
var utils = require('./utils');
var io = require('socket.io').listen(server);
var redis_client = require('redis').createClient();
var all_sockets = new Array();
var Game = require('./game');

server.listen(8888);
redis_client.on('error', function(err) {
	utils.error(err);
});
io.on('connection', function(socket) {
    socket.on('user_ready', function(username) {
    	utils.debug('user ready: ' + username);
		redis_client.sadd('ready_users', username);
		socket.page = 'Hall';
		socket.username = username;
		all_sockets[username] = socket;
		redis_client.smembers('ready_users', function(err, res) {
		    if (err) {
		        utils.error(err);
			} else {
				socket.broadcast.emit('ready_users', res);
			}
		});
	});
	socket.on('disconnect', function() {
		if (socket.page == 'Hall') {
	    	utils.debug('user leave: ' + socket.username);
			redis_client.srem('ready_users', socket.username);
			redis_client.smembers('ready_users', function(err, res) {
			    if (err) {
			        utils.error(err);
				} else {
					socket.broadcast.emit('ready_users', res);
				}
			})
		} else if (socket.page == 'Play') {
	    	utils.debug('user quit: ' + socket.username);
			redis_client.get('play_pair:' + socket.username, function(err, res) {
				if (err) {
					utils.error(err);
				} else {
					var target = all_sockets[res];
					if (target) {
						target.emit('connetion_break', false);
	    				redis_client.del('play_pair:' + socket.username);
					}
				}			
			});
		}
	});
	socket.on('make_pair', function(type, target) {
		all_sockets[target].emit('make_pair', type, socket.username);
	});
	socket.on('play_ready', function(source, target) {
		redis_client.get('play_pair:' + source, function(err, res) {
			if (err) {
				utils.error(err);
			} else if (res == target) {
				redis_client.del('play_pair:' + target);
			} else {
				all_sockets[source] = socket;
				socket.page = 'Play';
				socket.username = source;
				redis_client.set('play_pair:' + source, target);
				redis_client.get('play_pair:' + target, function(err2, res2) {
					if (err2) {
						utils.error(err2);
					} else if (res2 == source) {
						utils.debug('game ready: ' + source + " and " + target);
						var game = new Game();
						game.init(source, target);
						socket.emit('play_message', 'message_syst', 'new game starts!');
						socket.emit('play_message', 'message_syst', source + 'goes first.');
						socket.emit('play_game', game);
						all_sockets[target].emit('play_message', 'message_syst', 'new game starts!');
						all_sockets[target].emit('play_message', 'message_syst', source + 'goes first.');
						all_sockets[target].emit('play_game', game);
					}			
				});
			}	
		});
	});
	socket.on('play_message', function(content) {
		redis_client.get('play_pair:' + socket.username, function(err, res) {
			if (err) {
				utils.error(err);
			} else {
				var target = all_sockets[res];
				if (target) {
					target.emit('play_message', 'message_oppo', content);
				}
			}			
		});
	});
	socket.on('play_game', function(game) {
		redis_client.get('play_pair:' + socket.username, function(err, res) {
			if (err) {
				utils.error(err);
			} else {
				var target = all_sockets[res];
				if (target) {
					var info = socket.username + ' ends and it\'s ' + res + '\'s turn now.';
					socket.emit('play_message', 'message_syst', info);
					target.emit('play_message', 'message_syst', info);
					target.emit('play_game', game);
				}
			}			
		});
	});
	socket.on('click_card', function(selected, type) {
		redis_client.get('play_pair:' + socket.username, function(err, res) {
			if (err) {
				utils.error(err);
			} else {
				var target = all_sockets[res];
				if (target) {
					target.emit('click_card', selected, type);
				}
			}			
		});
	});
	socket.on('guess', function(number, color, right) {
		redis_client.get('play_pair:' + socket.username, function(err, res) {
			if (err) {
				utils.error(err);
			} else {
				var target = all_sockets[res];
				if (target) {			
					var info = socket.username + ' guess ' + (color ? 'white ' : 'black ') + number + ' and it\'s ' + right + '!';
					target.emit('play_message', 'message_syst', info);
				}
			}			
		});
	});
});

dvc.set('views', '../web/pages');
dvc.set('view engine', 'jade');
dvc.use('/web', express.static('../web'));
dvc.use(session({
    store: new redis_store({
    	host: '127.0.0.1',
        port: '6379',
        db: 1
    }),
    name: "dvc",
    secret: 'fabkxd',
    resave: false,
	saveUninitialized: true,
}));
dvc.use(body_parser.json());
dvc.use(body_parser.urlencoded({ extended: true }));

dvc.get('/', require('./index').index);
dvc.post('/login', require('./index').login);
dvc.get('/logout', require('./index').logout);
dvc.get('/error', require('./index').error);
dvc.get('/hall', require('./hall').index);
dvc.post('/play', require('./play').index);
dvc.use(function(req, res) {
	req.session.error = 'page not found!';
	var pathname = require("url").parse(req.url).pathname;
	res.redirect(req.url.replace(pathname, '/error'));
});
utils.debug('server started...');