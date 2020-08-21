import crypto from 'crypto'
import uuid from 'uuid/v1'
import { Context } from 'koa';
import { post, get, addMidWare, routerMap } from '../decorator/controller'

import { addUser, verifyUserByPwd } from "@src/dao/user";
import { redis } from '@src/common/redis';
import { midNames } from "@src/middleware";
import { userFields, userFieldsArray } from '@src/models/tableConst';
import { Dao } from '@src/dao/dao';
import { user } from '@src/models/table/user';
import _ from 'lodash';
import { Payload, payloadFieldsArray } from '@src/models/payload';
// import VError from 'verror';
import { errConst, newErr } from "@src/constant";

const makeSalt = () => Math.round((new Date().valueOf() * Math.random())) + '';//generate salt
const encryptPass = (pass: string, salt: string) => crypto.createHash('md5').update(pass + salt).digest('hex');// generate md5

// export const sign = async (ctx: Context) => {
// 	ctx.render('sign.html');
// };


@routerMap()
export default class Location {
  @addMidWare(midNames.test1, {args:['a','b']})
  @addMidWare(midNames.test3,{order:1})
  @addMidWare(midNames.test2)
  @post('/login')
  async login (ctx: Context) {
    let { usr, pwd, cardId } = ctx.request.body;
    let imei = ctx.header.imei
    let users:any[] = []
    if(usr && pwd){
      users = await verifyUserByPwd(usr, pwd)
    } else if(cardId && imei){
      //刷卡登陆, 必须 imei 提供
      const dao = new Dao()
      const ret = await dao.listWsd(user.name,{
          where:{
              o:{cardId, alCardVerify:1},
          }
      })
      users = ret.data
    } else{
      throw newErr(errConst.apiParamsErr)

    }

    if (!users.length) {
      throw newErr(errConst.userOrPwdErr)
    }
    // const users = await dao.getUser({ email });
    let lgUsr = users[0]
    let payload = _.pick(lgUsr,payloadFieldsArray ) as Payload

    let token = ctx.jwtSign(payload);
    redis.hmset(`user:${lgUsr.id}`, {...lgUsr, token})
    lgUsr = _.omit(lgUsr,['pwd'])
    return ctx.body = {
      code: 0,
      msg: '登录成功',
      data: lgUsr
    };
  }


}