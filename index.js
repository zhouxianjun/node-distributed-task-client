'use strict';
const path = require('path');
const trc = require('trc');
const thrift = require('thrift');
const logger = require('tracer-logger');
const Utils = require('./Utils');
const instance = Symbol();
const ServerProvider = trc.ServerProvider;
const PublicStruct = require('./thrift/PublicStruct_types');
const LevelFailStore = require('./failstore/LevelFailStore');
class Client {
    constructor(symbol, zk, group, config = {}) {
        if (!symbol || symbol !== instance)
            throw new ReferenceError('Cannot be instantiated, please use static instance function');
        this.failStore = config.failStore || new LevelFailStore(group);
        let interval = config.failInterval || 1000 * 60;
        Reflect.deleteProperty(config, 'failStore');
        Reflect.deleteProperty(config, 'failInterval');
        let provider = new ServerProvider(zk, Object.assign({
            invoker: new trc.invoker.factory.PoolInvokerFactory({
                transport: thrift.TFramedTransport,
                protocol: thrift.TCompactProtocol
            }),
            loadBalance: new trc.loadBalance.RoundRobinLoadBalance(),
        }, config));
        provider.loadType(path.resolve(__dirname, './thrift'));
        provider.on('ready', () => this.ready = true);
        this.group = group;
        this.host = provider.config.host;

        setInterval(async () => {
            try {
                let datas = await this.failStore.datas();
                datas.forEach(async data => {
                    logger.info(`delete fail store job ${data.key}`);
                    await this.failStore.del(data.key);
                    await this.addJobs(data.value);
                });
            } catch (err) {
                logger.warn(`fail store retry error`, err);
            }
        }, interval);
    }

    static instance(zk, group, config) {
        if (!this._instance) {
            this._instance = Reflect.construct(this, [instance, zk, group, config]);
        }
        return this._instance;
    }

    async addJob(job) {
        job.nodeGroup = this.group;
        job.submitHost = this.host;
        job.submitPid = process.pid;
        let jobService = await this.getService();
        try {
            await jobService.add(new PublicStruct.JobStruct(job));
        } catch (e) {
            await this.failStore.put(job);
            logger.error(`job ${job.taskId} add fail, save local store`, e);
        }
    }

    async addJobs(jobs) {
        if (!Array.isArray(jobs)) return await this.addJob(jobs);
        if (Array.isArray(jobs) && jobs.length === 1) return await this.addJob(jobs[0]);
        let data = [];
        jobs.forEach(job => {
            job.nodeGroup = this.group;
            job.submitHost = this.host;
            job.submitPid = process.pid;
            data.push(new PublicStruct.JobStruct(job));
        });
        let jobService = await this.getService();
        try {
            await jobService.addList(data);
        } catch (e) {
            await this.failStore.put(null, data);
            logger.error(`jobs add fail, save local store`, e);
        }
    }

    async pause(taskId, msg = 'empty') {
        let jobService = await this.getService();
        await jobService.pause(taskId, msg, new PublicStruct.HostInfo({host: this.host, port: 0, pid: process.pid}));
    }

    async recovery(taskId, msg = 'empty') {
        let jobService = await this.getService();
        await jobService.recovery(taskId, msg, new PublicStruct.HostInfo({host: this.host, port: 0, pid: process.pid}));
    }

    async cancel(taskId, msg = 'empty') {
        let jobService = await this.getService();
        await jobService.cancel(taskId, msg, new PublicStruct.HostInfo({host: this.host, port: 0, pid: process.pid}));
    }

    async getService() {
        if (this.jobService) return this.jobService;
        if (this.ready !== true && !this.jobService) {
            await Utils.sleep(500);
            return this.getService();
        }
        this.jobService = trc.ServerProvider.instance(require('./thrift/JobService'));
        return this.jobService;
    }
}
module.exports = Client;
module.exports.FailStore = require('./failstore/index');
module.exports.LevelFailStore = LevelFailStore;