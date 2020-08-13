import { routerMap, get, post } from "@src/decorator/controller";
import { Context } from "koa";
import { verifyUserByPwd } from "@src/dao/user";
import { Err, t, ResMd } from "@src/common/comm";
import { errConst } from "@src/constant";
import _ from "lodash";
import { payloadFieldsArray, Payload } from "@src/models/payload";
import { redis } from "@src/common/redis";
import { changePwd } from "@src/bll/auth";
import { VError } from "verror";

@routerMap()
export default class Auth {
    @post('/login')
    async login(ctx: Context) {
        let { username, password, lang } = ctx.request.body;
        if (!lang) {
            lang = 'cn'
        }
        // let users: any[] = []
        let users
        if (username && password) {
            users = await verifyUserByPwd(username, password)
        }
        else {
            throw await Err(errConst.apiParamsErr, ctx, lang)
        }
        // if (!users.length) {
        //     throw await Err(errConst.userOrPwdErr, ctx, lang)
        // }
        // let lgUsr = users[0]
        let lgUsr = users
        let payload = _.pick(lgUsr, payloadFieldsArray) as Payload

        let token = ctx.jwtSign(payload);

        redis.hmset(`user:${lgUsr.id}`, { ...lgUsr, token })

        lgUsr = _.omit(lgUsr, ['pwd'])
        ctx.body = new ResMd(lgUsr)
        // ctx.body = {
        //     code: 0,
        //     msg: await t('loginSuccess', null, lang),
        //     data: lgUsr
        // };
    }

    @get('/changepwd', true)
    async changepwd(ctx: Context) {
        let { pwd } = ctx.request.query;
        if (pwd) {
            var affectedRows = await changePwd(ctx, pwd)
            if (affectedRows > 0) {
                ctx.body = new ResMd(await t('Success', ctx))
            } else {
                throw new VError(await t('Fail', ctx) + '(data.affectedRows=' + affectedRows + ')');
            }
        } else {
            throw await Err(errConst.apiParamsErr, ctx)
        }
    }

}
