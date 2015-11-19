var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    _ = require('lodash'),
    uuid = require('node-uuid');

var DOMAIN_NAME = 'tt';
var swf = Promise.promisifyAll(new AWS.SWF({region: 'us-east-1'}));

var initDomain = function (domainName) {
    return new Promise(function (resolve, reject) {
        swf.listDomainsAsync({registrationStatus: 'REGISTERED'}).then(function (domainList) {
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
            return registerDomain(domainName)
        })
        .thenReturn(domainName);
};

var registerDomain = function (domainName) {
    return swf.registerDomainAsync({name: domainName, workflowExecutionRetentionPeriodInDays: '1'});
};

var initWorkflow = function (domain, name) {
    return swf.registerWorkflowTypeAsync({
            domain: domain,
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

var initActivity = function (domain, name) {
    return swf.registerActivityTypeAsync({
            domain: domain,
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

var startWorkflowExecution = function (domain, workflow) {
    var workflowId = uuid.v1();
    return swf.startWorkflowExecutionAsync({
        domain: domain,
        workflowType: {
            name: workflow,
            version: '1.0'
        },
        workflowId: workflowId,
        childPolicy: 'TERMINATE',
        taskStartToCloseTimeout: '3600',
        taskList: {name: 'something'},
        executionStartToCloseTimeout: '86000'
    }).then(function (result) {
        result.workflowId = workflowId;
        return result;
    });
};

var terminateWorkflowExecution = function (domain, workflowId, runId) {
    return swf.terminateWorkflowExecutionAsync({
        domain: domain,
        workflowId: workflowId,
        runId: runId
    });
};

var pollForDecisionTask = function (domain) {
    return swf.pollForDecisionTaskAsync({
        domain: domain,
        taskList: {name: 'something'}
    });
};

var pollForActivityTask = function (domain) {
    return swf.pollForActivityTaskAsync({
        domain: domain,
        taskList: {name: 'something'}
    });
};

var handleDecisionTask = function (decisionTask) {
    var taskToken = decisionTask.taskToken,
        events = decisionTask.events,
        workflowType = decisionTask.workflowType,
        activityId = uuid.v1(),
        params = {
            taskToken: taskToken,
            decisions: [
                {
                    decisionType: 'ScheduleActivityTask',
                    scheduleActivityTaskDecisionAttributes: {
                        activityId: activityId,
                        activityType: {
                            name: 'popotivity',
                            version: '1.0'
                        },
                        taskList: {name: 'something'},
                        scheduleToStartTimeout: '86000',
                        scheduleToCloseTimeout: '10000',
                        startToCloseTimeout: '10000',
                        heartbeatTimeout: '3000'
                    }
                }
            ]
        };

    return swf.respondDecisionTaskCompletedAsync(params)
        .then(function (result) {
            result.activityId = activityId;
            return result;
        });
};

var respondActivityTaskCompleted = function (activityTask) {
    var taskToken = activityTask.taskToken,
        activityId = activityTask.activityId,
        activityType = activityTask.activityType,
        params = {
            taskToken: taskToken,
            result: 'result'
        };

    return swf.respondActivityTaskCompletedAsync(params);
};


var runInfo = {};
initDomain(DOMAIN_NAME)
    .then(function (domain) {
        console.log('init domain ' + domain);
        console.log(domain);
    })
    .then(initWorkflow.bind(null, DOMAIN_NAME, 'popo'))
    .then(function (result) {
        console.log('init workflow ' + result);
        console.log(result);
    })
    .then(initActivity.bind(null, DOMAIN_NAME, 'popotivity'))
    .then(function (result) {
        console.log('init activity ' + result);
        console.log(result);
    })
    .then(startWorkflowExecution.bind(null, DOMAIN_NAME, 'popo'))
    .then(function (result) {
        console.log('started workflow');
        console.log(result);
        runInfo = result;
    })
    .then(pollForDecisionTask.bind(null, DOMAIN_NAME))
    .then(function (result) {
        console.log('polled for decision task');
        console.log(result);
        return result;
    })
    .then(handleDecisionTask)
    .then(function (result) {
        console.log('handled decision task');
        console.log(result);
    })
    .then(pollForActivityTask.bind(null, DOMAIN_NAME))
    .then(function (result) {
        console.log('polled for activity task');
        console.log(result);
        return result;
    })
    .then(function(result){
        return respondActivityTaskCompleted(result);
    })
    .then(function (result) {
        console.log('handled to activity task');
        console.log(result);
    })
    .then(pollForDecisionTask.bind(null, DOMAIN_NAME))
    .then(function (result) {
        console.log('polled for decision task again');
        console.log(result);
        return result;
    })
    .then(function () {
        return terminateWorkflowExecution(DOMAIN_NAME, runInfo.workflowId, runInfo.runId);
    })
    .then(function (result) {
        console.log('terminated');
        console.log(result);
    })
    .catch(function (err) {
        console.error(err);
        console.error(err.code);
    });