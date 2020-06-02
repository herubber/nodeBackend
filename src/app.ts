
// require('module-alias/register')
import 'module-alias/register';

import log from "./common/logger";

import path from 'path'
import fs from 'fs'
import koalogger from 'koa-logger'

import koa from 'koa'
import koaRouter from 'koa-router'
import koaBody from "koa-body";
import compress from "koa-compress";
const cors = require('koa2-cors')

import http from 'http'
import https from "https";

import { addRouter } from './router/index.js'
import { addControllerRouter } from "./controllerRouter";
// import rediskoa from "ioredis-koa";

import errorHandler from "./middleware/error";
import { signMethod } from "./middleware/verify";

import { app as appCfg } from "./config";


process.on('uncaughtException', err => {
    console.error('An uncaught error occurred!');
    //console.error(err.stack);
    console.log(new Date(), " uncaughtException:", err.message, err);
});


// var Redis = rediskoa;
// var redis = new Redis({
//   port: 6379,          // Redis port
//   host: '192.168.0.116',   // Redis host
//   family: 4,           // 4 (IPv4) or 6 (IPv6)
//   password: 'auth',
//   db: 0
// });

// const redisMid = rediskoa.middleware

const baseDir = path.normalize(__dirname + '/..')



const app = new koa()

// app.use(koaSwagger({
//     // routePrefix: '/swagger', // host at /swagger instead of default /docs
//     // swaggerOptions: {
//     //     url: '/swagger.json', // example path to json 其实就是之后swagger-jsdoc生成的文档地址
//     // },
// }))



// gzip , 使用 ctx.compress = true
app.use(compress({
    filter(content_type) {
        return /text|javascript/i.test(content_type)
    },
    threshold: 2048,
    gzip: {
        flush: require('zlib').Z_SYNC_FLUSH
    },
    deflate: {
        flush: require('zlib').Z_SYNC_FLUSH,
    },
    br: false // disable brotli
}))


// display access records
app.use(koalogger((str, arg) => {
    console.log(str, arg);
}))



// app.use(redisMid({
//     port: 6379,          // Redis port
//     host: '192.168.0.116',   // Redis host
//     family: 4,           // 4 (IPv4) or 6 (IPv6)
//     password: 'auth',
//     db: 0
// }))




// session
// var session = require('koa-generic-session');
// var redisStore = require('ioredis')([{
//   port: 6380,
//   host: '127.0.0.1'
// }, {
//   port: 6381,
//   host: '127.0.0.1'
// }],{
//   redisOptions: {
//     password: 'your-cluster-password'
//   }
// });
// app.keys = ['keys', 'keykeys'];
// app.use(session({
//   store: redisStore
// }));


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
    origin: function (ctx) {
        if (ctx.url === '/test') {
            return false;
        }
        return '*';
    },
    credentials: true,//将凭证暴露出来, 前端才能获取cookie
    allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
    exposeHeaders: ['*'],// 将header字段expose出去，前端才能获取该header字段
    // exposeHeaders: ['Authorization'],// 将header字段expose出去，前端才能获取该header字段
    allowHeaders: ['*']// 允许添加到header的字段
    // allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'imei']// 允许添加到header的字段
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

// set ctx.sign method 
app.use(signMethod());

const router = new koaRouter()


// add route
addRouter(router);
app.use(router.routes()).use(router.allowedMethods());
addControllerRouter(router);




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

import addSocket from './socket'
import socketio from 'socket.io'
// import http from 'http'




// const sslServer = http2.createSecureServer({
// //   "key": certificate,
// //   "cert": certificate
// }, app.callback())
// port = 3131 + parseInt(process.env.NODE_APP_INSTANCE),


if (!module.parent) {
    let { port, socketPort } = appCfg;
    //如果是pm2 cluster模式
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance) {
        socketPort += parseInt(instance, 10);
    }
    /**
     * koa app
     */
    let options = {
        key: fs.readFileSync('./private_key.pem'),  //私钥文件路径
        cert: fs.readFileSync('./ca-cert.pem')  //证书文件路径
    };
    const server = https.createServer(options, app.callback())
    // const server = http.createServer(app.callback())

    // app.listen(port);
    // server.listen(port);// does the same like: app.listen(port)
    log.info(`=== app server running on port ${port} ===`);
    console.log('app server running at: http://localhost:%d', port);

    /**
     * socket.io
     */

    const io = socketio(server);
    addSocket(io);
    server.listen(socketPort);
    log.info(`=== socket listening on port ${socketPort} ===`)
    console.log('socket server running at: http://localhost:%d', socketPort);
}

// import http from 'http'
// http.createServer(app)
// app.listen(cfg.port)


