var utils = require('./utils');
var redis_client = require('redis').createClient();

redis_client.on('error', function(err) {
	utils.error(err);
});

exports.index = function(req, res) {
	utils.debug('play.index called...');
	if (req.session.user) {
		var username = req.session.user;
		var target = req.body.target;
		res.render('play', {
			page: 'Play',
			username: username,
			target: target
		});
	} else {
        req.session.login_error = 'Please login first!';
        res.redirect('/');
    }
}