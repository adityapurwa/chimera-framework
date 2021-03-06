#! /usr/bin/env node
'use strict';

const async = require('async')
const assert = require('assert')
const chimera = require('chimera-framework/core')
const cmd = chimera.cmd
const childProcess = require('child_process')

const currentPath = process.cwd()
let serverProcess = null

function createAsserter(expectedResult){
    if(typeof(expectedResult) == 'function'){
        return expectedResult
    }
    return function(output){
        assert(output == expectedResult, 'FAIL, Expected: '+expectedResult+', Actual: '+output)
    }
}

function testExecuteCommand(testName, command, expectedResult, callback){
    let startTime = process.hrtime();
    console.warn('START ' + testName + ' ON nanosecond: ' + chimera.getFormattedNanoSecond(startTime) + '\n')
    cmd.get(command, function(err, data, stderr){
        let diff = process.hrtime(startTime);
        let endTime = process.hrtime();
        data = data.trim('\n')
        // show command
        console.warn(command)
        // show data
        console.warn(data)
        // do assertion
        let asserter = createAsserter(expectedResult)
        asserter(data)
        console.warn('END ' + testName + ' ON nanosecond: ' + chimera.getFormattedNanoSecond(endTime))
        console.warn('EXECUTION TIME: ' + chimera.getFormattedNanoSecond(diff) + ' nanosecond')
        callback()
    })
}

function testExecuteChain(testName, chain, inputs, presets, expectedResult, callback){
    let startTime = process.hrtime();
    console.warn('START ' + testName + ' ON nanosecond: ' + chimera.getFormattedNanoSecond(startTime) + '\n')
    chimera.executeChain(chain, inputs, presets, function(output, success, errorMessage){
        let diff = process.hrtime(startTime);
        let endTime = process.hrtime();
        // show chain
        console.warn(chain)
        // show output
        console.warn(output);
        // do assertion
        let asserter = createAsserter(expectedResult)
        asserter(output)
        console.warn('END ' + testName + ' ON nanosecond: ' + chimera.getFormattedNanoSecond(endTime))
        console.warn('EXECUTION TIME: ' + chimera.getFormattedNanoSecond(diff) + ' nanosecond')
        callback()
    });
}

