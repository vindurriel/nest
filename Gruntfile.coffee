module.exports= (grunt)->
	grunt.config.init
		less:
			dev:
				options:
					paths: ['src/less']
				expand: true
				cwd: "src/less"
				src: ["*.less"]
				dest: "static/css"
				ext: ".css"
		coffee:
			default:
				options:
					bare:true
				expand: true
				cwd: "src/coffee"
				src: ["*.coffee"]
				dest: "static/js"
				ext: ".js"
		watch: 
			coffeescript:
				files: 'src/coffee/*.coffee'
				tasks: ['newer:coffee']
			less:
				files: 'src/less/*.less'
				tasks:['newer:less']
	grunt.loadNpmTasks 'grunt-newer'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-less'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.registerTask('default',['watch'])
	return