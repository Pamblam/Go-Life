module.exports = function(grunt) {
	
	var pkg = grunt.file.readJSON('package.json');
	pkg.version = pkg.version.split(".");
	var subversion = pkg.version.pop();
	subversion++;
	pkg.version.push(subversion);
	pkg.version = pkg.version.join(".");
	grunt.file.write('package.json', JSON.stringify(pkg, null, 2));
	
	console.log("---------------------------------------");
	console.log("  Building Go-Life Version "+pkg.version);
	console.log("---------------------------------------");
	
	grunt.initConfig({
		pkg: pkg,
		concat: {
			options: {
				banner: '/**\n * <%= pkg.name %> - v<%= pkg.version %>' +
						'\n * <%= pkg.description %>' +
						'\n * @author <%= pkg.author %>' +
						'\n * @website <%= pkg.homepage %>' +
						'\n * @license <%= pkg.license %>' +
						'\n */\n\n'
			},
			dist: {
				src: [
					'src/GoL.js',
					'src/GoLCell.js',
					'src/GoLMouse.js',
					'src/GoLPatternFile.js',
					'src/GoLRLE.js',
					'src/GoLRenderer.js',
					'src/GoLCanvasRenderer.js',
					'src/GoLSVGRenderer.js',
					'src/GoLTerminalRenderer.js',
					'src/export.js'
				],
				dest: 'GoL.js',
			},
		},
		'string-replace': {
			source: {
				files: {
					"GoL.js": "GoL.js"
				},
				options: {
					replacements: [{
						pattern: /{{ VERSION }}/g,
						replacement: '"<%= pkg.version %>"'
					}]
				}
			},
			readme: {
				files: {
					"README.md": "README.md"
				},
				options: {
					replacements: [{
						pattern: /\d+\.\d+\.\d+/g,
						replacement: '<%= pkg.version %>'
					}]
				}
			},
			index: {
				files: {
					"index.html": "index.html"
				},
				options: {
					replacements: [{
						pattern: /<b>Version \d+\.\d+\.\d+<\/b>/g,
						replacement: '<b>Version <%= pkg.version %></b>'
					}]
				}
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> */'
			},
			build: {
				src: 'GoL.js',
				dest: 'GoL.min.js'
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks('grunt-contrib-uglify-es');
	
	grunt.registerTask('default', [
		'concat',
		'string-replace',
		'uglify'
	]);
	
};