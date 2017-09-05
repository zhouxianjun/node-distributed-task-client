'use strict';
const Client = require('./index');
const zookeeper = require('node-zookeeper-client');
let zk = zookeeper.createClient('127.0.0.1:2181');
zk.connect();
Client.instance(zk, 'test');
Client.instance().addJobs([{
    taskId: "list-1",
    type: 'CRON',
    cron: '*/5 * * * *',
    action: 'say'
}, {
    taskId: "list-2",
    type: 'CRON',
    cron: '*/8 * * * *',
    action: 'say'
}]).catch(err => {
    console.log(err.stack);
});