'use strict';

export class DiConfig {
    static addSource(patterns: string | Array<string>, baseDir?: string) {
        const requireGlob = require('require-glob');
        baseDir = baseDir || process.cwd();
        requireGlob.sync(patterns, {
            cwd: baseDir
        });
    }
}