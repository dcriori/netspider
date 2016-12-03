// tuhu.js
'use strict'

var async = require('async');
var request = require('request');
var urlencode = require('urlencode');
var dbutil = require('./dbutil.js');
var _ = require('lodash');
var sleep = require('sleep');

const host = 'https://api.tuhu.cn';

var url_shop = host + '/Shops/SelectShopList?&serviceType=2&pageIndex=1&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district=%E8%A5%BF%E6%B9%96%E5%8C%BA&shopClassification=&City=%E6%9D%AD%E5%B7%9E%E5%B8%82&Province=%E6%B5%99%E6%B1%9F%E7%9C%81&LatBegin=30.294947&LngBegin=120.095766';
var url_shops = host + '/Shops/SelectShopList?&serviceType={serviceType}&pageIndex={pageIndex}&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district={district}&shopClassification=&City={city}&Province={province}&LatBegin={latitude}&LngBegin={longitude}';
var url_shop_property = host + '/Shops/SelectShopProperty';
var url_shop_info = host + '/Shops/FetchShopDetail?shopId={shopId}';//7277是shop_id
var url_shop_service = host + 'Shops/SelectServicesByShopId?shopId=7277&serviceType=1&vehicleId=VE-BMW3-320L';//serviceType是4种类型：轮胎、保养、

var shops = [];
var areas = [
{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'杭州市',
	province:'浙江省',
	lat:'30.294947',
	lng:'120.095766'
},{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'北京市',
	province:'北京市',
	lat:'39.909780',
	lng:'116.433737'
},
{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'南京市',
	province:'江苏省',
	lat:'32.044947',
	lng:'118.785766'
}
,{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'上海市',
	province:'上海市',
	lat:'31.255923',
	lng:'121.462056'
},{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'广州市',
	province:'广东省',
	lat:'23.135308',
	lng:'113.270793'
},{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'深圳市',
	province:'广东省',
	lat:'22.548515',
	lng:'114.066112'
},{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'武汉市',
	province:'湖北省',
	lat:'30.598428',
	lng:'114.311831' 
},{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'成都市',
	province:'四川省',
	lat:'29.570997',
	lng:'106.557165'
}
];

