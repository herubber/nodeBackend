import { Context } from "koa";
import { get, routerMap, post } from '../decorator/controller';
import { ResData } from "@src/type";
import VError from "verror";
import { ResMd, Err } from "@src/common/comm";
import { errConst } from "@src/constant";
import { Dao } from "@src/dao/dao";
import { role } from "@src/models/table/role";
import { user } from "@src/models/table/user";


// 方案1：
class LikeAspnetMvcController {

    resData: ResData = {
        code: 0,
        msg: '',
        data: {},
        err: {},
    }

    private bodyResult(body: Partial<ResData>) {
        return Object.assign({}, this.resData, body)
    }

    Json(ctx, body: Partial<ResData>) {
        ctx.body = this.bodyResult(body)

    }
}


// 方案2：
class MyResultData {
    public code = 0;
    public msg = '';
    data = {};
    err = '';

    constructor(data) {
        if (data) {
            this.data = data
        }
        // 下面继续写你希望有或没有的默认值
    }
}






@routerMap()
export default class Test extends LikeAspnetMvcController {

    @get("/test1", false)
    async test1(ctx: Context) {
        this.Json(ctx, {
            code: 2
        })
        var a = { a: 123, b: "123" };
        ctx.body = { code: 0, data: a } as ResData
        ctx.body = new MyResultData({
            data: a
        })
    }

    @get("/test2")
    async test2(ctx: Context) {
        var a = { a: 123, b: "123111" };
        // ctx.body = { data: a }
        ctx.body = new ResMd(a)
        // throw new VError("抛了一个异常");
    }


    @get("/test3")
    async test3(ctx: Context) {
        throw new VError("抛了一个异常111");
    }


    @get("/test4")
    async test4(ctx: Context) {
        let { usr, pwd } = ctx.request.query;
        var a = { a: usr, b: pwd };
        ctx.body = new ResMd(a)
    }

    @post("/test5")
    async test5(ctx: Context) {
        let { usr, pwd } = ctx.request.body;
        if (usr && pwd) {
            var a = { a: usr, b: pwd };
            var dao = new Dao()
            // var ret = await dao.listWsd('role', ['*'], {
            //     where: {
            //         obj: { state: 1 },
            //     }
            // })
            var ret = await dao.listWsd('user', ['*'], {
                where: {
                    obj: { state: 1 },
                    // cdm: [{
                    //     lt: { p: '$pwd' },
                    //     rt: {
                    //         p: pwd,
                    //         fn: 'password'
                    //     }
                    // }]
                }
            })
            ctx.body = new ResMd(ret.data)
        } else {
            throw await Err(errConst.apiParamsErr, ctx);
        }
    }

    @post("/test6")
    async test6(ctx: Context) {
        var dao = new Dao()
        var ret = await dao.listWsd('role', ['*'], {
            where: {
                obj: { state: 1 },
            }
        })
        console.log(ret);
        
        ctx.body = new ResMd({data:ret.data,cnt:ret.cnt})
    }
}












