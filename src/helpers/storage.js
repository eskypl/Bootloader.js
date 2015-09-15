define([
	'var/config',
	'helpers/debug'
], function (config) {
	var hasStorage = true;
	try {
		window.localStorage['BL.checkStorage'] = 1;
		delete window.localStorage['BL.checkStorage'];
	}
	catch (e) {
		hasStorage = false;
	}
	var localStorage = (hasStorage ? localStorage || window.localStorage : {});

	var setStorage = function (_name, _data) {
		if (!hasStorage) {
			return false;
		}
		var now = +new Date();

		try {
			localStorage[config.prefix + _name] = JSON.stringify({
				data: _data,
				expiration: (now + config.lifeTime)
			});
			return true;
		}
		catch (_error) {
			if (_error && _error.name.toUpperCase().indexOf('QUOTA') >= 0) {
				var item;
				var tmpItems = [];

				//remove old cache
				for (item in localStorage) {
					if (localStorage.hasOwnProperty(item) && item.indexOf(config.prefix) !== -1) {
						tmpItems.push({key: item, value: JSON.parse(localStorage[item])});
					}
				}

				if (tmpItems.length) {
					tmpItems.sort(function (a, b) {
						return a.value.expiration - b.value.expiration;
					});

					delete localStorage[tmpItems[0].key];

					return setStorage(_name, _data);
				}

				return true;
			}
			else {
				/* jshint ignore:start */
				debug.error('Cache: could not add item with key "' + _name + '".', _error.message);
				/* jshint ignore:end */
				return false;
			}
		}
	};

	var flushStorage = function () {
		if (!hasStorage) {
			return false;
		}

		var item;
		var now = +new Date();

		for (item in localStorage) {
			if (localStorage.hasOwnProperty(item) && item.indexOf(config.prefix) !== -1) {
				var data = JSON.parse(localStorage[item]);

				if (data.expiration < now) {
					delete localStorage[item];
				}
			}
		}

		return true;
	};
});