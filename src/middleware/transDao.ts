import log from "@src/common/logger";
import { Dao } from "@src/dao/dao";
import { getConnp } from "@src/common/mysql";
import { Context, Next } from "koa";
import { pool } from "@src/common/mariadb";

const transDao = () => async (ctx:Context, next:Next) => {
    try {
        ctx.newTransDao = async () => {
            let conn = await getConnp()
            const dao = new Dao(conn);
            await dao.beginTrans()
            ctx.mysqlTransDao = dao
        }
        await next();
        await ctx.mysqlTransDao?.commit()
    } catch (err) {
        log.error(err)
        await ctx.mysqlTransDao?.rollback()
        let obj = {
            code: -1,
            msg: 'System Error and Transaction is rollback',
        };
        if (ctx.app.env === 'development') {
            obj.msg = err.message;
            (<any>obj).err = err;
        }
        ctx.body = obj
        // 手动释放 error 事件
        // ctx.app.emit('error', err, ctx);
    }finally{
        ctx.mysqlTransDao?.releaseConn()
        ctx.mysqlTransDao = undefined
    }
};

export default transDao