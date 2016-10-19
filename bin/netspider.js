#!/usr/bin/env node 

var program = require('commander');
var request = require('superagent');

program
    .version('0.0.1')
    .usage('<keywords>')
    .parse(process.argv);

if(!program.args.length) {
    program.help();
} else {
    
    var keywords = program.args;
    var url = 'https://api.github.com/search/repositories?sort=stars&order=desc&q='+keywords;
    console.log('Keywords: ' + url);   

	request
	.get(url)
	.set('User-Agent','dcriori')
	.set('Accept', 'application/json')
	.end(function (err, res) {
		if (res.ok) {
	      // console.log(JSON.stringify(res.body));
	      var items = res.body.items;
	      items.forEach(function(item){
	      		console.log('id: '+item.id+'\n\rname: ' + item.name+'\n\rdesc: '+item.description+'\n\rsite: '+item.html_url+'\n\rstars:'+item.stargazers_count+'\n\r');
	      })
	    } else {
	      console.log('Oh no! error ' + res.text);
	    }
	});
}
