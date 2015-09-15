define([
	'var/config',
	'helpers/merge',
	'helpers/storage',
	'helpers/iframe',
	'helpers/xhr',
	'helpers/set-cookie',
	'helpers/debug'
], function (config) {
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
});