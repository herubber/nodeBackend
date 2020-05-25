import jsonWebToken from 'jsonwebtoken'
import log from '../common/logger'
import { app } from '../config';
import { ResData, MiddleWare } from '../type';

import {redis} from '../common/redis'

import { v5 as uuid5} from "uuid";
import { Next, Context } from 'koa';

import * as _ from "lodash";
import { Payload } from '@src/models/payload';
const ms = require('ms')

export const signMethod = () =>async(ctx, next:Next) => {
  ctx.jwtSign = (payload: Payload, exp?: number|string) => {
    exp =  exp || app.exp
    if (typeof exp === 'string'){
      exp = ms(exp)
    }
    const token = jsonWebToken.sign(payload, app.secret, { expiresIn: exp });
    redis.hmset(`payload:${payload.id}`, <any>{...payload, token})
    redis.expire(`payload:${payload.id}`, Math.ceil(<number>exp/1000))
    ctx.set('Authorization', token);
    return token
  };

  ctx.scodeSign = (id: string, exp?: number|string) => {
    const code = uuid5(id, uuid5.DNS).replace('-','');
    ctx.set('scode', code);
    redis.hmset(`payload:${id}`, <any>{code})
    exp = exp || app.exp
    if (typeof exp === 'string'){
      exp = ms(exp)
    }
    redis.expire(`payload:${id}`, Math.ceil(<number>exp/1000))

    return code
  };

  await next();
}




/**
 * jwt verify
 * @param isVerify 
 * @param autorefreshExp 是否自动刷新token
 */
export const jwtVerify: MiddleWare = (isVerify: boolean=true, autorefreshExp = true, cb:(token, payload)=>void) => async (ctx, next) => {
  // 签发Token, 并添加到header中
  // path == ctx.path

  if (isVerify ) {
    if (!ctx.header || !ctx.header.authorization) {
      // ctx.status = 403;
      ctx.body = { code: 403, msg: 'Authorization not exist' };
    } else {
      const token = ctx.header.authorization;
      try {
        // ctx.state.tt = jsonWebToken.decode(token,{complete: true});
        let payload = jsonWebToken.verify(token, app.secret);
        ctx.state.token = payload
        console.log(payload)
        // if(cb){
        //   cb(token, payload)
        // }
        // redis.hmget(`user:${payload}`)
      } catch (err) {
        if(err.name == "TokenExpiredError" && autorefreshExp){
          const expTime = new Date().getTime() - err.expiredAt.getTime()
          if(expTime < app.refreshExp){
            let payload = jsonWebToken.decode(token);
            payload = _.omit(payload,["exp","iat"]) 
            const newToken = ctx.jwtSign(payload);

            ctx.state.token = jsonWebToken.verify(newToken, app.secret);
          }
        } 
        log.error(err);
        if(!ctx.state.token){
          ctx.body={ code: 403, msg: err.message } as ResData
          ctx.body.url = ctx.url
          if (ctx.app.env === 'development') {
            ctx.body.err = err;
          }
        }
      }
      //通过 jwt 校验, 转入下一个中间件
      if (ctx.state.token && next) {
        await next();
      }
    }
  } else if(next){
    await next();
  }
};


export const scodeVerify = ( isVerify: boolean) => async (ctx: Context, next: Next) => {

  if (isVerify ) {
    if (!ctx.header || !ctx.header.scode) {
      // ctx.status = 403;
      ctx.body = { code: 403, msg: 'scode is not exist' };
    } else {
      const credentials = ctx.header.scode;

        // todo redis 获取用户信息,和期效 
        await next();
    }
  } else {
    await next();
  }
};
