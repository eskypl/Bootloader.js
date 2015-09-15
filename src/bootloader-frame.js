define([
	'helpers/storage',
	'helpers/debug'
], function () {

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
});