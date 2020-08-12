import { VError } from "verror";
import { Context } from "koa";
import { redis } from "./redis";
import _ from "lodash";
import { userFieldsArray } from "@src/models/tableConst";

export class ResMd {
    public code = 0;
    public msg = '数据请求成功';
    public data = {};
    public err = '';

    constructor(data) {
        if (data) {
            this.data = data
        }
    }
}


const cn = require("@src/i18n/cn")
const hk = require("@src/i18n/hk")
const en = require("@src/i18n/en")

const i18n = { cn, hk, en }




export async function Err(err, ctx, lang = 'cn') {
    if (ctx?.state?.token) {
        let id = ctx.state.token.id
        let rmd = await redis.hmget(`user:${id}`, userFieldsArray)
        let umd = _.zipObject(userFieldsArray, rmd)

        lang = umd.lang as string;
    }
    let map = i18n[lang]
    let msg = map[err.name]
    return new VError({
        name: err.name,
        info: err,
    }, msg)
}
export async function t(key, ctx, lang = 'cn') {
    if (ctx?.state?.token) {
        let id = ctx.state.token.id
        let rmd = await redis.hmget(`user:${id}`, userFieldsArray)
        let umd = _.zipObject(userFieldsArray, rmd)

        lang = umd.lang as string;
    }
    let map = i18n[lang]
    let msg = map[key]
    return msg
}