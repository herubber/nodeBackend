import { SqlExtra, LinkBlock, /*CondictionModel,*/ ExpressionModel, ExpressionSite, UseJoin, ExpressionGroup, $join, $leftJoin, $rightJoin, JoinModel } from "@src/type"
import { conditionRelation } from "@src/constant"
import _, { groupBy } from "lodash"
import vError from 'verror'
const mysql = require('mysql')
import {PoolConnection, mysqlModule} from 'promise-mysql'
import { invisibleFieldsArray } from "@src/models/tableConst"


export interface SqlGen{
    genInsert<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra)
    genUpdate<T>(tbName: String, setObj?: Partial<T>, extra?: SqlExtra)
    genSelect(tbName: String|UseJoin, fields: Array<string>, extra?: SqlExtra)
    genGetById(tbName: String, id:string, fields?:string[], showExtraField?:boolean)
    genGetByWhereObj(tbName: String, obj:object, fields?:string[], showExtraField?:boolean)
    countSql:string
}

// // import * as mysql from 'mysql';
// let connection= <PoolConnection>{} ;
// let mysql = <mysqlModule>{};
// // escapeId 喺 ??
// connection.escapeId('posts.date') // => `posts`.`date`
// connection.escapeId('date.2', true) // => `date.2`

// // escape 喺 ?
// connection.escape("Hello MySQL") // => "'date.2'"
// connection.escape(new Date()) // =>"'YYYY-mm-dd HH:ii:ss'"
// // raw
// var CURRENT_TIMESTAMP = mysql.raw('CURRENT_TIMESTAMP()');
// var sql = mysql.format('UPDATE posts SET modified = ? WHERE id = ?', [CURRENT_TIMESTAMP, 42]);
// console.log(sql); // UPDATE posts SET modified = CURRENT_TIMESTAMP() WHERE id = 42



function isEmptyArray(arr):boolean{
    return !arr?.length
}

