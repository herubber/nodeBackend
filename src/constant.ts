import VError from "verror";

export const ROUTER_MAP = Symbol('route_map');
export const JWT_MAP = Symbol('jwt_map');
export const MIDDLEWARE_MAP = Symbol('MIDDLEWARE_MAP');


/** 关系 左右2边, 以后用到其他再补充完善 */
export class ConditionRelation {
    eq = '='
    ne = '<>'
    gt = '>'
    lt = '<'
    gte = '>='
    lte = '<='
    is = 'is'
    isn = 'is not'
}

export const conditionRelation = new ConditionRelation()


export const errConst = {
    apiParamsErr:{
        code:1,
        name:'apiParamsErr',
        msg:'参数错误'
    },
    userOrPwdErr:{
        code:2,
        name:'userOrPwdErr',
        msg: '账号或密码错误'
    }
}





const cn = require("@src/i18n/cn")
const hk = require("@src/i18n/hk")
const en = require("@src/i18n/en")

const i18n = {cn,hk,en }

export function newErr(err, lang='cn'){
    let map = i18n[lang]
    return new VError({
        name:   err.name,
        info: err,
      },map[lang])
}