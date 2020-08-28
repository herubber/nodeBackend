import { SqlExtra, LinkBlock, /*CondictionModel,*/ ExpressionModel, ExpressionSite, UseJoin, ExpressionGroup, JoinModel, Fields } from "@src/type"
import { conditionRelation } from "@src/constant"
import _, { groupBy } from "lodash"
import vError from 'verror'
import * as mysql from 'mysql';
import {PoolConnection, mysqlModule} from 'promise-mysql'
import { invisibleFieldsArray } from "@src/models/tableConst"
import { jwtVerify } from "@src/middleware"


export interface SqlGen{
    genDelete(tbName:string, extra: SqlExtra)
    genInsert<T>(tbName: string, obj?: Partial<T>, extra?: SqlExtra)
    genUpdate<T>(tbName: string, setObj?: Partial<T>, extra?: SqlExtra)
    genSelect(tbName: string|UseJoin, extra?: SqlExtra)
    genGetById(tbName: string, id:string, fields?:string[], showExtraField?:boolean)
    genGetByWhereObj(tbName: string, obj:object, fields?:string[], showExtraField?:boolean)
    countSql:string
    /**
     * use camelCase ?
     */
    camelCase?:boolean
}


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
export const identityField = 'id'
export class MySqlGen {
    /**
     * 默认开启camelCase
     */
    public static camelCase = true
    
    public static waitSecond = 0
    public static countSql = 'SELECT FOUND_ROWS() count'

    /**
     * camelCase val
     * @param val 字符串
     */
    private static cc(val:string){
        if(this.camelCase){
            return _.camelCase(val)
        }else{
            return val
        }
    }

    public static pagin(sql:string, page:number, pagesize:number, groupBy:string, orderBy:string){
        let retSql = sql.trim()
        
        let paginSelSql = ''
        let paginSql = ''
        let skip =(page-1)*pagesize
        paginSql = `limit ${skip},${pagesize}`
        paginSelSql = 'SQL_CALC_FOUND_ROWS'
        
        if(retSql.startsWith('select')){
            retSql = retSql.replace('select','select '+ paginSelSql)
            return `${retSql}\n${groupBy}\n${orderBy}\n${paginSql}`
        }else{
            throw new vError({
                name: 'noimplimentation',
                info:{code:0, }
            },'非select首词 开发中', {})
        }

    }


    private static specialString(field:string, notSpecial){
        let sql
        let params:any[]=[] 
        if(field.startsWith('$$')){
            // 隐藏之 raw field 句式
            let rawField = field.slice(2)
            this.checkSqlDangerAndThrowError(rawField)
            sql = rawField
        }else if(field.startsWith('$')){
            // 字段句式,因为是fields,本来就是字段,没必要家,如果加了还是容错一下曲调
            params.push(field.slice(1))
            sql = '??'
        }else{
            let [nsSql, nsParams] = notSpecial(field)
            params.push(...nsParams)
            sql = nsSql //'??'
        }
        return [sql, params]
    }

    public static buildFields(_fields:Array<string|ExpressionSite>){
        let sqlArr:any[] = []
        let params:any[] = []
        let fields = _fields.map(f=>{
            if(typeof f === 'string'){
                return f.trim()
            }else{
                return f
            }
        })
        // 如果有 select * 之类的情况,mysql语法要求必须把*放第一位,不然其他字段必须家别名或表名引导出来
        if(fields.includes('*')){
            _.remove(fields,e=>e=='*')
            sqlArr.push('*')
        }
        fields.forEach(field=>{
            if(typeof field ==='string'){
                // 字符串
                let [ssql, sparams] = this.specialString(field,f=> ['??', [f]])
                sqlArr.push(ssql)
                params.push(...sparams)
            }else{
                //site表达式
                let [innerSqls, innerParam] = this.buildSite(field)
                sqlArr.push(...innerSqls)
                params.push(...innerParam)
            }
        })
        return [sqlArr,params]
    }

    /**
     * 构建group by 语句块, 后面重构构建者模式 作准备
     * @param fields string|ExpressionSite数组 @link :Fields
     */
    public static buildGroupBy(fields:Fields):string {
        let [sqls, params] = this.buildFields(fields)
        let ret = mysql.format(sqls.join(','),params)
        return ret
    }

