// tuhu.js
'use strict'

var async = require('async');
var request = require('request');
var urlencode = require('urlencode');
var dbutil = require('./dbutil.js');
var _ = require('lodash');
var sleep = require('sleep');
var citys_config = require('./citys_config.json');
const host = 'https://api.tuhu.cn';

var url_shop = host + '/Shops/SelectShopList?&serviceType=2&pageIndex=1&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district=%E8%A5%BF%E6%B9%96%E5%8C%BA&shopClassification=&City=%E6%9D%AD%E5%B7%9E%E5%B8%82&Province=%E6%B5%99%E6%B1%9F%E7%9C%81&LatBegin=30.294947&LngBegin=120.095766';
var url_shops = host + '/Shops/SelectShopList?&serviceType={serviceType}&pageIndex={pageIndex}&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district={district}&shopClassification=&City={city}&Province={province}&LatBegin={latitude}&LngBegin={longitude}';
var url_shop_property = host + '/Shops/SelectShopProperty';
var url_shop_info = host + '/Shops/FetchShopDetail?shopId={shopId}';//7277是shop_id
var url_shop_service = host + 'Shops/SelectServicesByShopId?shopId=7277&serviceType=1&vehicleId=VE-BMW3-320L';//serviceType是4种类型：轮胎、保养、
var url_area_list = host + '/Shops/SelectShopListArea?serviceType=0&cityId={cityId}&city={city}&province={province}&pids=';

var shops = [];
var exist_shop_ids = [];
var citys = [];

var querys = citys_config.querys;
var areas = citys_config.areas;

exports.fetch_hot_shops = function(callback){
	async.mapSeries(citys,function(area,done){
		console.log('>>>>>>>>>>>>>>>>>>'+area);
		LogFile.info('>>>>>>>>>>>>>>>>>>'+ JSON.stringify(area));
		fetch_shops(area,function(){

			done(null,area.city);

		});
	},function(err,result){

		callback();

	});
}

//
function fetch_all_shops(areas,callback){
	async.mapSeries(areas,function(area,done){
		console.log('>>>>>>>>>>>>>>>>>>\n>>>>>>>正在爬取'+ area.city+'\n>>>>>>>>>>>>>>>>>>');
		fetch_shops(area,function(){

			done(null,area.city);

		});
	},function(err,result){

		console.log(result);
		callback();

	});	
}

exports.fetch_all_shops = fetch_all_shops;

function fetch_shop_info2(callback){
	console.log('citys : ' + citys);
	console.log('querys : ' + querys);
// 
	async.mapSeries(querys,function(item,callback){

		// console.log(item);

		fetch_shop_info(item,function(){
			callback(null,item);
		});

	},function(err,result){
		// console.log(result);
		callback();
	});

}

exports.fetch_shop_info2 = fetch_shop_info2;


function fetch_shop_info3(callback) {
	async.waterfall([
			function(done) {
				exist_shop_ids = [];

				dbutil.queryData('tbl_tuhu_all_shops2',{},function(err, shop_result){

					console.log('query shops' + shop_result);
					
					shop_result.forEach(function(shop){
						exist_shop_ids.push(shop.ShopId);
					});
					
					done();

				});
			},
			function(done){
				shops = [];

				//把areas里的数据都取出来
				dbutil.queryData('tbl_tuhu_areas',{},function(err, areas_result){

					console.log('query areas' + areas_result);
					
					areas_result.forEach(function(city){
						city.areas.forEach(function(district){
							citys.push({
								serviceType:'0',
								pageIndex:'1',
								district:district.Region,
								city:city.city,
								province:city.province,
								lat:'29.570997',
								lng:'106.557165'
							});
						});
					});


					
					done(null,citys);

				});

			},
			function(citys,done){
				console.log(citys);

				fetch_all_shops(citys,function(){
					done(null,citys);
				});
			}
		],function(err,result){
			console.log('fetch_shop_info3 complete');
			callback();
		})

}

exports.fetch_shop_info3 = fetch_shop_info3;

