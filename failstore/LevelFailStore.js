'use strict';
const level = require('level');
const FailStore = require('./index');
const util = require('util');
const crypto = require('crypto');
class LevelFailStore extends FailStore {
    constructor(group) {
        super('leveldb', group);
        this.db = level(this.dir);
    }

    async datas() {
        return new Promise(ok => {
            let values = [];
            this.db.createReadStream().on('data', data => {
                if (typeof data.value === 'string') {
                    data.value = JSON.parse(data.value);
                }
                values.push(data);
            }).on('end', () => ok(values));
        });
    }

    async put(key, val) {
        if (!Array.isArray(val)) {
            await util.promisify(this.db.put).apply(this.db, [key, JSON.stringify(val)]);
            return;
        }
        let md5 = crypto.createHash('md5');
        val.forEach(job => md5.update(job.taskId));
        await util.promisify(this.db.put).apply(this.db, [md5.digest('hex'), JSON.stringify(val)]);
    }

    async del(key) {
        await util.promisify(this.db.del).apply(this.db, [key]);
    }
}
module.exports = LevelFailStore;