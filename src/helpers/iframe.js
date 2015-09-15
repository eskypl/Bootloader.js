define([
	'var/config',
	'helpers/debug'
], function (config) {
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
});