function fetch_all_shops(callback){
	async.mapSeries([{
	serviceType:'0',
	pageIndex:'1',
	district:'',
	city:'',
	province:'',
	lat:'29.570997',
	lng:'106.557165'
}],function(area,done){
		console.log('>>>>>>>>>>>>>>>>>>'+area);
		fetch_shops(area,function(){

			done(null,area.city);

		});
	},function(err,result){

		callback();

	});

	// console.log('fetch_all_shops');
	// var pages_arr = [];
	// var faile_arr = [];

	// for (var i = 1;i<=1000; i++) {
	// 	pages_arr.push(i);
	// }

	
	// async.mapSeries(pages_arr,function(item,callback){
	// 	var url_all_shop = 'https://api.tuhu.cn/Shops/SelectShopList?&serviceType=0&pageIndex=${pageIndex}&sort=HuShi&pids=FU-CARWASHING-XICHE%7C1&district=&shopClassification=&City=&Province=&LatBegin=30.294947&LngBegin=120.095766';
	// 	var options = {
	// 	  url: url_all_shop.replace('${pageIndex}',item),
	// 	  headers: {
	// 		'Host':'api.tuhu.cn',
	// 		'Accept':'*/*',
	// 		'InternetSpeed':'4.371',
	// 		'car':'{"VehicleID": "VE-BMW3-320L", "PaiLiang": "2.0T", "Nian": "2015", "LiYangID": "", "TID": "14770"}',
	// 		'key':'2535148e-70d6-4ec3-b37a-ef81907f23c9',
	// 		'Accept-Language':'zh-Hans-CN;q=1, en-CN;q=0.9',
	// 		// 'Accept-Encoding':'gzip, deflate',
	// 		'usersession':'F76033A5CCFB78AA017DB03F71390EA9',
	// 		'DeviceID':'121A818D-5AEA-4436-85F0-22576D9D70EF',
	// 		'User-Agent':'Tuhu/3.4.3 (iPhone; iOS 10.0.2; Scale/2.00)',
	// 		'InternetType':'WIFI',
	// 		'black_box':'ewogICJlcnJvck1zZyIgOiAiRXJyb3IgRG9tYWluPXVuZmluaXNoZWQgQ29kZT0wIFwiKG51bGwpXCIiLAogICJvcyIgOiAiaU9TIiwKICAiYmxhY2tCb3giIDogIk1qUlFXOGxoSnlBZlk4SXJZU1wvQzNEdGJXbU5jWEM3aFhTcWlZOGRuWm4zc1krZEk0a0pIUVFNN1NFTlE5K1orXC9VbE40K0JLNFVoSjlEbDcrVitSVFJJaTdTQndZbXh1WnlVaUt5UXFOUFFCTjRrZ0g1VWdHT2t4SmpNd1Q1WUZOcWhTNFZCSTZcL3hSUTZKWFFRXC9MMytCK1wvVkFMVUFBMVVQbzRVN0lYXC9GaDVmYWVlYlh6Z3IxWGpzSGVjcGNwb2FhakRtZFhxZXJMQm9Jenp2TkRDeDFXSml0ZVdsY2UxemdMWUEySlA5b2tSWVUyMDlFNlgzRjU3RGZmNkZ4NFlxdWljYVhHZmJIbXBncE9oaWEwbWR2THl2TFA3cnJ5eGRiS0FjR21xZUc0aW9zNFluWnVRbXRlUmphZVFsczVURTM5MEYzRENDZHUyaVpHNUJNSDBBSWNjSVMycUhpMmpYbXhKWThScU1PUUNHUE1DTm5GdVpEQkJZVHhsMDg3RDBTVkc0K2NXU0E2SjYrSVg2VVwvKytPM0lMUGNyTHFOSDU1WUQ5VTdQN29CWjRqd0I1T0lHNVBvck5qN1M3NU1ETlZ3c043SnZManhnWTlGZFcrSW8wNVlIVVFvRzdGZFo5UnF1UG5BSlZCQThWNmdMUVJVTE9RRTNRUUpRUDZVT1F2emN0MkhmcmV1ZmhiT3pkV215b1dDQ2Z2ZnN0MXJncEs1YnAwUG9zMFBpQ052WkNOZllBMFhQQWdLS2tkRzRpc203YllTTG14djJ5M0g1ZHRwNm5OV25rR21jYjFiaXVLSGVFZlBtdDBPbWVwT3RiV1dlZEc4YWRXNG1icFd0bmNlR2l3cjN5d2p2RXdMT0JZOFNuczRHanNDTGpjaVZqWVdSbHR5eHFkODhJaTZhV214RVg4dHoybU5nNThacVpqNmRQekVoSDU2ekw5UkJXbjNFWlM3VjhvM1c1K0luNVVOUVFBVTVVa1E4UXFsWjZxeDJUbDY0UVJZWlM3VWQ4ekF2SE9jalJPRWdKOGhxWm1Zb0k1c3JLT1IyOTQyYUdpUjlMVllxSUZVdFRCSWFYUUo5VjdnN1BCK1lWbFZsVVRzT1BrRUtPbHc2SzdKN1VxdDQrRUhkcGZMY3IxdnZ2WUhwd0xpUHB2T1ZuZGZFcktmaHB2VGJ0dDFrdWU1bnMzejJiM1NiQzNDZGQyUE5wZzFTQnMwK2p0ME1qWTBFanR6NkUyYjlGSFdwYVdXUGFHdWdydnZBcHU4aWRyeXFkYWp0Y3BEcGRMcGZhVzRrYWFyRGJwQzNpSjhpanNwTEF4T1FrWmFUbE16YnBJaVwvZ2R1MG54djhEaER0QnQ0XC9qbWhjMFRsbDFEdHZYOU5CMzhxRDE5M3QzcU5zMURBdEs0K3JNaitaTnprQjQrZDU0VUVHUFJjR1JjWHBzRVlNTlJNXC9WQkYzK24zMitGUVJRbGtLUE9SeTBtQWFIejZoSG1oQzM5UXFHa3dvS3psYVdEWnBMekFkTWpNcSsrcU85OEZqT0E2cVBrRUs3RUI0UWsyMlI2WUdRQWc4UGtrVlVrSjJRUVVSU2syVXUwNXN1MURrdnZ2aHd2MUJ0MGJMdExmc2JYU3lldHB6Y0dYendLREN0S3o1RXhiVXQyck56Y21QaUp5VnFKT1ZvTmpaQWh2S0UxWDVFaEs0bUltUmNLSG5yR2FmaEdDeGhyOHNnYnBFZlhXaGhkS3Nmcnp2cmZiRnUwNXR3dVhuaVlhNWlKQ1duSm1SYU5CNmJFczhcL0pmWTFHPT0iLAogICJ2ZXJzaW9uIiA6ICIyLjEuMiIKfQ==',
	// 		'Connection':'keep-alive',
	// 		'version':'iOS 3.4.3',
	// 		'Cookie':'_ga=GA1.2.1250726265.1458288776; click=1475275893-bfe199e2ce7ab894fa5b; city=90%7c%e6%b5%99%e6%b1%9f%e7%9c%81%7c1%7c3%7c%e6%9d%ad%e5%b7%9e%e5%b8%82%7c1'
	// 	  } 
	// 	};

	// 	console.log(url_all_shop);
	// 	request(options,function (error, response, body) {
	// 	  	if (!error && response.statusCode == 200) {
	// 			console.log(body)  
	// 		    var data = JSON.parse(body);
				


	// 			sleep.sleep(3);//睡3秒
	// 			console.log('===>>>第'+item+'页抓取完成');
	// 			callback(null,item);   
	// 		} else {
	// 			faile_arr.push(url_all_shop);
	// 			callback('ERROR:' + item +'页抓取失败');
	// 		}
			
	// 	});    
	// },function(err,result){
	// 	callback();
	// });		
}



