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
		superagent.get(url_city).end(function (err, res) {
			if (err) {
		      console.error(err);
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
        console.log(err);
    });
}

exports.fetchData = function(callback){
	//先取出热门地区
	dbutil.queryData('tbl_che300_citys',{province:'热门地区'},function(err, result){
		result.forEach(function(item){
			fetchCityData(item);
		});
	});
}

function fetchCityData(cityItem){
	var promise = new Promise(function (resolve, reject) {
		var page_urls = [];
		superagent.get(cityItem.link).end(function (err, res) {
			if (err) {
		      console.error(err);
		      reject(err);
		    }
		    var $ = cheerio.load(res.text);

		    //获取随便一个翻页url
		    var href = $('.pagination').find('a').last().attr('href');
		    // console.log('=====>'+href);
		    var p = URL.parse(href);
		    // console.log('=====>'+p.query);
		    // console.log('=====>'+href.replace(p.query,''));
		    //把url的参数去掉
		    var url = href.replace(p.query,'');
		    
		    var span = $('.pagination').find('span').text();
		    var pages = parseInt(span.replace(/[^0-9]/ig,""));
		    // console.log(cityItem.city_name+':'+ pages);

		    for(var i=0; i<pages; i++){
		    	if (i===0) {
		    		p= '';
		    	}else{
		    		p = i*20;
		    	}
		    	page_urls.push(url+'p='+p);
		    }
		    resolve(page_urls);
		});
	});

	promise.then(function(value){

		fetchDetailData(value);

	},function(err){
		console.error(err);
	});
}


//获取车300的详细二手车辆信息
function fetchDetailData(page_urls){
	async.mapLimit(page_urls,3,function(url,callback){
        superagent.get(url).end(function(err,mes){
            if(err){
                console.log("get \""+url+"\" error !"+err);
                console.log("message info:"+JSON.stringify(mes));
            }
            console.log('fetch '+url+" succeful !");
            //console.log("mess info:"+JSON.stringify(mes));
            var $=cheerio.load(mes.text);

            var jsonData = [];

            $('.list-item').each(function(idx,element){
            	var arr = $(this).find('a');

            	var prr = $(this).find('p');
            	var type = $(prr[0]).text();
            	split_type(type);
            	var info = $(prr[1]).text().replace(/\s+/g, "");
            	
            	console.log('>>>'+JSON.stringify(split_info(info)));

            	var price = $(prr[2]).text().trim().replace(/\s+/g, "");
            	var seller = $(this).find('span.seller').text();
				var source_url = getValue($(arr[1]).attr('href'),'url');
				var source = getValue($(arr[1]).attr('href'),'source');

				// console.log('source_url = ' + source_url + '\n\rsource = ' + source);

            	jsonData.push({
            		title: $(this).attr('title'),
            		type: split_type(type),
            		info: split_info(info),
            		price: price,
            		seller: seller,
            		source: source,
            		source_url: source_url
            	});
            });

            // console.log("aim data is :"+JSON.stringify(jsonData));
            dbutil.saveMany(jsonData, 'tbl_detail_datas',function(result){
            	callback(null,jsonData);	
            });
            
            
        });
    },function(error,results){
        console.log("result :");
        console.log(results);    
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
	console.log(arr[0]);
	console.log(arr[1]);
	console.log(arr[2]);
	console.log(arr[3]);
	console.log(arr[4]);
	console.log(arr[5]);
	return {
		type1: arr[0],
		type2: arr[1],
		type3: arr[2],
		type4: arr[3],
		type5: arr[4],
		type6: arr[5],
	};
}

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