function fetch_shop_info(query, callback){

	async.waterfall([
		function(done){
			dbutil.queryData('tbl_tuhu_all_shops2',query,function(err,result){ //
				var shop_info_urls = [];
				console.log('query shops' + result);
				result.forEach(function(item){
					shop_info_urls.push(url_shop_info.replace('{shopId}',item.ShopId));
				});
				done(null,shop_info_urls);
			});
		}, function(shop_info_urls,done) {
			console.log('urls :'+ shop_info_urls);
			var BYs = 0;//保养
		    var FWs = 0;//服务
		    var TRs = 0;//轮胎
		    var MRs = 0;//美容

			async.mapSeries(shop_info_urls,function(url,callback){
				var options = {
				  url: url,
				  headers: {
					'Host':'api.tuhu.cn',
					'Proxy':'27.18.131.253:8998',
					'Accept':'*/*',
					'InternetSpeed':'4.371',
					'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
					'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
					'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
					// 'Accept-Encoding':'gzip, deflate',
					'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
					'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
					'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
					'InternetType':'WIFI',
					'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
					'Connection':'keep-alive',
					'version':'iOS 3.4.3',
					'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
				  }
				};
				//获取Shop Property
				console.log(url);
				request(options,function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				    console.log(body)  
				    var data = JSON.parse(body);
				    var code = data.Code;
				    if (code == 1) {
				    	var shopDetail = data.ShopDetail;
					    var statisticses = shopDetail.Statisticses;
					    
					    if (statisticses.length != 0) {
					    	statisticses.forEach(function(item){
						    	if (item.Type == 'TR') {
						    		TRs += parseInt(item.InstallQuantity);
						    	} else if(item.Type == 'BY'){
						    		BYs += parseInt(item.InstallQuantity);
						    	} else if(item.Type == 'MR'){
						    		MRs += parseInt(item.InstallQuantity);
						    	} else if(item.Type == 'FW'){
						    		FWs += parseInt(item.InstallQuantity);
						    	}else{
						    		console.log('有一个不知道是什么的分类');
						    	}
						    });	
					    }
					    console.log({
					    	TR:TRs,
					    	BY:BYs,
					    	MR:MRs,
					    	FW:FWs
					    });
					    sleep.sleep(2);
					    callback(null,{
					    	TR:TRs,
					    	BY:BYs,
					    	MR:MRs,
					    	FW:FWs
					    });
					  } else {
					  	//这种url应该存储到其它地方，然后再拿出来去循环

					  	callback(null,{
					    	TR:0,
					    	BY:0,
					    	MR:0,
					    	FW:0
					    });
					  }
				    }else {
				    	LogFile.error(body);
				    	callback(null,{
					    	TR:0,
					    	BY:0,
					    	MR:0,
					    	FW:0
					    });
				    }
				});    
			},function(err,result){
				var cityName = '';
				if (query.City == undefined) {
					cityName = query.Province;
				} else {
					cityName = query.City;
				}
				LogFile.info(cityName + '：'+ JSON.stringify(_.last(result)));
				done(null,cityName + '：'+ JSON.stringify(_.last(result)));

			});
		}
	],function(err,result){
		console.log('======>>>'+result);
		LogFile.info(result);
		callback();
	});

}

exports.fetch_shop_info = fetch_shop_info;

function fetch_shop_property(callback){
	var options = {
	  url: url_shop_property,
	  headers: {
		'Host':'api.tuhu.cn',
		'Accept':'*/*',
		'InternetSpeed':'4.371',
		'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
		'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
		'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
		// 'Accept-Encoding':'gzip, deflate',
		'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
		'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
		'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
		'InternetType':'WIFI',
		'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
		'Connection':'keep-alive',
		'version':'iOS 3.4.3',
		'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
	  }
	};

	//获取Shop Property
	console.log(url_shop_property);

	request(options,function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var data = JSON.parse(body);
	    var beautify = data.Beautify;
	    var server = data.Server;
	    var brands = data.Brands;
	    var shopTypes = data.ShopClassifications;

	    console.log('洗美类：' + beautify);
	    console.log('服务类：' + server);
	    console.log('品牌类：' + brands);
	    console.log('店铺类型：' + shopTypes);

	    callback();
	  }
	});

}

exports.fetch_shop_property = fetch_shop_property;

/*
serviceType={serviceType}
pageIndex={pageIndex}
district={district}
City={city}
Province={province}
LatBegin={latitude}
LngBegin={longitude}

sort=HuShi
pids=FU-CARWASHING-XICHE%7C1
shopClassification=
*/

//取第一个URL里的数据
function fetch_first_shops(area,callback){
	var url_shops = host + '/Shops/SelectShopList?&serviceType={serviceType}&pageIndex={pageIndex}&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district={district}&shopClassification=&City={city}&Province={province}&LatBegin={latitude}&LngBegin={longitude}';
	var url = url_shops.replace('{serviceType}',area.serviceType)
					.replace('{pageIndex}',area.pageIndex)
					.replace('{district}',urlencode(area.district))
					.replace('{city}',urlencode(area.city))
					.replace('{province}',urlencode(area.province))
					.replace('{latitude}',area.lat)
					.replace('{longitude}',area.lng);
	console.log('========================');
	console.log(url);
	console.log('========================');

	var options = {
	  url: url,
	  headers: {
		'Host':'api.tuhu.cn',
		'Accept':'*/*',
		'InternetSpeed':'4.371',
		'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
		'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
		'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
		// 'Accept-Encoding':'gzip, deflate',
		'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
		'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
		'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
		'InternetType':'WIFI',
		'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
		'Connection':'keep-alive',
		'version':'iOS 3.4.3',
		'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
	  }
	};

	request(options,function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var data = JSON.parse(body);
	    var total_page = data.TotalPage;
	    console.log('TotalPage:' + total_page);
	    var data = JSON.parse(body);
	    var data_shops = data.Shops;
	    data_shops.forEach(function(item){
	    	console.log('##########'+exist_shop_ids.indexOf(item.ShopId));
	    	if(exist_shop_ids.indexOf(item.ShopId) == -1) {
	    		console.log('##########'+item.ShopId);
	    		shops.push(item);
	    		exist_shop_ids.push(item.ShopId);
	    	} else {
	    		console.log('ID:'+item.ShopId + '已经存在');
	    	}
	    });

	    callback(total_page);
	  }
	});
}

