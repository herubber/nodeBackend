import koaRouter from "koa-router"
import { DefaultState, Context } from 'koa';

import {scodeVerify} from "../middleware/verify";

// 如果需要前置
// export const router = new koaRouter({
//     prefix:'/user'
// })

export const router = new koaRouter<DefaultState, Context>()

router.get('/all', scodeVerify( false), async (ctx:Context)=>{
    ctx.gg = 'asdf'
    ctx.body = 'asdf'
})


