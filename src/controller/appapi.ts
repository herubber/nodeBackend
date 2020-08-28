import { Context } from "koa";
import { OfflineRepository } from "@src/bll/offlineApp";
import { get, post, routerMap } from "@src/decorator/controller";

@routerMap('/app')
export default class App{
    @get('/getBaseData')
    async getBaseData(ctx:Context){
        ctx.query
        let data = await new OfflineRepository().getBaseData(ctx.query.imei, ctx.query.version)
        ctx.body=data
    }

    @get('/initDevice')
    async initDevice(ctx:Context){
        let data = await new OfflineRepository().initDevice(ctx.query.tagId, ctx.query.imei, ctx.query.sim)
        ctx.body=data
    }
}