//取每一个URL里的数据
function fetch_shop_data(url,callback){
	var options = {
	  url: url,
	  headers: {
		'Host':'api.tuhu.cn',
		'Accept':'*/*',
		'InternetSpeed':'4.371',
		'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
		'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
		'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
		// 'Accept-Encoding':'gzip, deflate',
		'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
		'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
		'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
		'InternetType':'WIFI',
		'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
		'Connection':'keep-alive',
		'version':'iOS 3.4.3',
		'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
	  }
	};

	request(options,function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    // console.log(body)  
	    var data = JSON.parse(body);
	    var data_shops = data.Shops;
	    data_shops.forEach(function(item){
	    	console.log('##########'+exist_shop_ids.indexOf(item.ShopId));
	    	if(exist_shop_ids.indexOf(item.ShopId) == -1) {
	    		console.log('##########'+item.ShopId);
	    		shops.push(item);
	    		exist_shop_ids.push(item.ShopId);
	    	} else {
	    		console.log('ID:'+item.ShopId + '已经存在');
	    	}
	    });
	    callback();
	  }
	});
}

//获取城市，区域信息
function fetch_city_areas(callback){
	//drop table tuhu_areas
	dbutil.dropTable('tbl_tuhu_areas');
	async.mapSeries(areas,function(item,done){
		console.log('获取'+ JSON.stringify(item)+'的区域信息');
		LogFile.info('获取'+JSON.stringify(item)+'的区域信息');

		fetch_area_info(item,function(err,areas){
			item["areas"] = areas;
			console.log(item);
			dbutil.saveOne(item,'tbl_tuhu_areas',function(result){
				done(null,item);	
			});
		});

	},function(err,result){
		console.log('完成获取'+result+'的信息');
		LogFile.info('完成获取'+JSON.stringify(result)+'的信息');
	});
}

exports.fetch_city_areas = fetch_city_areas;

/*
* fetch_areas
* area 区域参数 
*/
function fetch_area_info(area,callback){

	LogFile.info('fetch area list' + area);
	console.log(area);
	console.log(area.cityId);
	console.log(area.city);
	console.log(area.province);

	var url_area = url_area_list
		.replace('{cityId}',area.cityId)
		.replace('{city}',urlencode(area.city))
		.replace('{province}',urlencode(area.province));
	console.log('>>>>>'+url_area);
	var options = {
	  url: url_area,
	  headers: {
		'Host':'api.tuhu.cn',
		'Accept':'*/*',
		'InternetSpeed':'4.371',
		'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
		'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
		'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
		// 'Accept-Encoding':'gzip, deflate',
		'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
		'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
		'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
		'InternetType':'WIFI',
		'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
		'Connection':'keep-alive',
		'version':'iOS 3.4.3',
		'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
	  }
	};

	request(options,function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var data = JSON.parse(body);
	    console.log(JSON.parse(body).Areas);
	    sleep.sleep(5);
	    callback(null,JSON.parse(body).Areas);
	  }else {
	  	LogFile.error(url_area + '请求失败' + error);
	  	callback('Error ' + error);
	  }
	});
}


function fetch_shops (area,callback){
	async.waterfall([
		function(done){
			fetch_first_shops(area,function(result){
				console.log('fetch_first_shops done');
				
				LogFile.info('fetch_first_shops complete area:' + area);

				done(null,result);
			});
		},
		function(pageNumber,done){
			console.log('second:'+pageNumber);
			LogFile.info('second:'+pageNumber);
			//这里组装一个url的数组
			create_url_shops(area, pageNumber, function(result){
				done(null,result);
			});
		},
		function(urls,done){

			console.log('=================');
			async.eachSeries(urls,function(item,callback){
				console.log('正在处理'+item);
				fetch_shop_data(item,function(){
					sleep.sleep(2);
					callback();
				});
			}, function(err,result){
				console.log('全部URL完成');
				done();
			});
		}
	],function(err,result){
		console.log('=================>>>>>\n\r'+shops);
		LogFile.info('=================>>>>>\n\r'+shops);
		console.log('全部完成');
		if (shops.length > 0) {
			dbutil.saveMany(shops,'tbl_tuhu_all_shops2',function(result){
		        console.log('all save done');
		        LogFile.info(area + '店铺保存成功');
		        shops = [];
		        callback();
		    });	
	    } else {
	    	callback();
	    }
	});
};

// DCCP, DRM, 车险, 金融, 车务

function create_url_shops (area,pageNumber,callback){
	var urls = [];
	for (var i = 2; i<= parseInt(pageNumber); i++) {
		
		var url = url_shops.replace('{serviceType}',area.serviceType)
					.replace('{pageIndex}',i)
					.replace('{district}',urlencode(area.district))
					.replace('{city}',urlencode(area.city))
					.replace('{province}',urlencode(area.province))
					.replace('{latitude}',area.lat)
					.replace('{longitude}',area.lng);

		urls.push(url);
		LogFile.info('input url to urls:'+url);
	}

	callback(urls);
}






