# s3-cache
Enables reading files from Amazon S3 buckets with local caching

## Example
```node

var s3Cache = require('amazon-s3-cache');

s3Cache.configureAWS({
    region: 'us-west-2'
});

s3Cache.configureCacheDir('/');

s3Cache.getFile('bucket', 'key')
.on('error', function(error){
    console.log('ERROR');
    console.log(error);
})
.on('success', function(filePath){
    console.log('SUCCESS');
    console.log(filePath);
})
.on('complete', function(error, filePath){
    console.log('COMPLETE');
    console.log(error);
    console.log(filePath);
});

```
