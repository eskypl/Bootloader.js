define(function () {
	return {
		prefix: 'BL.',
		lifeTime: 43200000, //12 hours
		noRequireWaitTime: 10000, //10 sec.
		cookieName: 'firstLoadBL',
		cookieExpires: 43200000, //12 hours expires
		iframeUrl: false,
		iframeOrigin: false
	};
});