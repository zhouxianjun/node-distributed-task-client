'use strict';
const level = require('level');
const FailStore = require('./index');
const util = require('util');
class LevelFailStore extends FailStore {
    constructor(group) {
        super('leveldb', group);
        this.db = level(this.dir);
    }

    async jobs() {
        return new Promise(ok => {
            let values = [];
            this.db.createValueStream().on('data', data => {
                values.push(JSON.parse(data));
            }).on('end', () => ok(values));
        });
    }

    async put(job) {
        await util.promisify(this.db.put).apply(this.db, [job.taskId, JSON.stringify(job)]);
    }

    async del(job) {
        await util.promisify(this.db.del).apply(this.db, [job.taskId]);
    }
}
module.exports = LevelFailStore;