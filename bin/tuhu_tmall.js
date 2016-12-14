'use strict'

var cheerio = require('cheerio');
var superagent = require('superagent');
const charset = require('superagent-charset');
var URL = require('url');
var dbutil = require('./dbutil.js');
var async = require('async');
var redis = require('redis');
var fs = require('fs');
var sleep = require('sleep');
// var proxy = require('./proxy.json');

charset(superagent);

function fetch_tmall_data(callback){
	var products = [];
	async.mapSeries([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],function(item,done){
		var pageSize = item * 60;
		var url_base = 'https://list.tmall.com/search_shopitem.htm?spm=a220m.1000862.0.0.RzXSBK&s=${pageSize}&style=sg&sort=s&user_id=1718241991&stype=search#grid-column';
		var url = url_base.replace('${pageSize}',pageSize);
		var path_base = '/search_shopitem.htm?spm=a220m.1000862.0.0.RzXSBK&s=${pageSize}&style=sg&sort=s&user_id=1718241991&stype=search)';
		var path = path_base.replace('${pageSize}',pageSize);

		console.log(url);
		

		// done(null,url);
		superagent.get(url).charset('gbk')
			.set('authority','list.tmall.com')
			.set('method','GET')
        	.set('path',path)
        	.set('scheme','https')
        	.set('accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        	.set('accept-encoding','gzip, deflate, sdch, br')
        	.set('accept-language','en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4')
        	.set('cache-control','max-age=0')
        	.set('cookie','tracknick=dcriori; skt=531ddd4ca520e340; cookie2=12d86d208588f6e7d900dda933b2e8a6; t=5835fb63f8b753257c6eb5462e57e4d9; _tb_token_=qcsmHSxwWWBr; cna=YOEzDlR/IksCAdtSjugWZNpv; tk_trace=1; _med=dw:1440&dh:900&pw:2880&ph:1800&ist:0; pnm_cku822=255UW5TcyMNYQwiAiwQRHhBfEF8QXtHcklnMWc%3D%7CUm5Ockt%2BQ3pAeUB8Qn1DeS8%3D%7CU2xMHDJ7G2AHYg8hAS8XLgAgDkkgS2UzZQ%3D%3D%7CVGhXd1llXGlUbVduV2tValRuWWRGc0Z8QHRLcUx2Q3xDfEB6VAI%3D%7CVWldfS0RMQ0yCjERLRMzHVYTahcnRiEXYwJsSCULXQs%3D%7CVmhIGCcZOQA1FS0WKwswCTQIKBQtFCkJPQA9HSEfKh4%2BCzELXQs%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A990*6401-client%3A560*803-offset%3A560*6401-screen%3A1440*900; cq=ccp%3D1; l=AhQUxLmguVStF2gQfRCIse3-ZFiGKzhx; isg=AkNDtkoKH5Q-C9yl5CYjlbcw0gExttf6hVc423Ug2KI_NGNW_IhnSiHu2HOA')
        	.set('upgrade-insecure-requests','1')
        	.set('user-agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36')
    	.timeout(3600*1000)
    	.end(function (err, res) {
			if (err) {
		    	console.log(err);
		    } else {
		    	var $ = cheerio.load(res.text);
			    $('.product').each(function(idx,element){
			    	
			    	var data = $(this);
					var final_data = jiexi_data($(this));
					console.log(final_data);
					products.push(final_data);

			    });
			    sleep.sleep(30);
			    done();
			    
		    }
		});
	},function(err,result){
		console.log('共多少商品'+products.length);
		var sum = 0;
		var order_sum = 0;

		dbutil.saveMany(products,'tbl_tuhu_tmall',function(result){
	        console.log('all save done');
	    });

		products.forEach(function(item){
			fs.appendFile('/Users/sagaris/tuhu_tmall_data.txt',item,function (err) {
				console.log('save file complete!!!');
			});
			// var money = parseFloat(item.price) * parseInt(item.number);
			// order_sum += parseInt(item.number);
			// console.log(item.price + '*' + item.price +'='+money);
			// sum += money;
			// console.log('途虎近30天天猫销售总额为：'+sum);
			// var average_price = sum/order_sum;
			// console.log('总单量：'+ order_sum);
			// console.log('平均单价：' + average_price);
		});
	});
}

exports.fetch_tmall_data = fetch_tmall_data;


function jiexi_data(data){
	console.log('#######.'+data);
	// var $ = cheerio.load(data);
	var price = data.find('.productPrice').text().replace('¥','').trim();
	console.log(price);

	var tmp = data.find('.productStatus').text();
	console.log(tmp);

	var reg = /月成交([0-9]+)笔/g;
	var res = reg.exec(tmp);   
	console.log(res);
　　	console.log('成交数量：'+res[1]);
	console.log('成交金额：'+price);
	var a = data.find('.productTitle').find('a');
	console.log(a.text());
	
	var href = a.attr('href');
	var result = parseQueryString(href);
	console.log(result.id);

	return {
		id:result.id,
		title:a.text(),
		number:res[1],
		price:price
	};
}

// fetch_data(function(){
	
// });


function fetch_test_data(dataFile,callback) {
	fs.readFile(dataFile,(err, data)=>{
		if (err) throw err;
  		callback(data.toString());
	});
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
