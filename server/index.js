var utils = require('./utils');
var redis_client = require('redis').createClient();

redis_client.on('error', function(err) {
	utils.error(err);
});

exports.index = function(req, res) {
	utils.debug('index.index called...');
	if (req.session.user) {
		res.redirect('/hall');
	} else {
		res.render('login', {
			page: 'Login',
			error_message: req.session.login_error
		});
	}
};
exports.login = function(req, resp) {
	utils.debug('index.login called...');
	var username = req.body.username;
	var password = req.body.password;
	redis_client.hgetall('user:' + username, function(err, res) {
	    if (err) {
	        utils.error(err);
			req.session.error = 'redis error!';
			resp.redirect('/error');
		} else if (res) {
			if (password == res.password) {
			    req.session.user = username;
			    resp.redirect('/hall');
			} else {
        		req.session.login_error = 'password not correct or username already registered!';
			    resp.redirect('/');
			}
	    } else {
	    	if (username.length < 5 || username.length > 15) {
        		req.session.login_error = 'username length not valid!';
			    resp.redirect('/');
	    	} else if (password.length < 5 || password.length > 10) {
        		req.session.login_error = 'password length not valid!';
			    resp.redirect('/');
	    	} else {
	    		redis_client.hmset('user:' + username, 'username', username, 'password', password);
		    	utils.debug('user created: ' + username);
				req.session.user = username;
				resp.redirect('/hall');
	    	}
	    }
	});
};
exports.logout = function(req, res) {
	utils.debug('index.logout called...');
	req.session.user = null;
	req.session.login_error = null;
	res.redirect('/');
};
exports.error = function(req, res) {
	utils.debug('index.error called...');
	res.render('error', {
		page: 'Error',
		error: req.session.error
	});
};