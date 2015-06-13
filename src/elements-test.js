/*global casper */
"use strict";

var isFile = require('fs').isFile;
var phantomcss = require('phantomcss');
var compares = [];
var height = 1000;

module.exports = function(configs) {
	casper.test.begin('Next visual regression tests', function(test) {

		// phantom config
		phantomcss.init({
			timeout: 1000,
			libraryRoot: './node_modules/myrtlejs/node_modules/phantomcss',
			screenshotRoot: './test/visual/screenshots/successes',
			failedComparisonsRoot: './test/visual/screenshots/failures',
			addLabelToFailedImage: false,
			fileNameGetter: function(root, fileName) {
				var file = root + '/' + fileName;
				if (isFile(file + '.png')) {
					return file + '.diff.png';
				}
				return file + '.png';
			}
		});

		// set up casper a bit
		casper.on("page.error", function(msg, trace) {
			this.echo("Error: " + msg, "ERROR");
		});

		casper.on("page.consoleMessage",function(msg) {
			this.echo("Message: " + msg);
		});

		casper.options.pageSettings.javascriptEnabled = true;
		casper.userAgent('Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)');

		// open first url
		casper.start();

		Object.keys(configs.tests).forEach(function(pageName) {
			var config = configs.tests[pageName];
			["base", "test"].forEach(function(env) {
				console.log("Opening " + configs.hosts[env] + config.path);
				casper.thenOpen("http://" + configs.hosts[env] + config.path, { method: 'get', headers: { 'Cookie': 'next-flags=javascript:off; FT_SITE=NEXT' }
					}, function() {
						config.widths.forEach(function(width) {
							casper.viewport(width, height, function() {
								Object.keys(config.elements).forEach(function(elementName) {
									var fileName = pageName + "_" + elementName + "_" + width + "_" + height + "_" + env;
									phantomcss.screenshot(config.elements[elementName], 2000, undefined, fileName);
									if (env === 'base') {
										compares.push("test/visual/screenshots/successes/" + fileName + ".png");
									}
								});
							});
						});
					});
			});
		});

		casper.then(function() {
			compares.forEach(function(compare) {
				phantomcss.compareFiles(compare, compare.replace('_base', '_test'));
			});
		});
		casper.run(function() {
			casper.exit();
		});
	});
};
