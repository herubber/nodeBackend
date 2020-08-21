import { Context } from "koa";
import { redis } from "@src/common/redis";
import { userFieldsArray } from "@src/models/tableConst";
import _ from "lodash";
import { Dao } from "@src/dao/dao";
import { User } from "@src/models/table/user";

// export default {
export async function getUser(ctx: Context): Promise<User> {
    var umd;
    if (ctx?.state?.token) {
        let id = ctx.state.token.id
        let rmd = await redis.hmget(`user:${id}`, userFieldsArray)
        umd = _.zipObject(userFieldsArray, rmd)
    }
    return umd
}

export async function changePwd(ctx: Context, pwd) {
    var umd = await getUser(ctx);
    var dao = new Dao()
    var rows = dao.updateInv(User.name, { id: umd.id }, {
        set: {
            cdm: [{
                lt: { p: '$pwd', },
                rt: {
                    fn: 'password',
                    p: pwd
                }
            }],
        }
    })
    return rows;
}
// }