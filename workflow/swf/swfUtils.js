var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    _ = require('lodash'),
    uuid = require('node-uuid');

var swfUtils = function swfUtils(swf, domainName, taskList) {
    this.swf = swf;
    this.domainName = domainName;
    this.taskList = taskList;
};

swfUtils.prototype.initDomain = function () {
    var domainName = this.domainName,
        _this = this;
    return new Promise(function (resolve, reject) {
        _this.swf.listDomainsAsync({registrationStatus: 'REGISTERED'}).then(function (domainList) {
            console.log(domainList);
            if (_.findIndex(domainList.domainInfos, {name: domainName}) != -1) {
                resolve(domainName);
            } else {
                reject('domain has not been registered');
            }
        });
    })
        .catch(function (err) {
            console.error(err);
            console.log('will try to register domain ' + domainName);
            return _this.registerDomain(domainName)
        })
        .thenReturn(domainName);
};

swfUtils.prototype.registerDomain = function (domainName) {
    return this.swf.registerDomainAsync({name: domainName, workflowExecutionRetentionPeriodInDays: '1'});
};

swfUtils.prototype.initWorkflow = function (name) {
    return this.swf.registerWorkflowTypeAsync({
            domain: this.domainName,
            name: name,
            version: '1.0'
        })
        .catch(function (err) {
            return new Promise(function (resolve, reject) {
                if (err.code == 'TypeAlreadyExistsFault') {
                    resolve(name);
                } else {
                    reject(err);
                }
            });
        })
        .thenReturn(name);
};

swfUtils.prototype.initActivity = function (name) {
    return this.swf.registerActivityTypeAsync({
            domain: this.domainName,
            name: name,
            version: '1.0'
        })
        .catch(function (err) {
            return new Promise(function (resolve, reject) {
                if (err.code == 'TypeAlreadyExistsFault') {
                    resolve(name);
                } else {
                    reject(err);
                }
            });
        })
        .thenReturn(name);
};

swfUtils.prototype.startWorkflowExecution = function (workflow) {
    var workflowId = uuid.v1();
    return this.swf.startWorkflowExecutionAsync({
        domain: this.domainName,
        workflowType: {
            name: workflow,
            version: '1.0'
        },
        workflowId: workflowId,
        childPolicy: 'TERMINATE',
        taskStartToCloseTimeout: '3600',
        taskList: {name: this.taskList},
        executionStartToCloseTimeout: '86000'
    }).then(function (result) {
        result.workflowId = workflowId;
        return result;
    });
};

swfUtils.prototype.terminateWorkflowExecution = function (workflowId, runId) {
    return this.swf.terminateWorkflowExecutionAsync({
        domain: this.domainName,
        workflowId: workflowId,
        runId: runId
    });
};

swfUtils.prototype.pollForDecisionTask = function () {
    return this.swf.pollForDecisionTaskAsync({
        domain: this.domainName,
        taskList: {name: this.taskList}
    });
};

swfUtils.prototype.pollForActivityTask = function () {
    return this.swf.pollForActivityTaskAsync({
        domain: this.domainName,
        taskList: {name: this.taskList}
    });
};

swfUtils.prototype.handleDecisionTask = function (decisionHandler, decisionTask) {
    var taskToken = decisionTask.taskToken,
        events = decisionTask.events,
        workflowType = decisionTask.workflowType,
        previousStartedEventId = decisionTask.previousStartedEventId,
        activityId = uuid.v1(),
        taskList = this.taskList,
        _this = this;

    var getParams = function (activityName) {
        return {
            taskToken: taskToken,
            decisions: [
                {
                    decisionType: 'ScheduleActivityTask',
                    scheduleActivityTaskDecisionAttributes: {
                        activityId: activityId,
                        activityType: {
                            name: activityName,
                            version: '1.0'
                        },
                        taskList: {name: taskList},
                        scheduleToStartTimeout: '86000',
                        scheduleToCloseTimeout: '10000',
                        startToCloseTimeout: '10000',
                        heartbeatTimeout: '3000'
                    }
                }
            ]
        }
    };

    return decisionHandler(workflowType, events, previousStartedEventId)
        .then(function (activityName) {
            return _this.swf.respondDecisionTaskCompletedAsync(getParams(activityName));
        })
        .then(function (result) {
            result.activityId = activityId;
            return result;
        });
};

swfUtils.prototype.handleActivityTask = function (activityHandler, activityTask) {
    var taskToken = activityTask.taskToken,
        activityId = activityTask.activityId,
        activityType = activityTask.activityType,
        _this = this,
        getParams = function (result) {
            return {
                taskToken: taskToken,
                result: result
            };
        };
    return activityHandler(activityType)
        .then(function (result) {
            return _this.swf.respondActivityTaskCompletedAsync(getParams(result));
        });
};

var module_export = module.exports = function (domainName, taskList) {
    // assumes environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
    var swf = Promise.promisifyAll(new AWS.SWF({region: 'us-east-1'}));
    return new swfUtils(swf, domainName, taskList);
};