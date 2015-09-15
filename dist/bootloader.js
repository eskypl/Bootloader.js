/*!
 *  v1.1.2 - 2015-09-15 - Bootloader.js is a script and resource loader for caching and loading using localStorage.
 *
 * https://github.com/eskypl/Bootloader.js
 *
 * Copyright 2015 [object Object]
 * Released under the MIT license.
 */


(function (root, factory) {
	'use strict';
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else {
		root.Bootloader = factory(root);
	}
}(this, function (window) {
	'use strict';

	var config = {
		prefix: 'BL.',
		lifeTime: 43200000, //12 hours
		noRequireWaitTime: 10000, //10 sec.
		cookieName: 'firstLoadBL',
		cookieExpires: 43200000, //12 hours expires
		iframeUrl: false,
		iframeOrigin: false
	};


	var merge = function (_dest, _arr) {
		for (var key in _arr) {
			if (_arr.hasOwnProperty(key)) {
				_dest[key] = _arr[key];
			}
		}

		return _dest;
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


	var getFrame = false;
	var arrSaveCross = [];
	var urlToSend = false;

	var getLocation = function (_href) {
		var link = document.createElement('a');
		link.href = _href;
		return link;
	};

	var addIframe = function () {
		var frame = document.getElementById('bootloader-frame');
		var isFrame = !!frame;

		if (isFrame) {
			return frame.contentWindow;
		}
		else {
			var element = document.createElement('iframe');
			element.frameBorder = 0;
			element.id = 'bootloader-frame';
			if (config.iframeOrigin) {
				element.name = config.iframeOrigin;
			}
			element.style.display = 'none';
			document.body.appendChild(element);

			element.onload = function () {
				getFrame = element.contentWindow;

				if (window.bl) {
					window.bl.emit('saveCross');
				}
			};

			element.src = config.iframeUrl;
		}
	};

	var postData = function (_hash, _data) {
		if (!urlToSend) {
			urlToSend = config.iframeUrl ? getLocation(config.iframeUrl) : false;
		}

		if (!('postMessage' in window) || !getFrame || !urlToSend) {
			/* jshint ignore:start */
			debug.error('Bootloader: blocked postData.');
			/* jshint ignore:end */
			return false;
		}

		getFrame.postMessage(JSON.stringify({
			setStorage: true,
			hash: _hash,
			data: _data
		}), (urlToSend.protocol + '//' + urlToSend.hostname));
	};


	var xhr = function (_item, _fn) {
		var retryXhr = 0;
		var now = +new Date();

		var makeXhr = function (_item, _fn) {
			var request = new XMLHttpRequest();
			request.open('GET', _item.url + (_item.url.indexOf('?') !== -1 ? '.' + now : '?timestamp=' + now), true);
			request.withCredentials = true;

			request.onload = function () {
				if (request.status >= 200 && request.status < 400) {
					_fn(_item, request.responseText);
				}
				retryXhr = 0;
			};

			request.onerror = function () {
				retryXhr++;

				if (retryXhr < 5) {
					makeXhr(_item, _fn);
				}
			};

			request.send();
		};

		return makeXhr(_item, _fn);
	};


	var setCookie = function (_name, _value, _hours) {
		var expires;

		if (_hours) {
			var date = new Date();
			date.setTime(date.getTime() + (_hours * 60 * 60 * 1000));
			expires = "; expires=" + date.toGMTString();
		}
		else {
			expires = "";
		}

		document.cookie = _name + "=" + _value + expires + "; path=/";
	};


	var head = document.head || document.getElementsByTagName('head')[0];
	var body;
	var run = false;

	var Bootloader = function (_options) {
		/* jshint ignore:start */
		if (!hasStorage) {
			debug.error('Bootloader: localStorage is disabled.');
		}
		/* jshint ignore:end */

		return new Bootloader.fn.init(_options);
	};

	Bootloader.fn = Bootloader.prototype = {
		constructor: Bootloader,
		options: config
	};

	Bootloader.fn.init = function (_options) {
		_options = _options || false;
		var self = this;

		if (_options) {
			this.options = merge(config, _options);
		}
		this.events = {};
		this.toCache = [{
			require: 0
		}];

		//clean old storage
		flushStorage();

		//bind events
		this.on('grab', function () {
			this.getResource(1);
		});

		this.on('saveCross', function () {
			if (!config.iframeUrl || (config.iframeUrl && !getFrame)) {
				return false;
			}

			for (var i = 0, item; (item = arrSaveCross[i++]);) {
				if (!item.save) {
					postData(item.hash, item.response);
					item.save = true;
				}
			}
		});

		this.on('loadNoRequire', function () {
			if (hasStorage) {
				setTimeout(function () {
					self.getResource(0);
				}, config.noRequireWaitTime);
			}
		});

		//get styles to loaded
		self.getToLoaded('css');

		if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", function () {
				//add iframe cross domain localStorage
				if (config.iframeUrl) {
					addIframe();
				}
				self.getToLoaded('js');
			}, false);
		} else if (window.attachEvent) {
			window.attachEvent("onreadystatechange", function () {
				//add iframe cross domain localStorage
				if (config.iframeUrl) {
					addIframe();
				}
				self.getToLoaded('js');
			});
		}

		if (run && document.readyState === 'complete') {
			//add iframe cross domain localStorage
			if (config.iframeUrl) {
				addIframe();
			}
			self.getToLoaded('js');
		}

		return this;
	};

	Bootloader.fn.init.prototype = Bootloader.fn;

	Bootloader.fn.on = function (_eventName, _fnCallback) {
		this.events[_eventName] = this.events[_eventName] || [];
		this.events[_eventName].push({
			fn: _fnCallback
		});

		return this;
	};

	Bootloader.fn.emit = function () {
		var args = Array.apply([], arguments);
		var list = this.events[args.shift()] || [];

		for (var i = 0, j; (j = list[i++]);) {
			j.fn.apply(this, args);
		}
	};

	Bootloader.fn.createElement = function (_type, _code) {
		var element = document.createElement((_type === 'js' ? 'script' : 'style'));
		element.type = (_type === 'js' ? 'text/javascript' : 'text/css');
		element[(_type === 'js' ? 'text' : 'innerHTML')] = _code;

		return element;
	};

	Bootloader.fn.getToLoaded = function (_type) {
		if (_type === 'js' && body === undefined) {
			run = true;
			body = document.body || document.getElementsByTagName('body')[0];
		}
		//get javascript to loaded
		var resource = document.querySelectorAll((_type === 'js' ? 'script[data-src]' : 'style[data-url]'));
		for (var j = 0, item; (item = resource[j++]);) {
			var isRequire = item.getAttribute('data-require');
			if (isRequire !== null && isRequire === '1') {
				this.toCache[0].require++;
			}

			if (item.isToCache === undefined && !item.isToCache) {
				this.toCache.push({
					node: item,
					hash: item.getAttribute('data-hash'),
					cross: (item.getAttribute('data-cross') * 1),
					type: _type,
					url: (_type === 'js' ? item.getAttribute('data-src') : item.getAttribute('data-url')),
					require: parseInt((isRequire === null ? 0 : isRequire)),
					fn: (_type === 'js' ? item.getAttribute('data-fn') : false),
					isLoad: false
				});
				item.isToCache = true;
			}
		}

		this.emit('grab');
	};

	Bootloader.fn.getResource = function (_getRequire) {
		_getRequire = _getRequire || 0;
		var self = this;
		var count = 0;
		var firstLoadCookie = true;

		var handle = function (_item, _response) {
			if (!hasStorage) {
				self.appendNoSupportStorage(_item, _response);
				return;
			}

			if (_item.cross) {
				arrSaveCross.push({
					hash: _item.hash,
					response: _response,
					save: false
				});
				self.emit('saveCross');
			}
			setStorage(_item.hash, _response);
			if (_item.require === 1) {
				self.appendResource(_item, _response);
			}
		};

		for (var i = 0, item; (item = this.toCache[i++]);) {
			//get to cache
			var cache = (hasStorage ? localStorage[config.prefix + item.hash] : false);
			var cookieIsLoad = document.cookie.indexOf(config.cookieName);

			if (item.require === _getRequire && item.node) {
				if ((!hasStorage && cookieIsLoad === -1 && !item.isLoad) || (cache === undefined && !item.isLoad) || (!cache && !item.isLoad && cookieIsLoad !== -1)) {
					xhr(item, handle);
					item.isLoad = true;

					if (firstLoadCookie) {
						setCookie(config.cookieName, '1', config.cookieExpires);
						firstLoadCookie = false;
					}
				}
				else if (item.require === 1 && cache) {
					if (item.cross) {
						arrSaveCross.push({
							hash: item.hash,
							response: JSON.parse(localStorage[config.prefix + item.hash]).data,
							save: false
						});
						self.emit('saveCross');
					}
					self.appendResource(item, JSON.parse(localStorage[config.prefix + item.hash]).data);
				}
				count++;

				if (_getRequire === 1 && this.toCache[0].require === count) {
					self.emit('loadNoRequire');
				}
			}
		}
	};

	Bootloader.fn.appendResource = function (_item, _content) {
		if (_item.type === 'css') {
			_item.node.innerHTML = _content;
		}
		else {
			_item.node.text = _content;
			//run callback for JS
			if (_item.fn && typeof(window[_item.fn]) === "function") {
				window[_item.fn]();
			}
		}
	};

	Bootloader.fn.appendNoSupportStorage = function (_item, _content) {
		var self = this;
		var fragment = document.createDocumentFragment();
		fragment.appendChild(self.createElement(_item.type, _content));
		(_item.type === 'js' ? body : head).appendChild(fragment);
		//run callback for JS
		if (_item.type === 'js' && _item.fn && typeof(window[_item.fn]) === "function") {
			window[_item.fn]();
		}
	};

	window.bl = new Bootloader(window.blConfig);

	return Bootloader;


}));