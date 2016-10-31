var superagent=require("superagent");
var cheerio=require("cheerio");
var url=require("url");
var async=require("async");
var baseUrl='https://cnodejs.org/';

function output(arr){
    for(var i=0;i<arr.length;i++){
        console.log(arr[i]);
    }
}
superagent.get(baseUrl).end(function(err,resp){
    if(err){
        return console.error(err);
    }
    var arr=[];
    var $=cheerio.load(resp.text);
    $("#topic_list .topic_title").each(function(idx,element){
        $element=$(element);
        var _url=url.resolve(baseUrl,$element.attr("href"));
        arr.push(_url);
    });
    //验证得到的所有文章链接集合
    output(arr);
    //接下来遍历arr，解析每一个页面中需要的信息
    async.mapLimit(arr,1,function(url,callback){
        superagent.get(url).timeout(3600*1000).end(function(err,mes){
            if(err){
                console.log("get \""+url+"\" error !"+err);
                console.log("message info:"+JSON.stringify(mes));
            }
            console.log('fetch '+url+" succeful !");
            //console.log("mess info:"+JSON.stringify(mes));
            var $=cheerio.load(mes.text);
            var jsonData={
                title:$(".topic_full_title").text().trim(),
                href:url,
                firstcomment:$("#reply1 .markdown-text").text().trim()
            };
            console.log("aim data is :"+JSON.stringify(jsonData));
            callback(null,jsonData);
        });
    },function(error,results){
        console.log("result :");
        console.log(results);    
    });
});