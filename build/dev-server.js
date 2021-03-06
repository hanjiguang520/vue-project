require('./check-versions')()

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)


var apiServer = express();
//初始化一个新的名字为apiServer 的Express应用程序,如果直接使用23行的app，可以直接在此端口绑定api请求。
var bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({
//   extended: true
// }))
apiServer.use(bodyParser.urlencoded({
  extended: true
}))
// app.use(bodyParser.json());
apiServer.use(bodyParser.json());
var apiRouter = express.Router();
var fs = require('fs');
apiRouter.route('/:apiName')
.all(function (req,res) {
  fs.readFile('./db.json','utf8',function (err,data) {
    if (err) throw err;
    var data = JSON.parse(data)
    if (data[req.params.apiName]){
      res.json(data[req.params.apiName])
    } else {
      res.send('no such api name');
    }
  })
})
/*
*
* */
/*
后台ajax数据传输的写法二:
 在原app = express() 的基础上，
 初始化路由中间件apiRputes，
使用require()来加载外部数据。
去处数据中的分类属性list
设置get请求api、 /getList并返回数据和状态值erron。
var apiRputes = express.Router();
 var appData = require('../db.json');
 var list = appData.getNewsList;

 apiRputes.get('/getList',function (req,res,next) {
   res.json({
      erron: 0,
      data: list
    })
 })
 app Express应用程序加载路由apiRputes并且分配一个中间键。
 app.use('/api', apiRputes);
  */

apiServer.use('/api', apiRouter);

apiServer.listen(port + 1,function (err) {
  if (err){
    console.log(err);
    return;
  }
  console.log('Listening at http://localhost:' + (port + 1) + '\n')
})
//把apiServer绑定到8081端口，并在/config/index.js里的proxyTable设置api请求代理。
// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
