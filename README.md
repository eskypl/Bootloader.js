# Bootloader.JS

## Instalation

`npm install bootloader-js --save`

and add in <HEAD>
```html
	<script src="./node_modules/bootloader-js/dist/bootloader.min.js"></script>
```

## Configuration
after script bootloader
```js
	<script>
		window.blConfig = {
			prefix: 'BL.',
            lifeTime: 43200000, // default 12 hours
            noRequireWaitTime: 10000, // default 10 sec.
            cookieName: 'firstLoadBL',
            cookieExpires: 43200000, // default 12 hours expires
            iframeUrl: false, // for cross origin localStorage
		};
	</script>
```

## Example

after bootloader script and config
~~~html
	<style type="text/css" data-hash="{{ hashFile }}" data-require="1" data-url="{{ urlFile }}"></style>
~~~

for javascript file add in <body>
~~~html
	<script type="text/javascript"  data-hash="{{ hashFile }}" data-require="1" data-src="{{ urlFile }}"></script>
~~~