let mongoDbAsserter = (output)=>{
    try{
        output = JSON.parse(output)
    }
    catch(error){}

    assert(output.insert_doc.name == 'Tono Stark', 'FAIL, insert_doc.name should be Tono Stark\n')
    assert(output.update_doc.name == 'Toni Stark', 'FAIL, update_doc.name should be Toni Stark\n')

    assert(output.another_insert_doc.name == 'Tono Stark', 'FAIL, another_insert_doc should be Tono Stark\n')
    assert(output.insert_bulk_docs.length == 2, 'FAIL, insert_bulk_docs\n')
    assert(output.update_bulk_docs.length == 3, 'FAIL, update_bulk_docs\n')
    for(let i=0; i<3; i++){
        assert(output.update_bulk_docs[i].affiliation == 'Avenger', 'FAIL, update_bulk_docs['+i+'].affiliation should be Avenger\n')
    }

    assert(output.superman_doc.name == 'Clark Kent', 'FAIL, superman_doc.name should be Clark Kent\n')


    assert(output.ironman_doc.name == 'Toni Stark', 'FAIL, ironman_doc.name should be Toni Stark\n')

    assert(output.ironman_doc_with_name_1.name == 'Toni Stark', 'FAIL, ironman_doc_with_name_1.name shoud be Toni Stark\n')
    assert(!('affiliation' in output.ironman_doc_with_name_1), 'FAIL, ironman_doc_with_name_1 should not contain affiliation\n')

    assert(output.ironman_doc_no_name_1.affiliation == 'Avenger', 'FAIL, ironman_doc_no_name_1.affiliation shoud be Avenger\n')
    assert(!('name' in output.ironman_doc_no_name_1), 'FAIL, ironman_doc_no_name_1 should not contain name\n')
    assert(output.ironman_doc_with_name_1._id == output.ironman_doc_no_name_1._id, 'FAIL, ironman_doc_with_name_1 and ironman_doc_no_name_1 should have the same _id\n')

    assert(JSON.stringify(output.ironman_doc_no_name_2) == JSON.stringify(output.ironman_doc_no_name_1), 'FAIL, ironman_doc_no_name_2 should be the same with ironman_doc_no_name_1\n')
    assert(JSON.stringify(output.ironman_doc_no_name_3) == JSON.stringify(output.ironman_doc_no_name_1), 'FAIL, ironman_doc_no_name_3 should be the same with ironman_doc_no_name_1\n')

    assert(JSON.stringify(output.ironman_doc_with_name_2) == JSON.stringify(output.ironman_doc_with_name_1), 'FAIL, ironman_doc_with_name_2 should be the same with ironman_doc_with_name_1\n')
    assert(JSON.stringify(output.ironman_doc_with_name_3) == JSON.stringify(output.ironman_doc_with_name_1), 'FAIL, ironman_doc_with_name_3 should be the same with ironman_doc_with_name_1\n')

    assert(output.find_docs.length == 4, 'FAIL, find_docs.length should be 4\n')
    assert(!('_history' in output.find_docs[0]), 'Fail, find_docs[0] should not contains _history\n')

    assert(output.find_limited_skipped_sorted_docs[0].name == 'Clark Kent', 'FAIL, find_limited_sorted_docs[0].name should be Clark Kent\n')
    assert(output.find_limited_skipped_sorted_docs.length == 2, 'FAIL, find_limited_skipped_sorted_docs.length should be 2\n')
    assert(output.find_limited_skipped_sorted_docs[0].name == 'Clark Kent', 'FAIL, find_limited_skipped_sorted_docs[0].name should be Clark Kent\n')
    assert(output.find_limited_skipped_sorted_docs[1].name == 'Steve Roger', 'FAIL, find_limited_skipped_sorted_docs[1].name should be Steve Roger\n')

    assert(output.find_limited_sorted_filtered_docs.length == 2, 'FAIL, find_limited_sorted_filtered_docs.length should be 2\n')
    assert(output.find_limited_sorted_filtered_docs[0].alias == 'Captain America', 'FAIL, find_limited_sorted_filtered_docs[0].alias should be Captain America\n')
    assert(output.find_limited_sorted_filtered_docs[1].alias == 'Hulk', 'FAIL, find_limited_sorted_filtered_docs[1].alias should be Hulk\n')
    assert(!('name' in output.find_limited_sorted_filtered_docs[0]), 'FAIL, find_limited_sorted_filtered_docs[0] should not have name\n')

    assert(output.find_avenger_docs.length == 3, 'FAIL, find_avenger_docs.length should be 3\n')
    assert(output.find_sharingan_docs.length == 5, 'FAIL, find_sharingan_docs.length should be 5\n')
    assert(('_history' in output.find_sharingan_docs[0]), 'Fail, find_sharingan_docs[0] should contains _history\n')

    assert(output.aggregation_result[0].count == 4, 'FAIL, aggregation_result[0].count should be 4\n')

    assert(output.sum_all_result == 126, 'FAIL, sum_all_result should be 126\n')
    assert(output.sum_avenger_result == 93, 'FAIL, sum_avenger_result should be 93\n')
    assert(output.sum_by_affiliation_result['Justice League'] == 33, 'FAIL, sum_by_affiliation_result["Justice League"] should be 33\n')
    assert(output.sum_by_affiliation_result['Avenger'] == 93, 'FAIL, sum_by_affiliation_result["Avenger"] should be 93\n')

    assert(output.avg_all_result == 31.5, 'FAIL, avg_all_result should be 31.5\n')
    assert(output.avg_avenger_result == 31, 'FAIL, avg_avenger_result should be 31\n')
    assert(output.avg_by_affiliation_result['Justice League'] == 33, 'FAIL, avg_by_affiliation_result["Justice League"] should be 33\n')
    assert(output.avg_by_affiliation_result['Avenger'] == 31, 'FAIL, avg_by_affiliation_result["Avenger"] should be 31\n')

    assert(output.max_all_result == 33, 'FAIL, max_all_result should be 33\n')
    assert(output.max_avenger_result == 32, 'FAIL, max_avenger_result should be 32\n')
    assert(output.max_by_affiliation_result['Justice League'] == 33, 'FAIL, max_by_affiliation_result["Justice League"] should be 33\n')
    assert(output.max_by_affiliation_result['Avenger'] == 32, 'FAIL, max_by_affiliation_result["Avenger"] should be 32\n')

    assert(output.min_all_result == 30, 'FAIL, min_all_result should be 30\n')
    assert(output.min_avenger_result == 30, 'FAIL, min_avenger_result should be 30\n')
    assert(output.min_by_affiliation_result['Justice League'] == 33, 'FAIL, min_by_affiliation_result["Justice League"] should be 33\n')
    assert(output.min_by_affiliation_result['Avenger'] == 30, 'FAIL, min_by_affiliation_result["Avenger"] should be 30\n')

    assert(output.permanent_remove_result.ok == 1, 'FAIL, permanent_remove_result.ok should be 1\n')
    assert(output.permanent_remove_result.n == 5, 'FAIL, permanent_remove_result.n should be 5\n')
}


