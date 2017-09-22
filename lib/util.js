let async = require('async')
let fs = require('fs')
let clone = require('clone')
let cmd = require('./cmd')

/**
 * Execute command if srcFile is newer than dstFile
 * Example:
 *  eisn('Program.java', 'Program.class', 'javac Program.java', function(result, success, errorMessage){
 *     console.log(result)
 *  })
 * Output:
 *  {'is_command_executed' : true} 
 *
 * @param {string} srcFile
 * @param {string} dstFile
 * @param {string} command
 * @param {function} callback
 *
 */
function eisn(srcFile, dstFile, command, callback){
    // preprocess finalCallback
    if(util.isFunction(finalCallback)){
        finalCallback = function(result, success, errorMessage){
            console.log(JSON.stringify({'result':result, 'success':success, 'errorMessage':errorMessage}))
        }
    }
    // define result
    let result = {'is_command_executed':true}
    async.series([
        // get source fileStat
        (callback) => {
            file.stat(srcFile, (error, srcStat) => {
                if(error){
                    // cannot get stat of srcFile, stop here
                    console.error('[ERROR] Cannot get file stat of ' + srcFile)
                    console.error(error)
                    result.is_command_executed = false
                    finalCallback(result, false, error.stack)
                }
                else{
                    callback()
                }
            })
        },
        // try access destination file 
        (callback) => {
            fs.access(dstFile, function(error){
                if(error){
                    // dstFile isn't accessible, assume it doesn't exists, execute the command and stop here
                    cmd.get(command, function(error, data, stderr){
                        if(error){
                            result.is_command_executed = false
                            finalCallback(result, true, error.stack)
                        }
                        else{
                            finalCallback(result, true, error.stack)
                        }
                    })
                }
                else{
                    callback()
                }
            })
        },
        // get destination fileStat
        (callback) => {
            fs.stat(dstFile, function(error, dstStat){
                if(!error && srcStat.mtime > dstStat.mtime){
                    cmd.get(command, function(error, data, stderr){
                        if(error){
                            result.is_command_executed = false
                            finalCallback(result, true, error.stack)
                        }
                        else{
                            finalCallback(result, true, error.stack)
                        }
                    })
                }
                else{
                    result.is_command_executed = false
                    finalCallback(result, true, error.stack)
                }
            })
        }
    ], (error, result) => {})
}

// this one is for benchamarking
/**
 * Get formatted nano second
 * Example:
 *  formatNanoSecond(process.hrtime())
 * Output:
 *  string, formatted nano second
 */
function formatNanoSecond(time){
    let nano = time[0] * 1e9 + time[1]
    return nano.toLocaleString()
}


// deep copy an object, now using clone rather than JSON.parse(JSON.stringify(obj))
function deepCopy(obj){
    return clone(obj)
}

// patch object with patcher
function patchObject(obj, patcher){
    obj = deepCopy(obj)
    patcher = deepCopy(patcher)
    // patch
    for(let key in patcher){
        if((key in obj) && isRealObject(object[key]) && isRealObject(patcher[key])){
            // recursive patch for if value type is object
            obj[key] = patchObject(obj[key], patcher[key])
        }
        else{
            // simple replacement if value type is not object
            obj[key] = patcher[key]
        }
    }
    return obj
}

function smartSplit(string, delimiter){
    let singleQuoteCount = 0
    let doubleQuoteCount = 0
    let data = []
    let word = ''
    for(let i=0; i<string.length; i++){
        let chr = string.charAt(i)
        if(string.substring(i,i+delimiter.length) == delimiter && doubleQuoteCount % 2 == 0 && singleQuoteCount % 2 == 0){
            data.push(word.trim())
            i+= delimiter.length-1
            word = ''
        }
        else{
            if(i>0 && string.charAt(i-1) != '\\'){
                if(chr == "'"){
                    singleQuoteCount ++
                }
                else if(chr == '"'){
                    doubleQuoteCount ++
                }
            }
            word += chr
        }
    }
    data.push(word.trim())
    return data
}

/**
 * quote a string 
 * Example:
 *  quote('string')
 * Output:
 *  '"string"'
 *
 * @param {string} string
 */
function quote(string){
    string = string.replace(/"/g, '\\\"')
    string = string.replace(/\n/g, '\\n')
    string = string.trim()
    string = '"'+string+'"'
    return string
}

/**
 * unquote a string 
 * Example:
 *  unquote('"string"')
 *  unquote("'string'")
 * Output:
 *  'string'
 *
 * @param {string} string
 */
function unquote(string){
    string = string.trim()
    if(string.match(/^"(.*)"$/g) || string.match(/^'(.*)'$/g)){
        string = string.substring(1, string.length-1)
        string = string.replace(/\\\\/g, '\\')
    }
    return string
}

function isString(value){
    return String.isString(value) || value instanceof String
}

function isArray(value){
    return Array.isArray(value) || value instanceof Array
}

function isObject(value){
    return Object.isObject(value) || value instanceof Object
}

function isRealObject(value){
    return !isString(value) && !isArray(value) && isObject(value)
}

function isUndefined(value){
    return typeof(value) == 'undefined'
}

function isNull(value){
    return value === null
}

function isNullOrUndefined(value){
    return typeof(value) == 'undefined' || value === null
}

function isFunction(value){
    return typeof(value) == 'function'
}

function compose(...fns) {
    return function (result) {
        for (let i = fns.length-1; i>=0; i--) {
            result = fns[i].call(this, result)
        }
        return result
    };
};

function replaceKey(obj, oldKey, newKey){
    // using dictionary? parse it recursively
    if(isRealObject(oldKey) && isNullOrUndefined(newKey)){
        let dict = oldKey
        for(let key in dict){
            obj = replaceKey(obj, key, dict[key])
        }
        return obj
    }
    // real action
    if(oldKey in obj){
        obj[newKey] = deepCopy(obj[oldKey])
        delete obj[oldKey]
    }
    return obj
}

function assignDefaultValue(obj, key, value){
    // using dictionary? parse it recursively
    if(isRealObject(key) && isNullOrUndefined(value)){
        let dict = key
        for(let key in dict){
            obj = assignDefaultValue(obj, key, dict[key])
        }
        return obj
    }
    // real action
    if(!(key in obj)){
        obj[key] = value
    }
    return obj
}

module.exports = {
    'eisn' : eisn,
    'formatNanoSecond' : formatNanoSecond,
    'deepCopy' : deepCopy,
    'patchObject' : patchObject,
    'smartSplit' : smartSplit,
    'quote' : quote,
    'unquote' : unquote,
    'isString' : isString,
    'isArray' : isArray,
    'isObject' : isObject,
    'isRealObject' : isRealObject,
    'isUndefined' : isUndefined,
    'isNull' : isNull,
    'isNullOrUndefined' : isNullOrUndefined,
    'replaceKey' : replaceKey,
    'assignDefaultValue' : assignDefaultValue,
    'compose' : compose,
}