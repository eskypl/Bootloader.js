define(function () {
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
});