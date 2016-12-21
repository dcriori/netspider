/**
db.js
author: sagaris
create: 2016-10-20
*/

//数据库&连接池
var poolModule = require('generic-pool');
var mongodb = require("mongodb");


function DBUtil() {

}

DBUtil.prototype.createPool = function () {
	//创建连接池
	var pool = poolModule.Pool({
	  name     : 'mongodb',
	  create   : function(callback) {
	    var server_options={'auto_reconnect':false,poolSize:1};
	    var db_options={w:-1};
	    var mongoserver = new mongodb.Server('localhost', 27017,server_options );
	    var db=new mongodb.Db('db_test', mongoserver, db_options);
	    db.open(function(err,db){
	      if(err)return callback(err);
	      callback(null,db);
	    });
	  },
	  destroy  : function(db) { db.close(); },
	  max      : 10,//根据应用的可能最高并发数设置
	  idleTimeoutMillis : 30000,
	  log : false
	});
	//设置连接池为全局变量，这样在其它任何一个地方使用db_pool,则可以使用数据连接池的连接
	global.DB_POOL = pool;
};

DBUtil.prototype.drain = function(){
	global.DB_POOL.destroyAllNow();
}

DBUtil.prototype.saveOne = function(value,table_name,callback){
	//从连接池中获取db实例
    DB_POOL.acquire(function(err, db) {
        if (err) {
            console.error('>>>'+JSON.stringify(err,null,2));
        } else {
            //collection相当于table
            var collection = db.collection(table_name);
            collection.insertOne(value,function(err,result){
                if(err)console.error(err);
                callback(result);
                DB_POOL.release(db);//关闭连接
            });
        }
    });
}

DBUtil.prototype.saveMany = function(list,table_name,callback){
	//从连接池中获取db实例
    DB_POOL.acquire(function(err, db) {
        if (err) {
            console.error(JSON.stringify(err,null,2));
        } else {
            //collection相当于table
            var collection = db.collection(table_name);
            collection.insertMany(list,function(err,result){
                if(err)console.error(err);
                console.log(JSON.stringify(result,null,2));
                callback(result);
                DB_POOL.release(db);//关闭连接
            });
        }
    });
}



DBUtil.prototype.dropTable = function(table_name){
	DB_POOL.acquire(function(err, db){
		if(err){
			console.error(JSON.stringify(err,null,2));
		}else{
			db.collection(table_name, function(err, collection) {                                      
		    	collection.remove(); 
		    	DB_POOL.release(db);//关闭连接                
			});
		}
	});
}

DBUtil.prototype.queryData = function(table_name,query,callback){
	DB_POOL.acquire(function(err, db){
		if(err){
			console.error(JSON.stringify(err,null,2));
		}else{
			var collection = db.collection(table_name);
			collection.find(query).toArray(function(err,result){
				if(err){callback(err,null);}
				callback(null,result);
				DB_POOL.release(db);//关闭连接
			});
		}
	});
}

module.exports = new DBUtil();