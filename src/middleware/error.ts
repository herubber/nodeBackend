import log from "../common/logger";

const errorHandler = () => async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    log.error(err);
    let obj = {
      code: -1,
      msg: err.message,
    };
    if (ctx.app.env === 'development') {
      // obj.msg = err.message;
      (<any>obj).err = err;
    }
    ctx.body = obj
    // 手动释放 error 事件
    // ctx.app.emit('error', err, ctx);
  }
};

export default errorHandler
