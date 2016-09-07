var utils = require('./utils');
var redis_client = require('redis').createClient();

redis_client.on('error', function(err) {
	utils.error(err);
});

exports.index = function(req, resp) {
	utils.debug('hall.index called...');
	if (req.session.user) {
		var login_user = req.session.user;
		redis_client.smembers('ready_users', function(err, res) {
		    if (err) {
		        utils.error(err);
				req.session.error = 'redis error!';
				resp.redirect('/error');
			} else {
				resp.render('hall', {
					page: 'Hall',
					login_user: login_user,
					ready_users: res
				});
			}
		});
	} else {
        req.session.login_error = 'Please login first!';
        resp.redirect('/');
    }
}