'use strict'
/**
che300模块
author: sagaris
create: 2016-10-19
*/
var cheerio = require('cheerio');
var superagent = require('superagent');
var dbutil = require('./dbutil.js');
var async = require('async');
var URL = require('url');
var cacheutil = require('./cacheutil');

var redis = require('redis');
var client = redis.createClient();

//url config
var url_main = 'http://www.che300.com/';
var url_series = 'http://meta.che300.com/meta/series/series_brand${brand_id}.json?v=1475147550';
var url_city = 'http://www.che300.com/switch_city.htm';

//
var brands = [];
var series = [];
var datas = [];
var citys = [];

//获取品牌
exports.fetchBrand = function(callback){
	dbutil.dropTable('tbl_che300_brands');

	var promise = new Promise(function (resolve, reject) {
        superagent.get(url_main).end(function (err, res) {
            if (err) {
                reject(err);
            }
            // sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
            // 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
            // 剩下就都是 jquery 的内容了
            var $ = cheerio.load(res.text);

            $('div').find('.list_1').each(function(idx,element){
                // console.log("name:"+ $(this).text()+"  id:"+$(this).attr('id') + "  rel:" + $(this).attr('rel'));
                var _id = $(this).attr('id');
                var name = $(this).text();
                var spell = $(this).attr('rel');
                var source = '车300';

                brands.push({
                    net_id: _id,
                    brand_name: name,
                    spell: spell,
                    source: source
                });
                resolve(brands);
            });
        });
    });
    promise.then(function(value){
        dbutil.saveMany(value,'tbl_che300_brands',function(result){
            console.log('done');
            callback(value);
        });

    },function(err){
        console.log(err);
    });
}

//获取车系
exports.fetchSeries = function(brands,callback){
	dbutil.dropTable('tbl_che300_series');

	async.mapLimit(brands,2,function(item,callback){
		var url = url_series.replace('${brand_id}',item.net_id);
		console.log(url);
		superagent.get(url).end(function (err, res) {
			if (err) {
		      console.error(err);
		    }

		    if(res !== undefined){
				callback(null,{
					net_id: item.net_id,
					brand_name: item.brand_name,
					spell: item.spell,
					source: item.source,
					series: JSON.parse(res.text)
				})
		    }else{
		    	LogFile.error(url);
		    }
		});
		
	},function(err,result) { 
		dbutil.saveMany(result,'tbl_che300_series',function(result){
    		console.log('series done!');
    		callback('done');
    	});
	});
}

exports.test = function(callback){
	LogFile.info('test');
	cacheutil.redis_set(123,{name:'dcriori',age:12});
	LogFile.info(cacheutil);
	cacheutil.redis_get(123,function(err,result){
		console.log(result);
	});
	callback();
}

