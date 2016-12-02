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
var url_series = 'http://meta.che300.com/meta/series/series_brand${brand_id}.json?v=1479546715';
var url_city = 'http://www.che300.com/switch_city.htm';
var url_models = 'http://meta.che300.com/meta/model/model_series${series_id}.json?v=1479546715';

//
var brands = [];
var series = [];
var models = [];


var citys = [];
var datas = {};

exports.fetch_auto_info = function(callback){
	// function(series,done){
	// 		var new_series = [];
	// 		// console.log('query brands' + exist_values);
	// 		// 取出已有品牌信息后，将集合传给第二个函数；然后通过首页（url_main）获取再有的品牌信息

	// 		async.eachSeries(exist_series_ids,function(item, callback){
	// 			var url = url_series.replace('${brand_id}',item);
	// 			console.log(url);
	// 			superagent.get(url).end(function (err, res) {
	// 	            if (err) {
	// 	                done('Error 网络访问出错')
	// 	                callback('Error 网络访问出错',null);
	// 	            } else{
	// 	            	// sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
	// 	            	// 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
	// 	            	// 剩下就都是 jquery 的内容了

	// 		          	if(res !== undefined){
	// 		          		var series_item = JSON.parse(res.text);
	// 						forEach(function(item){
	// 							if(exist_series_ids.indexOf(series_item.series_id) == -1){
	// 								new_series.push({
	// 									brand_id: item.net_id,
	// 									series_id: series_item.series_id,
	// 									series_name: series_item.series_name,
	// 									series_group_name: series_item.series_group_name
	// 								});
	// 							}
	// 						});

	// 				    }else{
	// 				    	LogFile.error(url);
	// 				    	callback('Error 解析数据出错', null);
	// 				    }

	// 		            console.log('====================');
	// 		            console.log(new_series);
	// 		            console.log('====================');

	// 		            //调用下一个方法
	// 		            done(null,new_series);
	// 	            }
		            
	// 	        });
	// 		},function(err,new_series){
	// 			console.log('====>>>'+err);
	// 			if (err) {
	// 				console.log(err);
	// 			}else{
	// 				//new_brands可能为空
	// 				if(new_series.length > 0){
	// 					console.log('====>>>'+brands);
	// 					dbutil.saveMany(new_series,'tbl_che300_series',function(result){
	// 			            console.log('done');
	// 			            new_series.forEach(function(item){
	// 			            	console.log('new item is :'+ JSON.stringify(item));
	// 			            	series.push(item);
	// 			            });
	// 			            callback(series);
	// 			        });	
	// 				}else{
	// 					callback(series);
	// 				}
	// 			}
	// 		});
	// 	}
}

//获取品牌
exports.fetch_brand = function(callback){
	// drop table tbl_che300_brands
	// dbutil.dropTable('tbl_che300_brands');

	async.waterfall([
		// 第一个函数，先取出已经存在tbl_che300_brands里的品牌数据
		function(done){
			dbutil.queryData('tbl_che300_brands',{},function(err,result){
				// console.log('query brands' + result);
				var exist_brand_ids = [];
				for(var index in result){
					exist_brand_ids.push(result[index].net_id);
					brands = result;
				}
				done(null,exist_brand_ids);
			});
		}, function(exist_brand_ids,done){
			var new_brands = [];
			// console.log('query brands' + exist_values);
			// 取出已有品牌信息后，将集合传给第二个函数；然后通过首页（url_main）获取再有的品牌信息
			superagent.get(url_main).end(function (err, res) {
	            if (err) {
	                done('Error 网络访问出错')
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

	                if (exist_brand_ids.indexOf(_id) == -1) {

	                	new_brands.push({
		                    net_id: _id,
		                    brand_name: name,
		                    spell: spell,
		                    source: source
		                });

		                console.log('push '+{
		                    net_id: _id,
		                    brand_name: name,
		                    spell: spell,
		                    source: source
		                } + 'into db');
		                LogFile.info('push '+{
		                    net_id: _id,
		                    brand_name: name,
		                    spell: spell,
		                    source: source
		                } + 'into db');
	                }

	            });
	            console.log('====================');
	            console.log(new_brands);
	            console.log('====================');

	            //调用下一个方法
	            done(null,new_brands);
	        });
		}
	],
	// 取出品牌后
	function(err,new_brands){
		console.log('====>>>'+err);
		if (err) {
			console.log(err);
		}else{
			//new_brands可能为空
			if(new_brands.length > 0){
				dbutil.saveMany(new_brands,'tbl_che300_brands',function(result){
		            console.log('done');
		            new_brands.forEach(function(item){
		            	console.log('new item is :'+ JSON.stringify(item));
		            	brands.push(item);
		            });
		            callback(null,brands);
		        });	
			}else{
				callback(null,brands);
			}
		}
	});
}