const sqlDangerRegx = /[-|#|@|$|/|;|\\]/
const identityField = 'id'
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
    public static buildGroupBy(extra?:SqlExtra):string {
        if(!extra)
            return ''
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




    /**
     * $开头表示字段名
     * @param site 
     */
    public static buildSite(site?:ExpressionSite|Array<ExpressionSite>){

        let placeholder
        let sql:any[] = []
        let params:any[] = []
        let siteMap:Array<ExpressionSite>
        if(!site){
            return [sql,params]
        }
        if(!Array.isArray(site)){
            siteMap = [site]
        }else{
            siteMap=site
        }

        siteMap.forEach(s => {
            // 如果参数是表达式,如果你看到这行的注释,就完善下面实现吧
            if(s.p?.left){
                throw new vError({
                    name: 'noimplimentation',
                    info:{code:0, }
                },'表达式嵌套功能暂不支持', {})
            }
            //如果参数是字段
            if(typeof s.p === 'string' && s.p.startsWith('$')){
                placeholder = '??'
                params.push(s.p.slice(1))
            } else if (Array.isArray(s.p)){
                // 一个site如果p是数组,这种情况应该是fn(,...)
                placeholder =s.p.map(p=>{
                    if(typeof p === 'string' && p.startsWith('$')){
                        params.push(s.p.slice(1))
                        return '??'
                    } else {
                        params.push(s.p)
                        return '?'
                    }
                }).join(',')
            } else {
                // 值
                placeholder = '?'
                params.push(s.p)
            }

            if(s.fn){
                this.checkSqlDangerAndThrowError(s.fn)
                    
                sql.push(`${s.fn}(${placeholder})`)
            } else {
                sql.push(`${placeholder}`)
            }
        });

        return [sql,params]
    }

    private static checkSqlSiteAndThrowError(okayCondition:boolean){
        if(okayCondition){}
        else{
            throw new vError({
                name: 'errorSql',
                info:{code:0, }
            },'sql错误', {})
        }
    }

    private static checkSqlDangerAndThrowError(key:string){
        if(sqlDangerRegx.test(key)){
            throw new vError({
                name: 'dangerCode',
                info:{code:0, }
            },'sql发现危险代码', {})
        }
    }

    
    /**
     * 构建但个表达式模型为sql字符串
     * @param c 表达式模型
     */
    public static buildExpressionModel(c:ExpressionModel){
        let [sql, params] = ['',<any[]>[]]

        // 左边必须有
        let [ls,lp] = this.buildSite(c.lt)

        params.push(...lp)

        // 右边看关系
        if(c.r == conditionRelation.between){
            // between 必须是2个右边
            this.checkSqlSiteAndThrowError(Array.isArray(c.rt) && c.rt.length==2)
            
            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r} ${rs.join(' and ')}`
            params.push(...rp)
        } else if(c.r == conditionRelation.startLike){
            // like 只有一个右边,一定是rs[0]
            this.checkSqlSiteAndThrowError( (!Array.isArray(c.rt)) ||(Array.isArray(c.rt) && c.rt.length==1))
            
            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r} concat(${rs[0]},'%')`
            params.push(...rp)
        } else if(c.r == conditionRelation.endLike){
            // like 只有一个右边,一定是rs[0]
            this.checkSqlSiteAndThrowError( (!Array.isArray(c.rt)) ||(Array.isArray(c.rt) && c.rt.length==1))

            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r} concat('%',${rs[0]})`
            params.push(...rp)
        } else if(c.r == conditionRelation.like){
            // like 只有一个右边,一定是rs[0]
            this.checkSqlSiteAndThrowError( (!Array.isArray(c.rt)) ||(Array.isArray(c.rt) && c.rt.length==1))
            
            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r} concat('%',${rs[0]},'%')`
            params.push(...rp)
        } else if(c.r == conditionRelation.in){
            // in 必须超过一个右边
            this.checkSqlSiteAndThrowError( (!Array.isArray(c.rt)) ||(Array.isArray(c.rt) && c.rt.length>0))
            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r} ${rs.join(',')}`
            params.push(...rp)
        } else if(!c.rt || (<[]>c.rt).length==0){
            // 没关系就没右边
        } else{
            // 普通关系表达式,左右都1个
            this.checkSqlSiteAndThrowError( (!Array.isArray(c.rt)) ||(Array.isArray(c.rt) && c.rt.length==1))
            let [rs,rp] = this.buildSite(c.rt)
            sql = `${ls[0]} ${c.r||conditionRelation.eq} ${rs[0]}`
            params.push(...rp)
        }
        return [sql, params]
    }


    /**
     * 构建非组合式(and,or)表达式模型数组
     * @param cdm 
     */
    public static buildNonGroupExpressions(cdm?:Array<ExpressionModel>){
        let sqlBolck:string[] = []
        let params:any[] = []
        if(!cdm)
            return [sqlBolck, params]

        cdm.forEach(c => {
            let [emSql, emParams] = this.buildExpressionModel(c)
            sqlBolck.push(<string>emSql)
            params.push(...emParams)
        })
        
        return [sqlBolck, params]
    }

    /**
     * 组合的连接, 用 and 或 or 关系组合多个 Expression
     * @param cdms 
     */
    public static buildExpressionGroup(cdms:ExpressionGroup){
        let sqlStr = ''
        let params:any[] = []

        cdms.forEach((cdm, idx)=>{
            
            if(Array.isArray(cdm)){
                // 如果是组合
                let [gpSql, gpParams] = this.buildExpressionGroup(cdm)
                sqlStr += gpSql
                params.push(...gpParams)
            }else{
                
                let [emSql,emParams] = this.buildExpressionModel(cdm)
                if (idx==0) {
                    // 第一个ExpressionModel的link放到括号左边
                    sqlStr += `${cdm.link||''} (${emSql} `
                } else {
                    sqlStr += `${cdm.link||'and'} ${emSql} `
                }
                params.push(...emParams)
            }
        })

        sqlStr += ')\n'
        return [sqlStr, params]
    }


    /**
     * 处理where 或 on 后面的条件表达式
     * @param link 
     */
    public static buildLink(link?:LinkBlock):[string,any[]] {
        if(!link){
            return ['',[]]
        }

        let linkSqlStr = ''
        let linkSql: Array<string> = []
        let linkSqlParam: Array<any> = []

        // 处理 简单等值关系表达式
        if(link.obj){
            // linkSql.push(' ? ')
            // linkSqlParam.push(extra.where.obj)
            // let wo = link.obj
            // Object.keys(wo).map(k=>{
            //     linkSql.push('??=?')
            //     linkSqlParam.push(k)
            //     linkSqlParam.push(wo[k])
            // })
            linkSql.push('?')
            linkSqlParam.push(link.obj)
        }
        // 处理条件模型表达式
        if(link.cdm){
            let [cdmSql, cdmParam] = this.buildExpressionGroup(link.cdm)
            linkSql.push(<string>cdmSql)
            linkSqlParam.push(...cdmParam)
        }
        // 处理 简单条件表达式,可带一个函数且函数只传一个值
        // where.cdm?.forEach(c => {
        //     let cdmSql
        //     let r = '='
        //     if (c.r) {
        //         r = ` ${conditionRelation[c.r]} `
        //     }
        //     if (c.f) {
        //         cdmSql = `?? ${r} ${c.f}(?)`
        //     } else {
        //         cdmSql = `?? ${r} ?`
        //     }
        //     whereSql.push(cdmSql)
        //     whereSqlParam.push(c.p)
        //     whereSqlParam.push(c.v)
        // })
        if(link.raw){
            linkSql.push(link.raw)
        }
        if(linkSql.length>0){
            linkSqlStr = `${linkSql.join(' and ')}`
        }
        return [linkSqlStr, linkSqlParam]
    }

    public static genInsert<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra){
        let sql = `INSERT INTO ?? `
        let params: Array<any> = [tbName]

        let setSql: Array<any> = []
        if (obj) {
            setSql.push(' ? ')
            params.push(obj)
        }

        // 处理条件模型表达式
        let [cdmSql, cdmParam] = this.buildNonGroupExpressions(extra?.set?.cdm)
        setSql.push(...cdmSql)
        params.push(...cdmParam)

        // if (extra?.set?.cdm?.length) {
        //     extra.set.cdm.forEach(c => {
        //         let cdmSql
        //         let r = ' = '
        //         if (c.r) {
        //             r = ` ${conditionRelation[c.r]} `
        //         }
        //         if (c.f) {
        //             cdmSql = `?? ${r} ${c.f}(?)`
        //         } else {
        //             cdmSql = `?? ${r} ?`
        //         }
        //         setSql.push(cdmSql)
        //         params.push(c.p)
        //         params.push(c.v)
        //     })
        // }

        if (extra?.set?.rawSet) {
            setSql.push(extra.set.rawSet)
        }
        let setSqlStr = setSql.join(',')
        if(extra?.returning){
            sql = `${sql} set ${setSqlStr} returning ${extra.returning}`
        }else{
            sql = `${sql} set ${setSqlStr}`
        }
        return {sql, params}
    }



    public static genGetById(tbName: String, id:string, fields:string[]=['*'], showExtraField:boolean=false){
        let eFields = ''
        let params:any[]=[]
        if(showExtraField){
            // eFields = invisibleFieldsArray.map(mysql.escapeId).join(',')
            eFields = ',??'
            params.push(invisibleFieldsArray)
        }
        let fieldStr = fields.join(',')
        this.checkSqlDangerAndThrowError(fieldStr)
        let sql = `select ${fieldStr}${eFields} from ?? where ${identityField} = ?`
        params.push(tbName)
        params.push(id)
        return {sql, params}
    }

    public static genGetByWhereObj(tbName:string, obj:object, fields:string[]=['*'], showExtraField:boolean=false){
        let eFields = ''
        let params:any[]=[]
        if(showExtraField){
            // eFields = invisibleFieldsArray.map(mysql.escapeId).join(',')
            eFields = ',??'
            params.push(invisibleFieldsArray)
        }
        let fieldStr = fields.join(',')
        this.checkSqlDangerAndThrowError(fieldStr)
        let sql = `select ${fieldStr}${eFields} from ?? where ?`
        params.push(tbName)
        params.push(obj)
        return {sql, params}
    }

    public static buildJoin(joinArr:UseJoin){
        let joinSqlStr = ''
        let joinParams:any[] = []
        joinArr.forEach((jt,idx) => {
            // raw string
            if(typeof jt === 'string'){
                joinSqlStr += jt
                return
            } 

            // joinModel
            let jm:JoinModel|undefined=undefined
            let joinType=''

            if((<$join>jt).$join){
                jm = (<$join>jt).$join
                joinType = 'join '
            } else if((<$leftJoin>jt).$leftJoin){
                jm = (<$leftJoin>jt).$leftJoin
                joinType = 'left join '
            } else if((<$rightJoin>jt).$rightJoin){
                jm = (<$rightJoin>jt).$rightJoin
                joinType = 'right join '
            }

            if(!jm){
                this.checkSqlSiteAndThrowError(true)
            }else{
                joinParams.push(jm.tb)
                let as=''
                if(jm.as){
                    as = `as ??`
                    joinParams.push(jm.as)
                }
                let [onSql, onParams] = this.buildLink(jm.on)
                joinParams.push(...onParams)
                // 第一个主表不需要 jointype
                if(idx>0){
                    joinType=''
                }
                joinSqlStr += `${joinType}?? ${as} on ${onSql}\n`
            }
        });
        return [joinSqlStr, joinParams]
    }

    public static genSelect(tbName: String|UseJoin, field: Array<string>, extra?: SqlExtra){
        this.checkSqlSiteAndThrowError(!!tbName)

        let fields = _.cloneDeep(field)
        let joinArr:UseJoin=[]

        let fromSql = ''
        let fromSqlParam: Array<any> = []
        if(typeof tbName === 'string'){
            this.checkSqlDangerAndThrowError(tbName)
            fromSql = `from ${tbName}\n`
        } else if(Array.isArray(tbName)) {
            let [joinSqlStr, joinParams] = this.buildJoin(joinArr)
            fromSql = `from ${joinSqlStr}`
            fromSqlParam = <any[]>joinParams
        }


        let selParam:any[] = []
        let selSql:any[] = []
        if(fields.length){
            let startField = _.remove(fields,f=>f.trim()=='*')
            if(fields.length){
                selSql.push('??')
                selParam.push(fields.map(f=>`${f}`))
            }
            if(startField.length){
                selSql.push(`*`)
            }
        }
        if(extra?.select?.invisibleField?.length){
            selSql.push('??')
            selParam.push(fields.map(f=>`${f}`))
        }
        if(extra?.select?.rawSelect){
            selSql.push(extra.select.rawSelect)
        }

        let [whereSqlStr, whereSqlParam] = this.buildLink(extra?.where)
        let sql = `select ${selSql.join(',')}
${fromSql}where ${whereSqlStr}`
        // ${orderSql}
        // ${paginSql}
        
        let orderSql=''
        if(extra?.order){
            orderSql = `${extra.order.rawOrder.join(',')} ${!!extra.order.desc && 'desc'}`
        }
        
        // let paginSelSql = ''
        // let paginSql = ''
        
        let groupbyStr = this.buildGroupBy(extra)
        if(extra?.pagin){
            sql = this.pagin(sql, extra.pagin.page, extra.pagin.pagesize, orderSql)
        }else{
            if(orderSql){
                sql = `${sql} 
${groupbyStr}
order by ${orderSql}`
            }
        }

        const params = selParam.concat(...fromSqlParam).concat(...whereSqlParam)
        
        return {sql, params}
    }


    public static genUpdate<T>(tbName: String, setObj?: Partial<T>, extra?: SqlExtra){
        let obj = setObj
        let whereExtra = extra?.where
        if(setObj && setObj[identityField]){
            obj = _.omit(setObj,[identityField])
            whereExtra = _.merge({obj:{[identityField]:setObj[identityField]}},extra?.where)
        }
        
        let [whereSqlStr, whereSqlParam] = this.buildLink(whereExtra)
        this.checkSqlSiteAndThrowError( !!whereSqlStr)


        let [setSqlBlocks, setParams] = this.buildNonGroupExpressions(extra?.set?.cdm)

        if(!_.isEmpty(obj)){
            setSqlBlocks.push('?')
            setParams.push(obj)
        }
        if(extra?.set?.rawSet){
            setSqlBlocks.push(extra.set.rawSet)
        }

        this.checkSqlSiteAndThrowError(!isEmptyArray(setSqlBlocks))

        let setSql = setSqlBlocks.join(',')

        let sql = `update ?? set ${setSql} where ${whereSqlStr}`
        let params=[tbName,...setParams,...whereSqlParam]
        return {sql, params}
    }
    
}