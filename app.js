
// const koa = require('koa')

const cfg = require("./config/index.js")

const path = require('path')

const koa = require('koa')
const koalogger = require('koa-logger')
const koaRouter = require("koa-router")
// const staticServe = require('koa-static-server')
const koaBody = require("koa-body")
const redisMid = require("ioredis-koa").middleware
const compress = require('koa-compress')
const cors = require('koa2-cors')

const errorHandler = require('./middleware/error')

const app = new koa()


const router = new koaRouter();
// const server = http.createServer(app.callback())
// const socketServer = socket(server)
const baseDir = path.normalize(__dirname + '/..')


// gzip
app.use(compress({
    filter: function (content_type) {
      return /text|javascript/i.test(content_type)
    },
    threshold: 2048,
    flush: require('zlib').Z_SYNC_FLUSH
}))

// display access records
app.use(koalogger((str, arg)=>{

}))



// app.use(redisMid({
//     port: 6379,          // Redis port
//     host: '192.168.0.116',   // Redis host
//     family: 4,           // 4 (IPv4) or 6 (IPv6)
//     password: 'auth',
//     db: 0
// }))

// session

// parse request

app.use(koaBody({
    jsonLimit: 1024 * 1024 * 5,
    formLimit: 1024 * 1024 * 5,
    textLimit: 1024 * 1024 * 5,
    multipart: true,// 解析FormData数据
    formidable: { uploadDir: path.join(baseDir, 'public/uploadtmp') }
}))
  
// set static directory
// app.use(socketServer({rootDir: 'web'}))

// // folder support
// // GET /web/
// // returns /web/index.html
// // GET /web/file.txt
// // returns /web/file.txt
// app.use(socketServer({rootDir: 'web', rootPath: '/web'}))

// // index support
// // GET /
// // returns /file.txt
// app.use(socketServer({rootDir: 'web', index: 'file.txt'}))

// // rewrite support
// // GET /web/
// // returns 404
// // GET /admin
// // returns /admin/index.html
// app.use(socketServer({rootDir: 'web', rootPath: '/admin'}))

// app.use(favicon(path.join(baseDir, 'public/favicon.jpg')));
  
//cors
app.use(cors({
    // origin: config.client,// * 写明详细url才行
    origin: function(ctx) {
      if (ctx.url === '/test') {
        return false;
      }
      return '*';
    },
    credentials: true,//将凭证暴露出来, 前端才能获取cookie
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
    exposeHeaders: ['Authorization'],// 将header字段expose出去，前端才能获取该header字段
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']// 允许添加到header的字段
}));

// app.use(cors({
//   origin: function(ctx) {
//     if (ctx.url === '/test') {
//       return false;
//     }
//     return '*';
//   },
//   exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
//   maxAge: 5,
//   credentials: true,
//   allowMethods: ['GET', 'POST', 'DELETE'],
//   allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
// }));

  
  // handle the error
  app.use(errorHandler());
  
  // add route
  addRouter(router);
  app.use(router.routes()).use(router.allowedMethods());
  
  // deal 404
  app.use(async ctx => {
    log.error(`404 ${ctx.message} : ${ctx.href}`);
    ctx.status = 404;
    ctx.body = '404! page not found !';
    // ctx.render('404.html');
  });
  
  // koa already had middleware to deal with the error, just register the error event
  app.on('error', (err, ctx) => {
    log.error(err);//log all errors
    ctx.status = 500;
    ctx.statusText = 'Internal Server Error';
    if (ctx.app.env === 'development') { //throw the error to frontEnd when in the develop mode
      ctx.res.end(err.stack); //finish the response
    } else {
      ctx.render('Server Error');
    }
  });



if (!module.parent) {
    let { port, socketPort } = cfg;
    //如果是pm2 cluster模式
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance) {
      socketPort += parseInt(instance, 10);
    }
  
    /**
     * koa app
     */
    app.listen(port);
    // http.createServer(app.callback()).listen(port);// does the same like: app.listen(port)
    log.info(`=== app server running on port ${port} ===`);
    console.log('app server running at: http://localhost:%d', port);
  
    /**
     * socket.io
     */
    // addSocket(socketServer);
    // server.listen(socketPort);
    // log.info(`=== socket listening on port ${socketPort} ===`)
    // console.log('socket server running at: http://localhost:%d', socketPort);
}

// import http from 'http'
// http.createServer(app)
// app.listen(cfg.port)








// app.use(async (ctx, next) => {
//     try {
//         await next();
//     } catch (err) {
//         // will only respond with JSON
//         ctx.status = err.statusCode || err.status || 500;
//         ctx.body = {
//             message: err.message
//         };
//     }
// })






// app.use(function(err, req, res, next) {
//   if (app.get('env') === 'development') {
//     return errorhandler(err, req, res, next);
//   } else {
    
//     res.Status(401).sen;
//   }
// });


// // error handler
// app.use(function(err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
//   });