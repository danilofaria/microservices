var Promise = require("bluebird"),
    AWS = require('aws-sdk'),
    _ = require('lodash'),
    uuid = require('node-uuid');

var DOMAIN_NAME = 'tt',
    TASK_LIST = 'taskList';

var runInfo = {};
var swfTest = require('./swf/swfUtils')(DOMAIN_NAME, TASK_LIST);
swfTest.initDomain()
    .then(function (domain) {
        console.log('init domain ' + domain);
        console.log(domain);
    })
    .then(swfTest.initWorkflow.bind(swfTest, 'popo'))
    .then(function (result) {
        console.log('init workflow ' + result);
        console.log(result);
    })
    .then(swfTest.initActivity.bind(swfTest, 'popotivity'))
    .then(function (result) {
        console.log('init activity ' + result);
        console.log(result);
    })
    .then(swfTest.startWorkflowExecution.bind(swfTest, 'popo'))
    .then(function (result) {
        console.log('started workflow');
        console.log(result);
        runInfo = result;
    })
    .then(swfTest.pollForDecisionTask.bind(swfTest))
    .then(function (result) {
        console.log('polled for decision task');
        console.log(result);
        return result;
    })
    .then(swfTest.handleDecisionTask.bind(swfTest, _.constant(Promise.fulfilled('popotivity'))))
    .then(function (result) {
        console.log('handled decision task');
        console.log(result);
    })
    .then(swfTest.pollForActivityTask.bind(swfTest))
    .then(function (result) {
        console.log('polled for activity task');
        console.log(result);
        return result;
    })
    .then(function(result){
        return swfTest.handleActivityTask(_.constant(Promise.fulfilled('some result')), result);
    })
    .then(function (result) {
        console.log('handled to activity task');
        console.log(result);
    })
    .then(swfTest.pollForDecisionTask.bind(swfTest))
    .then(function (result) {
        console.log('polled for decision task again');
        console.log(result);
        return result;
    })
    .then(function () {
        return swfTest.terminateWorkflowExecution(runInfo.workflowId, runInfo.runId);
    })
    .then(function (result) {
        console.log('terminated');
        console.log(result);
    })
    .catch(function (err) {
        console.error(err);
        console.error(err.code);
    });