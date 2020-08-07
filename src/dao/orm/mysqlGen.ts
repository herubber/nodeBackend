import { SqlExtra, WhereBlock } from "@src/type"
import { conditionRelation } from "@src/constant"
import _ from "lodash"
import vError from 'verror'

import {PoolConnection} from 'promise-mysql'


export interface SqlGen{
    genInsert<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra)
    genSelect(tbName: String, fields: Array<string>, extra?: SqlExtra)
    countSql:string
}


let connection= <PoolConnection>{} ;
connection.escapeId('posts.date') // => `posts`.`date`
connection.escapeId('date.2', true) // => `date.2`


export class MySqlGen {


    public static countSql = 'SELECT FOUND_ROWS() count'

    public static pagin(sql:string, page:number, pagesize:number, orderBy?:string){
        let retSql = sql.trim()

        let orderSql=''
        if(orderBy){
            orderSql = `order by ${orderBy}`
        }
        
        let paginSelSql = ''
        let paginSql = ''
        let skip =(page-1)*pagesize
        paginSql = `limit ${skip},${pagesize}`
        paginSelSql = 'SQL_CALC_FOUND_ROWS'
        
        if(retSql.startsWith('select')){
            retSql = retSql.replace('select','select '+ paginSelSql)
            return `${retSql}
${orderSql} 
${paginSql}`
        }else{
            throw new vError({
                name: 'noimplimentation',
                info:{code:0, }
            },'非select首词 开发中', {})
        }

    }
    /**
     * 构建group by 语句块, 后面重构构建者模式 作准备
     * @param extra 扩展对象 @link :SqlExtra
     */
    public static buildGroupBy(extra:SqlExtra) {
        let gps = []
        if(extra.groupBy){
            if(Array.isArray(extra.groupBy.rawGroupBy)){
                Array.prototype.push.apply(gps,extra.groupBy.rawGroupBy)
            }else if (typeof extra.groupBy.rawGroupBy === 'string'){
                gps.push(extra.groupBy.rawGroupBy)
            }
        }
        if(gps.length>0){
            return 'group by' + gps.join(',')
        }else{
            return ''
        }
    }

    public static buildWhere(where?:WhereBlock) {
        if(!where){
            return ['',[]]
        }

        let whereSqlStr = ''
        let whereSql: Array<string> = []
        let whereSqlParam: Array<any> = []

        // 处理 简单等值关系表达式
        if(where.obj){
            // whereSql.push(' ? ')
            // whereSqlParam.push(extra.where.obj)
            let wo = where.obj
            Object.keys(wo).map(k=>{
                whereSql.push('??=?')
                whereSqlParam.push(k)
                whereSqlParam.push(wo[k])
            })
        }
        // 处理 简单条件表达式,可带一个函数且函数只传一个值
        if(where.cdm?.length){
            where.cdm.forEach(c => {
                let cdmSql
                let r = '='
                if (c.r) {
                    r = ` ${conditionRelation[c.r]} `
                }
                if (c.f) {
                    cdmSql = `?? ${r} ${c.f}(?)`
                } else {
                    cdmSql = `?? ${r} ?`
                }
                whereSql.push(cdmSql)
                whereSqlParam.push(c.p)
                whereSqlParam.push(c.v)
            })
        }
        whereSqlStr = `where ${whereSql.join(' and ')}`
       return [whereSqlStr, whereSqlParam]
    }

