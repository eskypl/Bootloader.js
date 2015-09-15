define(function () {
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
});