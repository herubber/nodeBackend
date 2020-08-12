import { routerMap, get, post } from "@src/decorator/controller";
import { Context } from "koa";
import { verifyUserByPwd } from "@src/dao/user";
import { Err, t } from "@src/common/comm";
import { errConst } from "@src/constant";
import _ from "lodash";
import { payloadFieldsArray, Payload } from "@src/models/payload";
import { redis } from "@src/common/redis";

@routerMap()
export default class Auth {
    @post('/login')
    async login(ctx: Context) {
        let { username, password, lang } = ctx.request.body;
        if (!lang) {
            lang = 'cn'
        }
        let users: any[] = []
        if (username && password) {
            users = await verifyUserByPwd(username, password)
        }
        else {
            throw await Err(errConst.apiParamsErr, ctx, lang)
        }
        if (!users.length) {
            throw await Err(errConst.userOrPwdErr, ctx, lang)
        }
        let lgUsr = users[0]
        let payload = _.pick(lgUsr, payloadFieldsArray) as Payload

        let token = ctx.jwtSign(payload);

        redis.hmset(`user:${lgUsr.id}`, { ...lgUsr, token })

        lgUsr = _.omit(lgUsr, ['pwd'])
        ctx.body = {
            code: 0,
            msg: await t('loginSuccess', null, lang),
            data: lgUsr
        };
    }



}
