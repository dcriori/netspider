#!/usr/bin/env node 

var program = require('commander');
var request = require('superagent');
var chalk = require('chalk');

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
	      	// console.log('id: '+item.id 
	      	// 		+'\n\rname: ' + item.name 
	      	// 		+'\n\rdesc: '+item.description
	      	// 		+'\n\rsite: '+item.html_url
	      	// 		+'\n\rstars:'+item.stargazers_count 
	      	// 		+'\n\r');
	      	console.log(chalk.cyan.bold.underline('Name: ' + item.name));
	        console.log(chalk.magenta.bold('Owner: ' + item.stargazers_count));
	        console.log(chalk.grey('Desc: ' + item.description + '\n'));
	        console.log(chalk.grey('Clone url: ' + item.clone_url + '\n'));
	      });

	    } else {
	      	console.log('Oh no! error ' + res.text);
	    }
	});
}
