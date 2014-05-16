module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            compile: {
                reference: "./src/talk.ts",
                out: "./dist/talk-bare.js",
                src: ["./src/**/*.ts"],
                options: {
                    module: "commonjs",
                    declaration: true,
                    sourceMap: false,
                    target: "es5"
                }
            }
        },
        concat: {
            module: {
                src: [
                    "./build/import.js",
                    "./dist/talk-bare.js",
                    "./build/export.js"
                ],
                dest: "./dist/talk.js"
            }
        },
        uglify: {
            bare: {
                src: "./dist/talk-bare.js",
                dest: "./dist/talk-bare.min.js"
            }
        },
        dpacker: {
            bundle: {
                src: "./dist/talk-bare.d.ts",
                dest: "./dist/talk.d.ts"
            }
        },
        bump: {
            files: ["./package.json"],
            options: {
                createTag: false,
                commit: false,
                push: false
            }
        }
    });
    require("./build/dpacker")(grunt);
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-bump");
    grunt.loadNpmTasks("grunt-ts");
    grunt.registerTask("bare", [
        "ts:compile",
        "uglify:bare",
        "bump:patch"
    ]);
    grunt.registerTask("default", [
        "bare",
        "concat:module",
        "dpacker:bundle"
    ]);
};