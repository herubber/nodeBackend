
import { Context } from "koa";

// import {get} from '../decorator/controller'

import { post, get, addMidWare } from '../decorator/controller'

export default class Sign {

    @get('/test')
    async addOrg(ctx: Context){

        ctx.response.body = {
            foo : 'hello',
            bar : 'world',
            t:4
        }
        
    }


}