    public static buildOrderBy(fields:Fields):string {
        let [sqls, params] = this.buildFields(fields)
        let ret = mysql.format(sqls.join(','),params)
        return ret
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
            if(s.p?.p){
                let [innerSqls, innerParam] = this.buildSite(s.p)
                sql.push(...innerSqls)
                params.push(...innerParam)
                // throw new vError({
                //     name: 'noimplimentation',
                //     info:{code:0, }
                // },'表达式嵌套功能暂不支持', {})
            }
            //如果参数是字段
            if(typeof s.p === 'string'){
                let [ssql, sparams] = this.specialString(s.p,f=> ['?', [f]])
                
                placeholder = ssql
                params.push(...sparams)
            } else if (Array.isArray(s.p)){
                // 一个site如果p是数组,这种情况应该是fn(,...)
                placeholder =s.p.map(p=>{

                    // 这里好像可以递归buildSite
                    if(typeof p === 'string'){
                        let [ssql, sparams] = this.specialString(p,f=> ['?', [f]])
                        params.push(...sparams)
                        return ssql
                    } else if(Array.isArray(p)){
                        let [innerSqls, innerParam] = this.buildSite(p)
                        params.push(...innerParam)
                        return innerSqls.join(',')
                    } else if(p.p){
                        let [innerSqls, innerParam] = this.buildSite(p)
                        params.push(...innerParam)
                        return innerSqls.join(',')
                    } else {
                        params.push(p)
                        return '?'
                    }

                }).join(',')
            } else {
                // 值
                placeholder = '?'
                params.push(s.p)
            }


            let pSql
            if(s.fn){
                this.checkSqlDangerAndThrowError(s.fn)
                pSql = `${s.fn}(${placeholder})`
            } else {
                pSql = `${placeholder}`
            }

            if(s.as){
                pSql += ' as ??'
                params.push(s.as)
            }
            if(s.desc){
                pSql += ' desc'
            }

            sql.push(pSql)
        });

        return [sql,params]
    }

    private static checkSqlSiteAndThrowError(okayCondition:boolean){
        if(okayCondition){
            return true
        }
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
            sql = ls[0]
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
        if(link.o){
            // linkSql.push(' ? ')
            // linkSqlParam.push(extra.where.obj)
            // let wo = link.obj
            // Object.keys(wo).map(k=>{
            //     linkSql.push('??=?')
            //     linkSqlParam.push(k)
            //     linkSqlParam.push(wo[k])
            // })
            linkSql.push('?')
            linkSqlParam.push(link.o)
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

    public static genInsert<T>(tbName: string, obj?: Partial<T>, extra?: SqlExtra){
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
        if(extra?.fields){
            sql = `${sql} set ${setSqlStr} returning ${extra.fields.join(',')}`
        }else{
            sql = `${sql} set ${setSqlStr}`
        }
        return {sql, params}
    }



    public static genGetById(tbName: string, id:string, fields:string[]=['*'], showExtraField:boolean=false){
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
        
        params.push(this.cc(tbName))
        params.push(id)
        if(this.waitSecond>=0){
            sql = `${sql} for update wait ${this.waitSecond}`
        }
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
        params.push(this.cc(tbName))
        params.push(obj)
        if(this.waitSecond>=0){
            sql = `${sql} for update wait ${this.waitSecond}`
        }
        return {sql, params}
    }

    private static getJoinType(jt:JoinModel){
        let joinTypeMap = {
            l:'left join',
            r:'right join',
            i:'inner join',
            f:'full join',
        }

        for (const k in joinTypeMap) {
            if(jt[k]){
                return [k,joinTypeMap[k]]
            }
        }
        return [null,null]
    }
    public static buildJoin(joinArr:UseJoin){
        let joinSqlStr = ''
        let joinParams:any[] = []

        this.checkSqlSiteAndThrowError(joinArr.length>0)
        
        joinArr.forEach((jt,idx) => {
            // raw string
            if(typeof jt === 'string'){
                // 好像没必要每次检查,最后检查一次 性能好点,
                this.checkSqlDangerAndThrowError(jt)
                joinSqlStr += this.cc(jt)+'\n'
                return
            } 

            joinParams.push(this.cc(jt.tb))
            let as=''
            if(jt.as){
                as = `as ??`
                joinParams.push(this.cc(jt.as))
            }
            if(idx>0){
                let [joinTypeKey,joinType]=this.getJoinType(jt)
                
                // 不是第一个表,后面join的必须有jointype
                this.checkSqlSiteAndThrowError(joinTypeKey)
                
                let linkBlock = jt[joinTypeKey]
                let [onSql, onParams] = this.buildLink(linkBlock)
                joinParams.push(...onParams)
                joinSqlStr += `${joinType} ?? ${as} on ${onSql}\n`
            }else{
                // 第一个主表不需要 jointype
                joinSqlStr += `?? ${as}\n`
            }
        });
        // 最后检查一次
        // this.checkSqlDangerAndThrowError(joinSqlStr)
        return [joinSqlStr, joinParams]
    }

    public static genSelect(tbName: string|UseJoin, extra: SqlExtra){
        this.checkSqlSiteAndThrowError(!!tbName.length)

        // let fields = _.cloneDeep(field)

        let fromSql = ''
        let fromSqlParam: Array<any> = []
        if(typeof tbName === 'string'){
            this.checkSqlDangerAndThrowError(tbName)
            fromSql = `from ${this.cc(tbName)}\n`
        } else if(Array.isArray(tbName)) {
            let [joinSqlStr, joinParams] = this.buildJoin(tbName)
            fromSql = `from ${joinSqlStr}`
            fromSqlParam = <any[]>joinParams
        }

        // let selParam:any[] = []
        // let selSql:any[] = []
        this.checkSqlSiteAndThrowError(!!extra?.fields?.length)
        
        let [selSql, selParam] = this.buildFields(<Fields>extra.fields)
        // if(fields.length){
        //     let startField = _.remove(fields,f=>f.trim()=='*')
        //     if(fields.length){
        //         selSql.push('??')
        //         selParam.push(fields.map(f=>`${f}`))
        //     }
        //     if(startField.length){
        //         selSql.push(`*`)
        //     }
        // }
        // if(extra?.select?.invisibleField?.length){
        //     selSql.push('??')
        //     selParam.push(fields.map(f=>`${f}`))
        // }
        // if(extra?.select?.rawSelect){
        //     selSql.push(extra.select.rawSelect)
        // }

        let [whereSqlStr, whereSqlParam] = this.buildLink(extra?.where)
        let sql = `select ${selSql.join(',')}\n${fromSql}where ${whereSqlStr}`
        // ${orderSql}
        // ${paginSql}
        
        let orderSql=''
        if(extra?.order){
            orderSql = `order by ${this.buildOrderBy(extra.order)}`
        }

        // let paginSelSql = ''
        // let paginSql = ''
        
        let groupbyStr = ''
        if(extra.groupBy){
            groupbyStr = `group by ${this.buildGroupBy(extra.groupBy)}`
        }
        if(extra?.pagin){
            sql = this.pagin(sql, extra.pagin.page, extra.pagin.pagesize, groupbyStr, orderSql)
        }else{
            sql = `${sql}${groupbyStr}${orderSql}`
        }

        if(this.waitSecond>=0){
            sql = `${sql} for update wait ${this.waitSecond}`
        }

        // const params = selParam.concat(...fromSqlParam).concat(...whereSqlParam)
        const params = [...selParam, ...fromSqlParam, ...whereSqlParam]
        
        return {sql, params}
    }


    public static genUpdate<T>(tbName: string, setObj?: Partial<T>, extra?: SqlExtra){
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


    public static genDelete(tbName:string, extra: SqlExtra){
        let [whereSqlStr, whereSqlParam] = this.buildLink(extra.where)
        this.checkSqlSiteAndThrowError( !!whereSqlStr)

        let sql = `delete from ?? where ${whereSqlStr}`
        let params=[tbName,...whereSqlParam]
        return {sql, params}
    }

    

}