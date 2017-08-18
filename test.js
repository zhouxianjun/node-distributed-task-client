'use strict';
const Client = require('./index');
const zookeeper = require('node-zookeeper-client');
let zk = zookeeper.createClient('127.0.0.1:2181');
zk.connect();
Client.instance(zk, 'test');
Client.instance().addJob({
    taskId: "2222",
    type: 'CRON',
    cron: '*/2 * * * *',
    action: 'say'
}).catch(err => {
    console.log(err.stack);
});