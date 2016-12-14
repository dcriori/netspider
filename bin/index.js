#!/usr/bin/env node 

var program = require('commander');
var che300 = require('./che300.js');
var dbutil = require('./dbutil.js');
var log = require('./logutil.js');
var schedule = require('node-schedule');
var async = require('async');
var tuhu = require('./tuhu');
var tuhu_tmall = require('./tuhu_tmall');


program
    .version('1.0.0')
    .usage('<keywords>')
    .parse(process.argv);

if(!program.args.length) {
    program.help();
} else {

    var keywords = program.args;
    // var url = 'https://api.github.com/search/repositories?sort=stars&order=desc&q='+keywords;
    console.log('keywords url: '+ keywords);

    global.LogFile =  log.createLogger('log_date');
    LogFile.info('=====创建连接池=====');

    //创建连接池并添加到全局
	dbutil.createPool();

    if (keywords == 'che300') {
        che300();
    } else if(keywords == 'tuhu'){
        tuhu.fetch_shop_info2(function(){
            console.log('hahaha');
        });
    } else if(keywords == 'dsrw') {
        console.log('开启定时任务');
        var j = schedule.scheduleJob('0 5 7,18 * * *', function(){
            console.log('The answer to life, the universe, and everything!');
            tuhu.fetch_shop_info2(function(){
                console.log('hahaha');
            });
        });
    } else if(keywords == 'tmall'){
        tuhu_tmall.fetch_tmall_data(function(){
            console.log('fetch tuhu tmall data');
            
        });
    } else {

    }
}

function tuhu() {

    // tuhu.fetch_hot_shops(function(){
    //     console.log('FETCH_SHOPS COMMPLETE!!!');
        // dbutil.drain();
        // process.exit(1);
    // });

    // tuhu.fetch_all_shops(function(){
    //     console.log('FETCH_SHOPS COMMPLETE!!!');
    // });

    tuhu.fetch_shop_info2(function(){
        console.log('hahaha');
    });

    //获取各种服务类型
    // tuhu.fetch_shop_property(function(err,result){
    //     console.log('fetch shop property!!!');
    // });

    //获取城市，区域等信息
    // tuhu.fetch_city_areas(function(err,result){

    //     console.log('fetch city areas!!!');

    // });

}

function che300() {

    async.waterfall([
        function(done){

            che300.fetch_brand(function(err, brands){
                console.log('fetch brands done!' + brands);
                done(null,brands);
            });

        },function(brands,done){
            console.log('第二个函数');

            // for(var i = brands.length - 5; i >= 0; i--) {
            //     brands.splice(i, 1);
            // }
            // console.log(brands);

            // 获取车系
            che300.fetch_series(brands,function(err, series){
                console.log('fetch series done!');
                done(null,series);
            }); 
        }
        ,function(series,done){
            che300.fetch_models(series,function(err, result){
                console.log('fetch models done!');
            });
        }
    ],
    function(err,result){
        console.log('fetch brands,series,models done!');
        dbutil.drain();
        process.exit(1);

    });

    //车300
    
    // //获取城市
    // che300.fetch_citys(function(result){
    //  console.log('done');
        // dbutil.drain();
        // process.exit(1);       
    // });

    // var j = schedule.scheduleJob('7 * * * * *', function(){
    //     console.log('The answer to life, the universe, and everything!');
        
    // });
    
    // che300.fetch_data(function(err,result){
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log("result :::::>>>");
    //     console.log('done!')
    //     dbutil.drain();
    //     process.exit(1);
    // });
}