module.exports = function (grunt) {
	'use strict';

	var matchdep = require('matchdep');
	var config = {
		pkg: grunt.file.readJSON('package.json')
	};

	matchdep.filter('grunt-*').forEach(grunt.loadNpmTasks);
	matchdep.filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	var rdefineEnd = /\}\);[^}\w]*$/;

	//base on jQuery strip
	function convert(name, path, contents) {
		var amdName;
		// Convert var modules
		if (/.\/var\//.test(path)) {
			contents = contents
				.replace(/define\([\w\W]*?return/, "var " + (/var\/([\w-]+)/.exec(name)[1]) + " =")
				.replace(rdefineEnd, "");

		} else {

		// Ignore Bootloader's exports (the only necessary one)
			if (name !== "bootloader") {
				contents = contents
					.replace(/\s*return\s+[^\}]+(\}\);[^\w\}]*)$/, "$1")

					// Multiple exports
					.replace(/\s*exports\.\w+\s*=\s*\w+;/g, "");
			}

			// Remove define wrappers, closure ends, and empty declarations
			contents = contents
				.replace(/define\([^{]*?{/, "")
				.replace(rdefineEnd, "");

				// Remove anything wrapped with
				//* ExcludeStart */ /* ExcludeEnd */
				// or a single line directly after a // BuildExclude comment
			contents = contents
				.replace(/\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, "")
				.replace(/\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, "");
				// Remove empty definitions
			contents = contents
				.replace(/define\(\[[^\]]+\]\)[\W\n]+$/, "");
		}
		// AMD Name
		if ((amdName = grunt.option("amd")) !== null && /^exports\/amd$/.test(name)) {
			if (amdName) {
				grunt.log.writeln("Naming Bootloader with AMD name: " + amdName);
			} else {
				grunt.log.writeln("AMD name now anonymous");
			}
			// Remove the comma for anonymous defines
			contents = contents
				.replace(/(\s*)"bootloader"(\,\s*)/, amdName ? "$1\"" + amdName + "\"$2" : "");
		}
		return contents;
	}

	config.meta = {
		banner: "/*!\n * <%= pkg.title %> v<%= pkg.version %> - " +
		"<%= grunt.template.today('yyyy-mm-dd') %> - <%= pkg.description %>\n" +
		" *\n" +
		" * <%= pkg.homepage %>\n" +
		" *\n" +
		" * Copyright <%= grunt.template.today('yyyy') %> <%= pkg.author %>\n" +
		" * Released under the <%= pkg.license %> license.\n */\n\n"
	};

	/**
	 * JSHINT
	 */
	config.jshint = {
		options: {

			// use custom rules
			jshintrc: './.jshintrc',

			// report errors but do not fail the task
			force: true,

			// folders to ignore
			ignores: []
		},
		src: [
			'test/**/*Spec.js'
		],
		build: [
			'dist/**/*.js',
			'!dist/**/bootloader-frame.js',
			'!dist/**/*.min.js'
		]
	};

	config.clean = {
		options: {
			force: true
		},
		dist: [
			'./dist/**/*.*'
		]
	};

	config.requirejs = {
		compile: {
			options: {
				name: 'bootloader',
				baseUrl: './src',
				out: 'dist/bootloader.js',
				optimize: 'none',
				findNestedDependencies: true,
				skipSemiColonInsertion: true,
				wrap: false,
				rawText: {},
				onBuildWrite: convert
			}
		},
		iframe: {
			options: {
				name: 'bootloader-frame',
				baseUrl: './src',
				out: 'dist/bootloader-frame.js',
				optimize: 'none',
				findNestedDependencies: true,
				skipSemiColonInsertion: true,
				wrap: false,
				rawText: {},
				onBuildWrite: convert
			}
		}
	};

	config.umd = {
		compile: {
			src: 'dist/bootloader.js',
			globalAlias: 'Bootloader',
			template: 'src/templates/dist.hbs',
			dest: 'dist/bootloader.js'
		},
		iframe: {
			src: 'dist/bootloader-frame.min.js',
			pkg: config.pkg,
			template: 'src/templates/bootloader-frame.hbs',
			dest: 'dist/bootloader-frame.html'
		}
	};

	config.uglify = {
		options: {
			banner: '<%= meta.banner %>',
			report: 'gzip'
		},
		dist: {
			files: {
				'dist/bootloader.min.js': 'dist/bootloader.js'
			}
		},
		iframe: {
			options: {
				banner: ''
			},
			files: {
				'dist/bootloader-frame.min.js': 'dist/bootloader-frame.js'
			}
		}
	};

	config.usebanner = {
		dist: {
			options: {
				position: 'top',
				banner: '<%= meta.banner %>'
			},
			files: {
				src: ['dist/bootloader.js', 'dist/bootloader.js']
			}
		}
	};

	config.watch = {
		scripts: {
			files: './src/**/*.js',
			tasks: ['build']
		}
	};

	config.karma = {
		options: {
			configFile: './karma.conf.js'
		},
		run: {
			options: {
				coverageReporter: {
					type: 'text-summary'
				}
			}
		}
	};

	grunt.registerTask('build', ['jshint:src', 'clean', 'requirejs', 'umd:compile', 'uglify', 'umd:iframe', 'usebanner:dist', 'jshint:build']);

	// Default grunt
	grunt.registerTask('default', ['build']);

	grunt.initConfig(config);
};
