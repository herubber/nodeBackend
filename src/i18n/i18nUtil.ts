import { Context } from "koa";
import redis from "@src/bll/redis";
import { i18n } from "@src/constant";
import _ from "lodash";
import util from 'util'

type Lang ='cn'|'hk'|'en'

export function i18nByKey(ctx: Context, key: string, ...param:any[]) {
    let lang:Lang = 'cn'
    if(ctx.state.user?.lang){
        lang = <Lang>ctx.state.user.lang
    }
    // if (ctx.state.token?.id) {
    //     let usrLang = await redis.getUserById(ctx.state.token.id, ['lang'])
    //     lang = <Lang>usrLang.lang || lang
    // }
    let map = i18n[lang];
    if (map) {
        let $param = param.map(p=>{
            if(typeof p === 'string' && p.startsWith('$$')){
                return _.get(map,p.slice(2))
            }
            return p
        })
        return util.format(_.get(map,key),...$param)
    } else {
        return ''
    }
}