// Run the test
async.series([

    // test database
    (callback) => {testExecuteCommand('Test mongo driver',
        'chimera "tests/mongo-driver.yaml"', mongoDbAsserter, callback)
    },
    (callback) => {testExecuteChain('Test mongo driver',
        'tests/mongo-driver.yaml', [], {}, mongoDbAsserter, callback)
    },

    // test executeChain with various
    (callback) => {
        chimera.executeChain('tests/increment.yaml', function(output, error, errorMessage){
            assert(output == 1, 'FAIL, Expected : 1, Actual : '+output)
            console.log('Success: executeChain without input and preset')
            callback()
        })
    },
    (callback) => {
        chimera.executeChain('tests/increment.yaml', {'inc':5}, function(output, error, errorMessage){
            assert(output == 5, 'FAIL, Expected : 5, Actual : '+output)
            console.log('Success: executeChain without input ')
            callback()
        })
    },
    (callback) => {
        chimera.executeChain('tests/increment.yaml', [1], function(output, error, errorMessage){
            assert(output == 2, 'FAIL, Expected : 2, Actual : '+output)
            console.log('Success: executeChain without preset ')
            callback()
        })
    },

    // test execute chain

    (callback) => {testExecuteChain('Test executeChain without presets',
        'tests/minimal.yaml', [1, 5], {}, -23, callback)
    },

    (callback) => {testExecuteChain('Test executeChain with presets',
        'tests/minimal.yaml', [1, 5], {'a':1, 'b':1}, -23, callback)},

    (callback) => {testExecuteChain('Test executeChain containing empty object',
        'tests/empty.yaml', [0], {}, '', callback)},

    (callback) => {testExecuteChain('Test executeChain containing infinite loop, expect error',
        'tests/infinite-loop.yaml', [0], {}, '', callback)},

    // test execute command

    (callback) => {testExecuteCommand('Test error handling: no error',
        'chimera tests/error-handling.yaml 6 6', 12, callback)},

    (callback) => {testExecuteCommand('Test error handling: error less',
        'chimera tests/error-handling.yaml 5 6', '', callback)},

    (callback) => {testExecuteCommand('Test error handling: error more',
        'chimera tests/error-handling.yaml 6 5', '', callback)},

    (callback) => {testExecuteCommand('Test Empty process with single argument',
        'chimera "(a)->-> b" 6', 6, callback)},

    (callback) => {testExecuteCommand('Test Empty process with two argument',
        'chimera "(a,b)->->(c)" 6 5', '[6,5]', callback)},

    (callback) => {testExecuteCommand('Test Empty process with single argument and shorthand',
        'chimera "(a)--> b" 6', 6, callback)},

    (callback) => {testExecuteCommand('Test Empty process with two argument and shorthand',
        'chimera "(a,b)-->(c)" 6 5', '[6,5]', callback)},


    (callback) => {testExecuteCommand('Test JSON instead of YAML',
        'chimera tests/add.json 1 5', 6, callback)},

    (callback) => {testExecuteCommand('Test javascript arrow function',
        'chimera tests/add-js.yaml 1 5', 6, callback)},

    (callback) => {testExecuteCommand('Test complete',
        'chimera tests/complete.yaml 1 5', -23, callback)},

    (callback) => {testExecuteCommand('Test minimal',
        'chimera tests/minimal.yaml 1 5', -23, callback)},

    (callback) => {testExecuteCommand('Test inline-1',
        'chimera "(a, b) -> node tests/programs/add.js -> c" 1 5', 6, callback)},

    (callback) => {testExecuteCommand('Test inline-2',
        'chimera "(a, b) -> node tests/programs/add.js" 1 5', 6, callback)},

    (callback) => {testExecuteCommand('Test implode',
        'chimera tests/implode.yaml 1 2 3', '1, 2, 3', callback)},

    (callback) => {testExecuteCommand('Test control-1',
        'chimera tests/control.yaml 5', 8, callback)},

    (callback) => {testExecuteCommand('Test control-2',
        'chimera tests/control.yaml 12', 11, callback)},

    (callback) => {testExecuteCommand('Test simple-command',
        'chimera tests/simple-command.yaml 5 6', 11, callback)},

    (callback) => {testExecuteCommand('Test nested-control',
        'chimera tests/nested-control.yaml','1112*1314**2122*2324**3132*3334**',callback)},

    (callback) => {testExecuteCommand('Test complex-vars',
        'chimera tests/complex-vars.yaml 5 6', -176, callback)},

    (callback) => {testExecuteCommand('Test add',
        'chimera tests/add.yaml 5 6', 11, callback)},

    (callback) => {testExecuteCommand('Test add-module',
        'chimera tests/add-module.yaml 5 6', 11, callback)},

    (callback) => {testExecuteCommand('Test add-module-twice',
        'chimera tests/add-module-twice.yaml 5 6', 17, callback)},

    (callback) => {testExecuteCommand('Test arithmetic-module',
        'chimera tests/arithmetic-module.yaml 5 6 "*"', 30, callback)},

    (callback) => {testExecuteCommand('Test sub-chimera',
        'chimera tests/sub-chimera.yaml 5 4', 18, callback)},

    // run chimera server
    (callback) => {
        let callbackExecuted = false
        let env = chimera.deepCopyObject(process.env)
        env['PORT'] = 3010
        serverProcess = childProcess.spawn('chimera-serve', [], {'env': env, 'cwd':process.cwd()})
        // if error, show message and kill
        serverProcess.on('error', (err)=>{
            console.error(err)
            serverProcess.kill()
        })
        // if success, run callback
        serverProcess.stdout.on('data', function(stdout){
            console.log(String(stdout))
            if(!callbackExecuted){
                callbackExecuted = true
                callback()
            }
        })
        serverProcess.stderr.on('data', function(stderr){
            console.error(String(stderr))
        })
    },

    // test distributed
    (callback) => {testExecuteCommand('Test distributed',
        'chimera tests/distributed.yaml 5 4 http://localhost:3010', 18, callback)},

    // kill chimera server
    (callback) => {
        serverProcess.kill()
        callback()
    },

], (result, error) => {
    assert(process.cwd() == currentPath, 'FAIL: current path doesn\'t set back')
    console.log('ALL TEST SUCCESS: No error encountered or all errors were caught')
    console.log('NOTE: Please make sure you have run "sudo npm link first" before running the test')
    console.log('      Otherwise, please re-run the test.')
})
