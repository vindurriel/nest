module.exports= (grunt)->
	grunt.config.init
		less:
			dev:
				options:
					paths: ['src/css']
				expand: true
				cwd: "src/css"
				src: ["*.less"]
				dest: "static/css"
				ext: ".css"
		coffee:
			default:
				options:
					bare:true
				expand: true
				cwd: "src/js"
				src: ["*.coffee"]
				dest: "static/js"
				ext: ".js"
		watch: 
			coffeescript:
				files: 'src/js/*.coffee'
				tasks: ['newer:coffee']
			less:
				files: 'src/css/*.less'
				tasks:['newer:less']
	grunt.loadNpmTasks 'grunt-newer'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-less'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	return