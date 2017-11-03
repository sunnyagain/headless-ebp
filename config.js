const config = {
	node  : {},
	redis : {}
};

config.node.httpPort = process.env.nodeHttpPort||8080;

config.redis.port    = process.env.redisPort||6379;
config.redis.host    = process.env.redisHost||'localhost';
config.redis.CONST   = {
	"PREFIX" : "SITEMAP"
}

module.exports = config;