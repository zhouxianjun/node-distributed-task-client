'use strict';
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
class FailStore {
    constructor(type, group, dir = os.homedir()) {
        this.dir = path.join(dir, '.dts', 'CLIENT', group, 'failstore', type);
        mkdirp.sync(this.dir);
    }

    async jobs() {
        throw new Error(`this is interface function`);
    }

    async put(job) {
        throw new Error(`this is interface function`);
    }

    async del(job) {
        throw new Error(`this is interface function`);
    }
}
module.exports = FailStore;