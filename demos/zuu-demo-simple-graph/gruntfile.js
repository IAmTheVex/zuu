module.exports = function (grunt) {
    grunt.initConfig({
        sync: {
            views: {
                files: [
                    { src: "views/**", dest: "build" }
                ]
            }
        },
        watch: {
            syncviews: {
                files: [
                    "views/**",
                ],
                tasks: ['sync:views']
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-sync");
};