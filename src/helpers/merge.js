define(function () {
	var merge = function (_dest, _arr) {
		for (var key in _arr) {
			if (_arr.hasOwnProperty(key)) {
				_dest[key] = _arr[key];
			}
		}

		return _dest;
	};
});