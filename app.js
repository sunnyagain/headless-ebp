const express = require('express');
const _ = require('lodash');
const bluebird = require('bluebird');
const redis = require('redis');
const config = require ('./config');

const app = express();

const redisClient = redis.createClient(config.redis.port,config.redis.host);
const sitemap = require('./sitemap.json');


bluebird.promisifyAll(redis.RedisClient.prototype);


app.get('/', function (req, res) {
	res.send('XOXO!')
})

redisClient.on('connect', () => {
	console.log('Redis Connected');
    mockJson();
});

const mockJson = function() {
    redisClient.send_command('flushall');
    console.log('flushed all redis data');
    console.log('Mock data dump in redis begins');
    _.each(sitemap, function(item, index){
        redisClient.set(config.redis.CONST.PREFIX + ":" + item.url, JSON.stringify(item) );
        // console.log(item);
    })
    console.log('finished dumping Mock data');
}

const ChromeRender = require('chrome-render');
let chromeRenderGlobal;
ChromeRender.new({}).then(async(chromeRenderLocal)=>{
	chromeRenderGlobal = chromeRenderLocal;
	app.listen(config.node.httpPort);
	console.log('Headleass Chrome instance launched');	
	console.log('http server listening on : ' + config.node.httpPort);	
});  

app.get('/render/:url(*)', function(req, res) {
	if('undefined' == typeof req.params.url && _.isEmpty(req.params.url)) {
        console.log('invalid url provided');
		res.set(404);
		return res.end();
	}
    let url = req.params.url,
        urlData;
        redisClient.debug_mode = true;
        redisClient.getAsync(config.redis.CONST.PREFIX + ":" + url).then(function (val) {
            urlData =  JSON.parse(val);
            // check for redirect status
            if(!_.isEmpty(val) && !_.isEmpty(urlData.status) && urlData.status == '200') {
            	const htmlString = chromeRenderGlobal.render({
            		url: urlData.url
            	}).then((htmlString) => {
                    res.set(200);
                    res.send(htmlString);
                    res.end();
                }).catch((ex)=>{
                	console.log(ex);
                	res.set(404);
                	res.send();	
                	res.end();
                });
            }
            else
            {
                console.log('not found', val);
                res.redirect(308, "https://www.voot.com");
            }
        }).catch((ex) => {
            console.log('Redis unhandled promise rejection as:');
            console.log(ex);
        });

});

process.on('uncaughtException', console.log);