fetch_all_shops(function(){
	console.log('全部获取完成');
});


exports.fetch_all_shops = fetch_all_shops;

function fetch_shop_info(callback){
	console.log('fetch_shop_info');
//南京市
	async.waterfall([
		function(done){
			dbutil.queryData('tbl_tuhu_shops',{City:'成都市'},function(err,result){
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

					    console.log('>>>>>>'+statisticses);
					    

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
				    }
				});    
			},function(err,result){
				LogFile.info('最终结果是：'+ JSON.stringify(_.last(result)));
				done(null,_.last(result));

			});
		}
	],function(err,result){
		console.log('======>>>'+result);
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
		'Accept-Encoding':'gzip, deflate',
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
	    // console.log(body)  
	    // switch (response.headers['content-encoding']) {
	    //     // or, just use zlib.createUnzip() to handle both cases
	    //     case 'gzip':
	    //           response.pipe(zlib.createGunzip()).pipe(output);
	    //           break;
	    //     case 'deflate':
	    //           response.pipe(zlib.createInflate()).pipe(output);
	    //           break;
	    //     default:
	    //           response.pipe(output);
	    //           break;
	    //   }

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
	    // console.log(body)  
	    var data = JSON.parse(body);
	    var total_page = data.TotalPage;
	    console.log('TotalPage:' + total_page);
	    var data = JSON.parse(body);
	    var data_shops = data.Shops;
	    data_shops.forEach(function(item){
	    	shops.push(item);
	    });
	    callback(total_page);
	  }
	});
}

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
	    console.log(body)  
	    var data = JSON.parse(body);
	    var data_shops = data.Shops;
	    data_shops.forEach(function(item){
	    	shops.push(item);
	    });
	    callback();
	  }
	});
}


exports.fetch_hot_shops = function(callback){
	async.mapSeries(areas,function(area,done){
		console.log('>>>>>>>>>>>>>>>>>>'+area);
		LogFile.info('>>>>>>>>>>>>>>>>>>'+ JSON.stringify(area));
		fetch_shops(area,function(){

			done(null,area.city);

		});
	},function(err,result){

		callback();

	});
}


function fetch_shops (area,callback){
	async.waterfall([
		function(done){
			fetch_first_shops(area,function(result){
				console.log('done');
				
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
				fetch_shop_data(item,function(){
					sleep.sleep(3);
					callback();
					console.log(item+'已经完成');
					LogFile.log(item+'已经完成');
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
		dbutil.saveMany(shops,'tbl_tuhu_all_shops',function(result){
	        console.log('all save done');
	        LogFile.info(area + '店铺保存成功');
	        shops = [];
	        callback();
	    });	
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