//获取城市列表
exports.fetchCitys = function(callback){
	dbutil.dropTable('tbl_che300_citys'); //删除原来数据
	var promise = new Promise(function (resolve, reject) {
		superagent
		.get(url_city)
			.set('Host','www.che300.com')
        	.set('Connection','keep-alive')
        	.set('Cache-Control','max-age=0')
        	.set('Upgrade-Insecure-Requests','1')
        	.set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        	.set('Accept-Encoding','gzip, deflate, sdch')
        	.set('Accept-Language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
    	.timeout(3600*1000)
    	.end(function (err, res) {
			if (err) {
            	console.log("fetchCitys  get \""+url_city+"\" error !"+err);
		    	reject(err);
		    }

		    var $ = cheerio.load(res.text);
		    var province = '热门地区';
		    //处理热门城市
		    $('.city_hot_content').map(function(idx,element){
		    	// console.log('>>>'+ $(this).find('a').text());
		    	var city_id = $(this).find('.cityItem').attr('data-id');

		    	$(this).find('a').map(function(idx,element){
		    		var city_name = $(this).text();
			    	var link = 'http://www.che300.com/buycar'+$(this).attr('href');
	    	 		citys.push({
		    			province: province,
		    			city_id: city_id,
		    			city_name: city_name,
		    			link: link
		    		});
		    		resolve(citys);
		    	});
		    });

		    //处理省市
		    $('.city_province_list').map(function(idx,element){
		    	var province = $(this).find('span').text();
		    	var city_id = $(this).find('.cityItem').attr('data-id');
		    	$(this).find('a').map(function(idx,element){
		    		var city_name = $(this).text();
		    		var link = 'http://www.che300.com/buycar'+$(this).attr('href');
		    		citys.push({
		    			province: province,
		    			city_id: city_id,
		    			city_name: city_name,
		    			link: link
		    		});
		    		resolve(citys);
		    	});
		    });
		});
	});

	promise.then(function(value){
        dbutil.saveMany(value,'tbl_che300_citys',function(result){
            callback(value);
        });

    },function(err){
        console.error(err);
    });
}


exports.fetch_data = function(callback) {

	// // 删除redis的数据
	// client.select(15,function(err,res) {
	// 	client.flushdb( function (err, succeeded) {
	//     	console.log(succeeded); // will be true if successfull
	// 	});	
	// });
	
	//获取车辆信息
	dbutil.queryData('tbl_che300_citys',{province:'热门地区'},function(err,result){
		console.log(result);
		var i = 0;
		async.eachSeries(result,function(cityItem,done){
			fetch_city_data(cityItem,function(err2,result2){
				//result2 返回当前城市下所有页面的url
				if(err2){
					console.log("fetch_data get \""+cityItem.link+"\" error !"+err);
                	LogFile.error("fetch_data get \""+cityItem.link+"\" error !"+err);
				}else{
					console.log('=============================\n\r \n\r'+cityItem.city_name+'\n\r');
					// console.log(result2);

					//async each series 
					async.eachSeries(result2,function(url,done2){
						// done2('error:hahaha');
						var start_time = new Date().getTime();	//抓取起始时间

						superagent
					    	.get(url)
					        	.set('Host','www.che300.com')
					        	.set('Connection','keep-alive')
					        	.set('Cache-Control','max-age=0')
					        	.set('Upgrade-Insecure-Requests','1')
					        	.set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
					        	.set('Accept-Encoding','gzip, deflate, sdch')
					        	.set('Accept-Language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
					        .timeout(3600*1000)
					        .end(function(err,mes) {

					        	console.log('====>'+url);

					        	if(err){
					        		console.log("get : " + url + " error : " + err);
					                done2(err);
					        	}else{
					        		console.log('开始解析'+ cityItem.city_name + '  ' + url +'的数据');

					        		//fetch_detail_data 开始
					        		fetch_detail_data(mes,start_time,function(error){

					        			if(error && error.break){
					        				done2('Error =======');
					        			} else {
					        				done2();
					        			}
						            });
						            //fetch_detail_data 开始
					        	}
					        });

					},function(err){
						done();
					});
				}
			});
		},function(err){
			//结束回调
			callback(null,result);
		});
	});
}

function fetch_detail_data(res,start_time,callback){

	console.time('waterfall');
	async.waterfall([
	    function (done) {
	    	//解析这个url页面返回的HTML数据，从中拿到车辆详情
			var $=cheerio.load(res.text);

		    var jsonData = [];
		    var status = 0;

		    $('.list-item').each(function(idx,element){
		    	var title = $(this).attr('title');
		    	var arr = $(this).find('a');
		    	var detail_item_url = $(arr[0]).attr('href');//取Iem的明细URL，取item detail 的 id
		    	var detail_id =  detail_item_url.replace('http://www.che300.com/buycar/x','');
		    	// var detail_id =  detail_item_url.replace('http://www.che300.com/buycar/','');
		    	var source_url = getValue($(arr[1]).attr('href'),'url');
				var source = getValue($(arr[1]).attr('href'),'source');

		    	var prr = $(this).find('p');
		    	var type = $(prr[0]).text();
		    	split_type(type);
		    	var info = $(prr[1]).text().replace(/\s+/g, "");

		    	var price = $(prr[2]).text().trim().replace(/\s+/g, "");
		    	var seller = $(this).find('span.seller').text();

		    	var itemJSON = {
		    		title: title,
		    		detail_id: detail_id,
		    		type: split_type(type),
		    		info: split_info(info),
		    		price: price,
		    		seller: seller,
		    		source: source,
		    		source_url: source_url
		    	};

		    	jsonData.push(JSON.stringify(itemJSON));
		    });

		    done(null,jsonData);

	    },
	    //这里去做对比
	    function (json_data, done) {

	    	async.eachSeries(json_data,function(item,cb){

				var detail_id = JSON.parse(item).detail_id;

    			client.select(12,function(err,res) {
		    		//选择库
		    		if(err) {
				        
				        console.log(err);
				        cb(err);

				    } else {

				    	client.get(parseInt(detail_id),function(err,result){
			    			//获取detail_id
			    			if(result){
			    				
			    				LogFile.info('id ' + detail_id +' 存在  get info:' + item);
			    				console.log('id ' + detail_id +' 存在  get info:' + JSON.parse(item));
			    				cb('Error 已经存在','');

			    			} else {
			    				
			    				dbutil.saveOne(JSON.parse(item), 'tbl_che300_detail',function(result){
			    					LogFile.info('id ' + detail_id +' 不存在');
			    					console.log('id ' + detail_id +' 不存在');
							    	var time = new Date().getTime() - start_time;
							        LogFile.info('抓取并入库成功', '，耗时' + time + '毫秒'); 	
							        console.log('抓取并入库成功', '，耗时' + time + '毫秒');
					            });

			    				client.set(parseInt(detail_id),JSON.stringify(item));

			    				cb();
			    			}
			    		});
				    }
		    	});

	    	},function(err,result){
	    		console.log('$$$$$:'+err +' result:'+result);

	    		if (err) {
				    var fakeErr = new Error();
			    	fakeErr.break = true;
			    	callback(fakeErr,'abc');
			    } else {
			    	done(null, 'abc');	
			    }

	    		
	    	});
	    },
	], function (error, result) {
	    console.log('>>>>>>>>'+result);
	    console.timeEnd('waterfall');//还有这么牛B的东西啊
	    if (error) {
		    var fakeErr = new Error();
	    	fakeErr.break = true;
	    	callback(fakeErr);
	    } else {
	    	callback();
	    }

	});

}

function fetch_city_data(cityItem,callback){
	console.log(cityItem.city_name);
	console.log(cityItem.link);	
	var page_urls = [];
	//获取城市车辆信息并入库
	superagent
	.get(cityItem.link)
		.set('Host','www.che300.com')
    	.set('Connection','keep-alive')
    	.set('Cache-Control','max-age=0')
    	.set('Upgrade-Insecure-Requests','1')
    	.set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    	.set('Accept-Encoding','gzip, deflate, sdch')
    	.set('Accept-Language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
	.timeout(3600*1000)
	.end(function (err, res) {
		if(err){
            console.log("fetch city data get \""+cityItem.link+"\" error !"+err);
            LogFile.error("fetch city data get \""+cityItem.link+"\" error !"+err);
            callback(err);
        }else{
        	var $ = cheerio.load(res.text);
		    //获取随便一个翻页url
		    var href = $('.pagination').find('a').last().attr('href');

		    if(href !==undefined){
			    var href_url = URL.parse(href);
			    //把url的参数去掉
			    var url = href.replace(href_url.query,'');
			    var span = $('.pagination').find('span').text();
			    var pages = parseInt(span.replace(/[^0-9]/ig,""));
			    var p = '';
			    for(var i=0; i<pages; i++){
			    	if (i===0) {
			    		p = '';
			    	}else{
			    		p = i*20;
			    	}
			    	page_urls.push(url+'p='+p);
			    }
		    }else{
		    	page_urls.push(cityItem.link);
		    }
            callback(null,page_urls);
        }
	});
}

//获取车辆信息
exports.fetchData = function(callback){
	// 删除redis的数据
	// client.flushdb( function (err, succeeded) {
	//     console.log(succeeded); // will be true if successfull
	// });

	//先取出热门地区
	dbutil.queryData('tbl_che300_citys',{province:'热门地区'},function(err, result){
		console.log(result);
		var items = [];
		result.forEach(function(item){
			items.push(item);
		});
		LogFile.info(JSON.stringify(items)); //加入日志
		console.log(items);
		// fetchCityData(items,callback);
	});
}

function fetchCityData(cityItems,callback){
	
	async.eachSeries(cityItems,function(cityItem,done){

		var page_urls = [];
		superagent
		.get(cityItem.link)
			.set('Host','www.che300.com')
        	.set('Connection','keep-alive')
        	.set('Cache-Control','max-age=0')
        	.set('Upgrade-Insecure-Requests','1')
        	.set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        	.set('Accept-Encoding','gzip, deflate, sdch')
        	.set('Accept-Language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
		.timeout(3600*1000)
		.end(function (err, res) {
			if(err){
                console.log("fetchCityData get \""+cityItem.link+"\" error !"+err);
                LogFile.error("fetchCityData get \""+cityItem.link+"\" error !"+err);
            }
		    var $ = cheerio.load(res.text);
		    //获取随便一个翻页url
		    var href = $('.pagination').find('a').last().attr('href');

		    if(href !==undefined){
			    var href_url = URL.parse(href);

			    //把url的参数去掉
			    var url = href.replace(href_url.query,'');
			    var span = $('.pagination').find('span').text();
			    var pages = parseInt(span.replace(/[^0-9]/ig,""));
			    var p = '';
			    for(var i=0; i<pages; i++){
			    	if (i===0) {
			    		p = '';
			    	}else{
			    		p = i*20;
			    	}
			    	page_urls.push(url+'p='+p);
			    }
		    }else{
		    	page_urls.push(cityItem.link);
		    }

		    fetchDetailData(page_urls,function(){
		    	done();
		    });
		});
		
	}, function(){
		LogFile.info('execute fetchCityData function');
		callback('done!');
    });
}

//获取车300的详细二手车辆信息
function fetchDetailData(page_urls,callback){

	async.eachSeries(page_urls,function(url,done){

		var fetchStart = new Date().getTime();	//抓取起始时间
		
		LogFile.info('开始获取- ' + url + ' -详细信息');
		console.log('开始获取- ' + url + ' -详细信息');

        superagent
    	.get(url)
        	.set('Host','www.che300.com')
        	.set('Connection','keep-alive')
        	.set('Cache-Control','max-age=0')
        	.set('Upgrade-Insecure-Requests','1')
        	.set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        	.set('Accept-Encoding','gzip, deflate, sdch')
        	.set('Accept-Language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
        .timeout(3600*1000)
        .end(function(err,mes){
            
            if(err){
                console.log("get : " + url + " error : " + err);
                done(err);
            } else if( mes.status == 200 && mes !== undefined) {

	          	fetch_detail_data(mes,fetchStart,function(err){
	            	
	            	if (err && err.break){
	            		console.log('==>>'+err.break);
				      	done(err);
				    }else{
				    	console.log('==>>>>>'+err.break);
				      	done();
				    }
	            });  

            } else {
            	console.log('==>>>>>>>');
            	done('Error:获取车辆信息失败！');
            }
        });
    },function(error){
        console.log("result :::::>>>");
        callback(error);
    });
}


function split_info(info){

	var arr = info.split('/');
	
	return {
		date: arr[0],
		kilometer: arr[1],
		position: arr[2],
		source: arr[3]
	};
}

function split_type(type){

	var arr = type.split(' ');
	return {
		type1: arr[0],
		type2: arr[1],
		type3: arr[2],
		type4: arr[3],
		type5: arr[4],
		type6: arr[5],
	};
}

//此函数目前没用
function parseQueryString(str) {
    var reg = /(([^?&=]+)(?:=([^?&=]*))*)/g;
    var result = {};
    var match;
    var key;
    var value;
    while (match = reg.exec(str)) {
        key = match[2];
        value = match[3] || '';
        result[key] = decodeURIComponent(value);
    }
    return result;
}

function getValue(url, name) {
	var reg = new RegExp('(\\?|&)' + name + '=([^&?]*)', 'i');
	var arr = url.match(reg);

	if (arr) {
		return arr[2];
	}

	return null;
}

function isURL(url){
	var regexp = new RegExp('(http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?', 'gi');
	var urls = url.match(regexp) || [];
	console.log(urls);
	return urls;
}