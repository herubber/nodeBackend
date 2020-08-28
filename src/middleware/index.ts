import { actionLog } from "./actionLog"
import * as cors from "./cors";
import errorHandler,{i18nError} from "./error";
import redisMid from "./redis";
import transDao from "./transDao";
import { signMethod, jwtVerify, scodeVerify } from "./verify";


const test1 = (...args)=>async (ctx, next)=>{
    await next()
    console.log('test1',args);
}
const test2 = (...args)=>async (ctx, next)=>{
    console.log('test2',args);
    await next()
}
const test3 = (...args)=>async (ctx, next)=>{
    console.log('test3',args);
    await next()
}


export const all = {
    // actionLog,
    // cors,
    // errorHandler,
    // i18nError,
    // signMethod,
    redisMid,
    transDao,
    jwtVerify,
    scodeVerify,
    test1,
    test2,
    test3,
}



// .reduce((result, item, index, array) => {
//     result[index] = item; //a, b, c
//     return result;
// }, {}) 

export const midNames:{[name in keyof typeof all]:string} = Object.fromEntries(Object.values(all).map(a=>[(<any>a).name,(<any>a).name]))

export {
    actionLog,
    cors,
    errorHandler,
    i18nError,
    redisMid,
    transDao,
    signMethod,
    jwtVerify,
    scodeVerify,
}


