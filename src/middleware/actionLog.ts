import { app } from "@src/config";

import { addLog } from "@src/dao/syslog";
import { Context, Next } from "koa";
// import { syslog } from "@src/dao/models/table/syslog";

export const actionLog = () => async (ctx:Context, next:Next) => {
    let ip = ctx.request.ip || ctx.request.headers[app.proxyIpHeaderKey] || 
        ctx.request.headers['x-forwarded-for'] || 
        ctx.request.headers['x-real-ip'] || ctx.request.headers["X-Orig-IP"];
    
    // 这里因应verify中间件的选择,现在做到一半确认使用 jwt ,就这么写咯,要做好产品,应该在config里设定
    let token = ctx.header.authorization
    // 协定header.里面放imei
    let imei = ctx.header.imei
    
    addLog({
        // memo:'以后有机会做好产品,如果可以有时间做好的话,在rolemodule对应redis里找对应action的描述找到action的作用,不过在这个公司估计不可能完成的',
        cat:'actionLog',
        level:'info',
        ip,
        token,
        imei,
        action:ctx.path,
        // msg:ctx.body // 可以放参数等信息
    })

};


