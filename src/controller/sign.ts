import crypto from 'crypto'
import uuid from 'uuid/v1'
import { Context } from 'koa';
import { post, get, addMidWare } from '../decorator/controller'

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

export default class Sign {
  @addMidWare(midNames.test1, { args: ['a', 'b'] })
  @addMidWare(midNames.test3, { order: 1 })
  @addMidWare(midNames.test2)
  @post('/login')
  async login(ctx: Context) {
    let { usr, pwd, cardId } = ctx.request.body;
    let imei = ctx.header.imei
    let users: any[] = []
    if (usr && pwd) {
      users = await verifyUserByPwd(usr, pwd)
    } else if (cardId && imei) {
      //刷卡登陆, 必须 imei 提供
      const dao = new Dao()
      const ret = await dao.listNormal(user.name, ['*'], {
        where: {
          obj: { cardId, alCardVerify: 1 },
        }
      })
      users = ret.data
    } else {
      throw newErr(errConst.apiParamsErr)
    }

    if (!users.length) {
      throw newErr(errConst.userOrPwdErr)
    }
    // const users = await dao.getUser({ email });
    let lgUsr = users[0]
    let payload = _.pick(lgUsr, payloadFieldsArray) as Payload

    let token = ctx.jwtSign(payload);

    redis.hmset(`user:${lgUsr.id}`, { ...lgUsr, token })

    // var bbb = userFieldsArray;
    // var aaa = await redis.hmget(`user:${lgUsr.id}`, userFieldsArray)
    // var ccc = await redis.hget(`user:${lgUsr.id}`, 'id');


    lgUsr = _.omit(lgUsr, ['pwd'])
    return ctx.body = {
      code: 0,
      msg: '登录成功1',
      data: lgUsr
    };
  }

  @get('/add')
  async register(ctx: Context) {
    const { email, password } = ctx.request.body;
    const salt = makeSalt();
    const hash_password = encryptPass(password, salt);

    let usr = {
      usr: 'test', pwd: '123321', code: 'test', roleId: 9477823074, cnName: '的',
      hkName: '德', enName: '🉐', age: 22, passport: '93j9f781237412',
      tel: '131313131313', email: 'sd@adfs.com'
    }
    const ru = await addUser(usr)
    // redis.hmset(`user:${ru.id}`, <any>ru)

    ctx.body = ru
  }

  @get('/get', true)
  async getToken(ctx: Context) {

    let id = ctx.state.token.id
    // let u1 = await redis.hmget(`payload:${id}`,'*')
    let u1 = await redis.hgetall(`payload:${id}`)
    let u3 = await ctx.state.token
    let u2 = await redis.hmget(`user:${id}`, userFieldsArray)
    let u4 = _.zipObject(userFieldsArray, u2)
    // redis.expire()
    ctx.body = { u1, u2, u3, u4 }
  }

}