//获取车系
exports.fetch_series = function(brands,callback){

	async.waterfall([
		// 第一个函数，先取出已经存在tbl_che300_series里的车系数据
		function(done){
			var exist_series_ids = [];
			dbutil.queryData('tbl_che300_series',{},function(err,result){
				console.log('query series' + result);
				if (result.length == 0) {
					done(null,[]);
				} else {	
					series = result;
					for(var index in result){
						exist_series_ids.push(result[index].series_id);
					}
					done(null,exist_series_ids);
				}
				
			});
		}, 

		function(exist_series_ids,done){

			// 使用品牌来到网上查所有品牌的车系信息
			fetch_series_from_brands(brands, exist_series_ids, function(err, series){
				
				
				done(null,series);

			});	
		}
	],
	// 取出车系后
	function(err,new_series){
		
		if (err) {
			console.log(err);
		}else{
			//new_series可能为空
			callback(null,series);
		}
	});
	// dbutil.dropTable('tbl_che300_series');
}

function fetch_series_from_brands(brands, exist_series_ids, callback){
	async.mapSeries(brands,function(item,done){
		var url = url_series.replace('${brand_id}',item.net_id);
		console.log(url);
		superagent.get(url).end(function (err, res) {
			if (err) {
		      console.error(err);
		    }

		    if(res !== undefined){
		    	var items = JSON.parse(res.text);
		    	var insert_series = [];
		    	
		    	console.log('exist_series_ids' + exist_series_ids);

		    	console.log('items' + JSON.stringify(items));

		    	items.forEach(function(series_item){
		    		if (exist_series_ids.indexOf(series_item.series_id) == -1) {
		    			series.push({
								brand_id: item.net_id,
								series_id: series_item.series_id,
								series_name: series_item.series_name,
								series_group_name: series_item.series_group_name
							});

			    		LogFile.info({
								brand_id: item.net_id,
								series_id: series_item.series_id,
								series_name: series_item.series_name,
								series_group_name: series_item.series_group_name
							});

			    		insert_series.push({
								brand_id: item.net_id,
								series_id: series_item.series_id,
								series_name: series_item.series_name,
								series_group_name: series_item.series_group_name
							});
		    		}
		    	});
		    	if (insert_series.length > 0) {
		    		dbutil.saveMany(insert_series,'tbl_che300_series',function(result){
			    		console.log('series done!');
			    		done(null,insert_series);
			    	});	
		    	}else{
		    		console.log('series null!');
		    		done(null,[]);
		    	}
		    }else{
		    	LogFile.error(url);
		    	done('Error 数据解析错误！');
		    }
		});
		
	},function(err,series) { 
		
    	callback(null,series);

	});
}

//获取城市列表
exports.fetch_citys = function(callback){
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
	dbutil.queryData('tbl_che300_citys',{province:'河北'},function(err,result){
		// console.log(result); //打印获取到的所有城市集合
		var i = 0;
		//async 第一层使用 eachSeries 
		async.eachSeries(result,function(cityItem,done){
			
			//获取城市
			fetch_city_data(cityItem,function(err2,result2){
				//result2 返回当前城市下所有页面的url
				if(err2){
					console.log("fetch_data get \""+cityItem.link+"\" error !"+err);
                	LogFile.error("fetch_data get \""+cityItem.link+"\" error !"+err);
				}else{
					console.log('正在获取 【' + cityItem.city_name +'】 的车辆信息,共'+result2.length+'页');
					LogFile.info('正在获取 【' + cityItem.city_name +'】 的车辆信息,共'+result2.length+'页');
					// console.log('=============================\n\r \n\r'+cityItem.city_name+'\n\r');
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
						            //fetch_detail_data 结束
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
	//这里使用waterfall,第一个函数返回所有的当前页面的车辆信息
	//第二个方法里拿这些车辆信息与redis里面的数据做对比
	//
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
			    					// LogFile.info('id ' + detail_id +' 不存在');
			    					// console.log('id ' + detail_id +' 不存在');
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

	    		if (err) {
				    var fakeErr = new Error();
			    	fakeErr.break = true;
			    	callback(fakeErr);
			    } else {
			    	done(null, result);	
			    }
	    	});
	    },
	], 
	//这里做最后的处理
	function (error, result) {
	    console.log(result);
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