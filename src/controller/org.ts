
import { Context } from "koa";

// import {get} from '../decorator/controller'

import { post, get, addMidWare } from '../decorator/controller'
import { midNames } from "@src/middleware";
import { Dao } from "@src/dao/dao";
import { user } from "@src/models/table/user";

export default class Sign {
    @addMidWare(midNames.test1, { args: ['a', 'b'] })
    @addMidWare(midNames.test3, { order: 1 })
    @addMidWare(midNames.test2)
    @get('/test')
    async addOrg(ctx: Context){
        
        ctx.response.body = {
            foo : 'hello',
            bar : 'world',
            t:4
        }
        
    }


}