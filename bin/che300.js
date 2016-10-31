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
// var sleep = require('sleep');sleep

var log4js = require("log4js");
var log4js_config = require("./log_config.json");
log4js.configure(log4js_config);


var url_main = 'http://www.che300.com/';
var url_series = 'http://meta.che300.com/meta/series/series_brand${brand_id}.json?v=1475147550';
var url_city = 'http://www.che300.com/switch_city.htm';

var brands = [];
var series = [];
var datas = [];
var citys = [];

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

exports.fetchSeries = function(brands,callback){
	dbutil.dropTable('tbl_che300_series');

	async.map(brands,function(item,callback){
		var url = url_series.replace('${brand_id}',item.net_id);
		console.log(url);
		superagent.get(url).end(function (err, res) {
			if (err) {
		      console.error(err);
		    }
			callback(null,{
				net_id: item.net_id,
				brand_name: item.brand_name,
				spell: item.spell,
				source: item.source,
				series: JSON.parse(res.text)
			});
			//存放一份
			series.push({
				net_id: item.net_id,
				brand_name: item.brand_name,
				spell: item.spell,
				source: item.source,
				series: JSON.parse(res.text)
			});
		});
		
	},function(err,result) { 

    	dbutil.saveMany(result,'tbl_che300_series',function(result){
    		console.log('series done!');
    	});
	});

	
}

exports.fetchCitys = function(callback){
	dbutil.dropTable('tbl_che300_citys');
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
		    	console.log('>>>'+ $(this).find('a').text());
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

exports.fetchData = function(callback){
	console.log("log_start start!");

	var LogFile = log4js.getLogger('che300_log');

	LogFile.trace('This is a Log4js-Test');
	LogFile.debug('We Write Logs with log4js');
	LogFile.info('You can find logs-files in the log-dir');
	LogFile.warn('log-dir is a configuration-item in the log4js.json');
	LogFile.error('In This Test log-dir is : \'./logs/log_test/\'');

	//先取出热门地区
	dbutil.queryData('tbl_che300_citys',{city_name:'南京'},function(err, result){
		var items = [];
		result.forEach(function(item){
			items.push(item);
		});
		console.log('>>>>>===<<<<<<' + JSON.stringify(items));
		fetchCityData(items,callback);
	});
}

function fetchCityData(cityItems,callback){
	// var promise = new Promise(function (resolve, reject) {
	
	async.each(cityItems,function(cityItem,callback){
		console.log(cityItem.city_name +':::'+ JSON.stringify(cityItem.link) +'.......');
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
                // console.log("message info:"+JSON.stringify(mes));
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
			    // callback(null,page_urls);
			    fetchDetailData(page_urls,callback);
		    }
		});
		
	}, function(error,results){

		console.log('execute fetchCityData function '+results);

        callback();
    });
}


//获取车300的详细二手车辆信息
function fetchDetailData(page_urls,callback){

	async.map(page_urls,function(url,callback){
		var fetchStart = new Date().getTime();	//抓取起始时间
		console.log('.......>>>>'+url);
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
                console.log("get \""+url+"\" error !"+err);
            }
            
            if(mes !== undefined) {
	            var $=cheerio.load(mes.text);

	            var jsonData = [];

	            $('.list-item').each(function(idx,element){
	            	var title = $(this).attr('title');
	            	var arr = $(this).find('a');
	            	var detail_item_url = $(arr[0]).attr('href');//取Iem的明细URL，取item detail 的 id
	            	var detail_id =  detail_item_url.replace('http://www.che300.com/buycar/x','');
	            	var source_url = getValue($(arr[1]).attr('href'),'url');
					var source = getValue($(arr[1]).attr('href'),'source');

	            	var prr = $(this).find('p');
	            	var type = $(prr[0]).text();
	            	split_type(type);
	            	var info = $(prr[1]).text().replace(/\s+/g, "");
	            	// console.log('>>>'+JSON.stringify(split_info(info)));

	            	var price = $(prr[2]).text().trim().replace(/\s+/g, "");
	            	var seller = $(this).find('span.seller').text();
					
					// console.log('source_url = ' + source_url + '\n\rsource = ' + source);

	            	jsonData.push({
	            		title: title,
	            		detail_id: detail_id,
	            		type: split_type(type),
	            		info: split_info(info),
	            		price: price,
	            		seller: seller,
	            		source: source,
	            		source_url: source_url
	            	});
	            });
	            
	            dbutil.saveMany(jsonData, 'tbl_che300_detail',function(result){
	            	var time = new Date().getTime() - fetchStart;
			        console.log('抓取' + url + '并入库成功', '，耗时' + time + '毫秒'); 
	            	callback(null,jsonData);	
	            });
            }
        });
    },function(error,results){
        console.log("result :::::>>>"+results);
        callback();
    });
}

function split_info(info){

// 2012年10月
// 7.3万公里
// 北京
// 瓜子二手车

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