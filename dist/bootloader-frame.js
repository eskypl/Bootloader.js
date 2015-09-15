var config = {
		prefix: 'BL.',
		lifeTime: 43200000, //12 hours
		noRequireWaitTime: 10000, //10 sec.
		cookieName: 'firstLoadBL',
		cookieExpires: 43200000, //12 hours expires
		iframeUrl: false,
		iframeOrigin: false
	};


	/* jshint ignore:start */
	var debug = {};
	try {
		// for IE 8/9
		if (!window.console) {
			window.console = {
				log: function () {
				},
				debug: function () {
				},
				info: function () {
				},
				warn: function () {
				},
				error: function () {
				}
			};
		}
		debug = console;
		// Firefox throws an exception if you access the console object and
		// it doesn't exist. Wow!
	} catch (e) {}
	/* jshint ignore:end */


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



	/* jshint ignore:start */
	if (window.self === window.top) {
		debug.error('Bootloader: please include in iframe.');
	}

	if (!hasStorage || !'postMessage' in window) {
		debug.error('Bootloader: localStorage is disabled.');
	}
	/* jshint ignore:end */

	var url = 'http://' + location.host;
	var urlSsl = 'https://' + location.host;
	var frameOrigin = window.name || false;

	flushStorage();

	var onMessage = function (_event) {
		if (_event.origin === url || _event.origin === urlSsl || _event.origin.indexOf(frameOrigin) !== -1) {
			var data = JSON.parse(_event.data);

			if ('setStorage' in data) {
				_event.source.postMessage(setStorage(data.hash, data.data), _event.origin);
			}
			else {
				/* jshint ignore:start */
				debug.warn('Bootloader: no action.');
				/* jshint ignore:end */
			}
		}
	};

	if (window.addEventListener) {
		window.addEventListener('message', onMessage, false);
	} else if (window.attachEvent) {
		window.attachEvent('onmessage', onMessage);
	}

