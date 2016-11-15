#!/usr/bin/env node 

var program = require('commander');
var che300 = require('./che300.js');
var dbutil = require('./dbutil.js');
var log = require('./logutil.js');
var schedule = require('node-schedule');

program
    .version('1.0.0')
    .usage('<keywords>')
    .parse(process.argv);

if(!program.args.length) {
    program.help();
} else {
    var keywords = program.args;
    // var url = 'https://api.github.com/search/repositories?sort=stars&order=desc&q='+keywords;
    // console.log('keywords url: '+url);

    global.LogFile =  log.createLogger('log_date');
    LogFile.info('=====创建连接池=====');

    //创建连接池
	dbutil.createPool();

	// //车300
 //    che300.fetchBrand(function(brands){
 //    	console.log('fetch brands done!');
 // 		// 获取车系
 //    	che300.fetchSeries(brands,function(result){
 //    		console.log('fetch series done!');
 //            dbutil.drain();
 //            process.exit(1);
	// 	});	
 //    });

    // //获取城市
    // che300.fetchCitys(function(result){
    // 	console.log('done');
    //      //获取二手车数据
    //     che300.fetchData(function(){
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log("result :::::>>>");
    //         console.log('done!')
    //         dbutil.drain();
    //         process.exit(1);
    //     });
    // });

    // var j = schedule.scheduleJob('0 27 * * * *', function(){
    //     console.log('The answer to life, the universe, and everything!');
        
    // });
    
    che300.fetch_data(function(err,result){
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log("result :::::>>>");
        console.log('done!')
        dbutil.drain();
        process.exit(1);
    });


    // che300.test(function(){
    //     console.log('done');
    // });

}