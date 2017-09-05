'use strict';
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');
class FailStore {
    constructor(type, group, dir = os.homedir()) {
        this.dir = path.join(dir, '.dts', 'CLIENT', group, 'failstore', type);
        mkdirp.sync(this.dir);
    }

    async datas() {
        throw new Error(`this is interface function`);
    }

    async put(key, val) {
        throw new Error(`this is interface function`);
    }

    async del(key) {
        throw new Error(`this is interface function`);
    }
}
module.exports = FailStore;