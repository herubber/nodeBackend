import log from "../common/logger";
import { errCode } from "@src/constant";
import VError from "verror";
import { Context } from "koa";
import { i18nByKey } from "@src/i18n/i18nUtil";


const errorHandler = () => async (ctx:Context, next) => {
  try {
    await next();
  } catch (err) {
    log.error(err);
    
    let msg:string = err.message
    let obj:{[key:string]:any} = {
      code: -1,
      msg,
    };

    if(msg){
      let idx = msg.indexOf('$$')
      if(idx>0 && idx < 30){
        let eName = msg.slice(0,idx)
        let opt
        try {
          opt = JSON.parse(msg.slice(idx+2))
          if(opt.info){
            obj.info =opt.info
          }
          if(opt.param){
            obj.msg= i18nByKey(ctx, `errMsgStr.${eName}`,...opt.param)
          }
        } catch {
          obj.msg= i18nByKey(ctx, `errMsgStr.${eName}`)
        }
        obj.code = errCode[eName]
        
      }
    }
    ctx.body = obj
    if (ctx.app.env === 'development') {
      // obj.msg = err.message;
      ctx.body.err = {stack:err.stack};
    }
    // 手动释放 error 事件
    // ctx.app.emit('error', err, ctx);
  }
};

export default errorHandler;


export function i18nError(){
  return async(ctx:Context, next)=>{
    ctx.newErr = (err:errCode, param?:any[], info?:{[key: string]: any})=>{
      
      // let map = i18n[lang];
      let eName = errCode[err]
      let eCode = {[eName]:err}
      let i18nVal = i18nByKey(ctx, eName, param)

      if(info){
        Object.assign(info,eCode)
      }else{
        info = eCode
      }
      
      return new VError({
          name: eName,
          info: info,
      },i18nVal)
    }
    
    await next();
  }

}