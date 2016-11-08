// cacheutil.js
'use strict'

var redis = require('redis'),
client = redis.createClient();


exports.redis_set = function(key,value){
	LogFile.info('set function execute!');
	console.log('set function execute!');
	client.select(15, function(err,res){
	  // you'll want to check that the select was successful here
	  // if(err) return err;
	  client.set(key, value, redis.print); // this will be posted to database 1 rather than db 0
	});
}

exports.redis_get = function(key,callback){
	LogFile.info('get function execute!');
	console.log('get function execute!');
	client.select(15, function(err,res){
		client.get(key,function(err,result){
			LogFile.info(result);
			callback(err,result);
		});
	});

}