    public static genInsert<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra){
        let sql = `INSERT INTO ${tbName} SET`
        let params: Array<any> = []

        let setSql: Array<any> = []
        if (obj) {
            setSql.push(' ? ')
            params.push(obj)
        }

        if (extra?.set?.cdm?.length) {
            extra.set.cdm.forEach(c => {
                let cdmSql
                let r = ' = '
                if (c.r) {
                    r = ` ${conditionRelation[c.r]} `
                }
                if (c.f) {
                    cdmSql = `?? ${r} ${c.f}(?)`
                } else {
                    cdmSql = `?? ${r} ?`
                }
                setSql.push(cdmSql)
                params.push(c.p)
                params.push(c.v)
            })
        }

        if (extra?.set?.rawSet) {
            setSql.push(extra.set.rawSet)
        }
        let setSqlStr = setSql.join(' , ')
        if(extra?.returning){
            sql = `${sql}${setSqlStr} returning ${extra.returning}`
        }else{
            sql = `${sql}${setSqlStr}`
        }
        return {sql, params}
    }


    public static genSelect(tbName: String, fields: Array<string>, extra?: SqlExtra){
        

        let fromSql = ''
        let fromSqlParam: Array<any> = []
        const tbAs1 = 't1'

        fromSql = `from ?? as ??`
        fromSqlParam.push(tbName)
        fromSqlParam.push(tbAs1)


        
        let selParam:any[] = []
        let selSql:any[] = []
        if(fields.length){
            let startField = _.remove(fields,f=>f.trim()=='*')
            if(fields.length){
                selSql.push('??')
                selParam.push(fields.map(f=>`${tbAs1}.${f}`))
            }
            if(startField.length){
                selSql.push(`${tbAs1}.*`)
            }
        }
        if(extra?.select?.invisibleField?.length){
            selSql.push('??')
            selParam.push(fields.map(f=>`${tbAs1}.${f}`))
        }
        if(extra?.select?.rawSelect){
            selSql.push(extra.select.rawSelect)
        }
        

        let [whereSqlStr, whereSqlParam] = this.buildWhere(extra?.where)
        let sql = `select ${selSql.join(',')}
        ${fromSql}
        ${whereSqlStr}`
        // ${orderSql}
        // ${paginSql}
        
        let orderSql=''
        if(extra?.order){
            orderSql = `${extra.order.rawOrder.join(',')} ${!!extra.order.desc && 'desc'}`
        }
        
        // let paginSelSql = ''
        // let paginSql = ''
        if(extra?.pagin){
            sql = this.pagin(sql, extra.pagin.page, extra.pagin.pagesize, orderSql)
        }else{
            if(orderSql){
                sql = `${sql} 
order by ${orderSql}`
            }
        }

        const params = selParam.concat(...fromSqlParam).concat(...whereSqlParam)
        
        return {sql, params}
    }
    

    public static genUpdate(tbName: String, fields: Array<string>, extra?: SqlExtra){
        

        let sql1 = `update tb as a set a.f1=v1, a.f2=v2 where`


        let fromSql = ''
        let fromSqlParam: Array<any> = []
        const tbAs1 = 't1'

        fromSql = `from ?? as ??`
        fromSqlParam.push(tbName)
        fromSqlParam.push(tbAs1)


        
        let selParam:any[] = []
        let selSql:any[] = []
        if(fields.length){
            let startField = _.remove(fields,f=>f.trim()=='*')
            if(fields.length){
                selSql.push('??')
                selParam.push(fields.map(f=>`${tbAs1}.${f}`))
            }
            if(startField.length){
                selSql.push(`${tbAs1}.*`)
            }
        }
        if(extra?.select?.invisibleField?.length){
            selSql.push('??')
            selParam.push(fields.map(f=>`${tbAs1}.${f}`))
        }
        if(extra?.select?.rawSelect){
            selSql.push(extra.select.rawSelect)
        }
        

        let [whereSqlStr, whereSqlParam] = this.buildWhere(extra?.where)
        let sql = `select ${selSql.join(',')}
        ${fromSql}
        ${whereSqlStr}`
        // ${orderSql}
        // ${paginSql}
        
        let orderSql=''
        if(extra?.order){
            orderSql = `${extra.order.rawOrder.join(',')} ${!!extra.order.desc && 'desc'}`
        }
        
        // let paginSelSql = ''
        // let paginSql = ''
        if(extra?.pagin){
            sql = this.pagin(sql, extra.pagin.page, extra.pagin.pagesize, orderSql)
        }else{
            if(orderSql){
                sql = `${sql} 
order by ${orderSql}`
            }
        }

        const params = selParam.concat(...fromSqlParam).concat(...whereSqlParam)
        
        return {sql, params}
    }
    
}