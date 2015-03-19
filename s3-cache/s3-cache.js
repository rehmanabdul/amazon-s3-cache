
var AWS = require('aws-sdk');
var events = require('events');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

var homeDirectory = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var cacheDirectory = path.join(homeDirectory, 's3-cache');

module.exports = {
    
    configureCacheDir: function(dir){
        cacheDirectory = dir;
    },
    
    configureAWS: function(config){
        var keys = Object.keys(config);
        for(var i=0; i<keys.length; i++){
            var key = keys[i];
            AWS.config[key] = config[key];
        }
    },

    getFile: function(bucket, key){
        var eventEmitter = new events.EventEmitter();

        var filePath = makePath(bucket, key);

        exists(filePath, function(exists){
            if(exists){
                eventEmitter.emit('success', filePath);
                return eventEmitter.emit('complete', null, filePath);
            }
            else{
                unlink(filePath, function(error){
                    if(error){
                        eventEmitter.emit('error', new Error('Failed to unlink ' + filePath));
                        return eventEmitter.emit('complete', error);
                    }
                    download(bucket, key, filePath, eventEmitter, function(error){
                        if(error){
                            unlink(filePath, function(err){
                                eventEmitter.emit('error', error);
                                return eventEmitter.emit('complete', error);
                            });
                        }
                        else{
                            eventEmitter.emit('success', filePath);
                            return eventEmitter.emit('complete', null, filePath);
                        }
                    });
                });
            }
        });
        
        return eventEmitter;
    }
}

var download = function(bucket, key, filePath, eventEmitter, callback){
    exists(filePath, function(exists){
        if(!exists){
            mkdirp(path.dirname(filePath), function(error){
                if(error){
                    return callback(new Error('Failed to create path'));
                }

                var file = fs.createWriteStream(filePath);

                var s3 = new AWS.S3();
                var params = {Bucket: bucket, Key: key};

                s3.getObject(params)
                .on('httpData', function(chunk, response) {
                    file.write(chunk);
                })
                .on('complete', function(response) {
                    file.end();
                    if(response.error){
                        return callback(response.error);
                    }
                    else{
                        return callback(null);
                    }
                })
                .on('success', function(response) {
                })
                .on('error', function(error, response) {
                    eventEmitter.emit('error', error);
                })
                .send();
            });
        }
    });
}

var unlink = function(filePath, callback){
    exists(filePath, function(exists){
        if(exists){
            fs.unlink(filePath, function(error){
                if(error){
                    return callback(true);
                }
                return callback(false);
            });
        }
        else{
            return callback(false);
        }
    });
}

var exists = function(filePath, callback){
    fs.open(filePath, 'r', function(error, fd){
        if(error){
            return callback(false);
        }
        fs.close(fd, function(error){
        });
        return callback(true);
    });
}

var makePath = function(bucket, key){
    return path.resolve(path.normalize(path.join(cacheDirectory, bucket, key)));
}
