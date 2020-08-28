import VError from "verror";
import { Context } from "koa";
import redis from "./bll/redis";

export const ROUTER_MAP = Symbol('route_map');
export const JWT_MAP = Symbol('jwt_map');
export const MIDDLEWARE_MAP = Symbol('MIDDLEWARE_MAP');

/**
 * the key of offline base data
 */
export const baseData = 'OBD'



/** 关系 左右2边, 以后用到其他再补充完善 */
export class ConditionRelation {
    // 关系表达式有且仅有左和右
    eq = '='
    ne = '<>'
    gt = '>'
    lt = '<'
    gte = '>='
    lte = '<='
    is = 'is'
    isn = 'is not'
    // 特殊,2右
    between = 'between'
    // 特殊,右加%
    like = 'like'
    startLike = 'like'
    endLike = 'like'
    'in' = 'in'
    // 如果后面有特殊需要添加,修改gen对应buildCondition方法
}

export const conditionRelation = new ConditionRelation()


// export const errConst = {
//     apiParamsErr:{
//         code:1,
//         name:'apiParamsErr',
//         // msg:'参数错误'
//     },
//     userOrPwdErr:{
//         code:2,
//         name:'userOrPwdErr',
//         // msg: '账号或密码错误'
//     },
//     userOrPwdErr:{
//         code:2,
//         name:'userOrPwdErr',
//         // msg: '账号或密码错误'
//     }
// }


export enum errCode{
    apiParamsErr=1,
    userOrPwdErr,
    deviceNotInitial,
    /**
     * '状态 0待审核, 1正常/使用, 2停用/冻结',
     */
    stateNeedAudit,
    stateNeedUnfreeze,
    notInitialCard, 
}

export function eCodeStr(code:errCode,param?:any[],info?:{[key:string]:any}){
    let ret = errCode[code]+'$$'
    let opt:any
    if(info){
        opt.info = info
    }
    if(param&&param.length){
        opt.param = param
    }
    if(!_.isEmpty(opt)){
        ret += JSON.stringify(opt)
    }
    return ret
}


// const cn = require("@src/i18n/cn")
// const hk = require("@src/i18n/hk")
// const en = require("@src/i18n/en")

import cn from '@src/i18n/cn'
import hk from '@src/i18n/hk'
import en from '@src/i18n/en'
import _ from "lodash";

export const i18n = {cn,hk,en }



