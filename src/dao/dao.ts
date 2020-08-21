import * as pmysql from 'promise-mysql'
import { SqlExtra, UseJoin } from '@src/type'
import { conditionRelation } from "@src/constant";
import _ from 'lodash';
import { getPoolp } from '@src/common/mysql';
import { MySqlGen, SqlGen, identityField } from './orm/mysqlGen';
import { tableInvisible } from '../models/tableBase';

const sDelField = 'deleteAt'

export class Dao {

    public conn: pmysql.PoolConnection | undefined
    private isTrans = false
    sqlGen: SqlGen = MySqlGen
    // get async conn() {
    //     return await getPoolp()
    // }

    // public static async getDao(_conn?:pmysql.PoolConnection|pmysql.Pool){
    //     if (!_conn) {
    //         _conn = await getPoolp()
    //     }
    //     return new Dao(_conn)
    // }
    constructor(
        _conn?: pmysql.PoolConnection
    ) {
        this.conn = _conn
    }

    private async getConn() {
        if (!this.conn) {
            return await getPoolp()
        } else {
            return this.conn
        }
    }

    async query(sql, args){
        let conn = await this.getConn()
        let [data, fields, query] = await conn.query(sql, args)
        
        return { data, fields, query }  
    }

    async beginTrans(){
        this.isTrans ?? await this.conn?.beginTransaction()
    }

    async commit(){
        this.isTrans ?? await this.conn?.commit()
        this.isTrans =false
    }

    async rollback(){
        this.isTrans ?? await this.conn?.rollback()
        this.isTrans =false
    }

    releaseConn(){
        let relRet = this.conn?.release()
        this.conn = undefined
        return relRet
    }
    
    /**
     * insert 
     * @param tbName 
     * @param obj 
     * @param extra 
     */
    async add<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra): Promise<{ data: T, fields, query }> {
        if (!tbName) {
            throw 'tbName必须提供'
        }
        if (!obj && !extra?.set?.rawSet && extra?.set?.cdm?.length) {
            throw 'obj 和 extra.set不能都不提供'
        }

        let {sql, params} = this.sqlGen.genInsert(tbName, obj, extra)

        let conn = await this.getConn()
        let [data, fields, query] = await conn.query(sql, params)
        return { data, fields, query }
    }

    /**
     * insert by object ignor nil value
     * @param tbName 
     * @param obj 
     * @param extra 
     */
    async addInv<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra): Promise<{ data: T, fields, query }> {
        // _.isObject(objs) && (objs=[objs])
        // let insObjs = objs.map(obj => _.omitBy(obj, o=>_.isNil(o)));
        const insObj = _.omitBy(obj, o => _.isNil(o)) as Partial<T>
        let ret = await this.add(tbName, insObj, extra)
        return ret
    }

    
    async update<T>(tbName: String, obj?: Partial<T>, extra?:SqlExtra){
        let {sql, params} = this.sqlGen.genUpdate(tbName, obj, extra)
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data.affectedRows
    }

    /**
     * soft delete a record by id
     * @param tbName 
     * @param id 
     */
    async sDelete(tbName:String, id:String){
        let {sql, params} = this.sqlGen.genUpdate(tbName, {sDelField:null}, {where:{o:{[identityField]:id}}})
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data.affectedRows
    }

    /**
     * soft delete a record by Extra.where
     * @param tbName 
     * @param extra 
     */
    async sDeleteBy(tbName:String, extra:SqlExtra){
        let {sql, params} = this.sqlGen.genUpdate(tbName, {sDelField:null}, extra)
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data.affectedRows
    }

    /**
     * delete a record by id
     * @param tbName 
     * @param id 
     */
    async delete(tbName:String, id:String){
        let {sql, params} = this.sqlGen.genDelete(tbName, {where:{o:{[identityField]:id}}})
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data.affectedRows
    }

    /**
     * delete a record by Extra.where
     * @param tbName 
     * @param extra 
     */
    async deleteBy(tbName:String, extra:SqlExtra){
        let {sql, params} = this.sqlGen.genDelete(tbName, extra)
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data.affectedRows
    }
    

    /**
     * update by object ignor nil value
     * @param tbName 
     * @param obj 
     * @param extra 
     */
    async updateInv<T>(tbName: String, obj?: Partial<T>, extra?:SqlExtra){
        const updObj = _.omitBy(obj, o => _.isNil(o)) as Partial<T>
        let ret = await this.update(tbName, updObj, extra)
        return ret
    }

    
    async get(tbName: String, id:string, field:Array<string>=['*'],showExtraField=false){
        let {sql, params} = this.sqlGen.genGetById(tbName,id,field,showExtraField)
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data
    }

    async getBy(tbName: String, obj:any, field:Array<string>=['*'],showExtraField=false){
        let {sql, params} = this.sqlGen.genGetByWhereObj(tbName,obj,field,showExtraField)
        let conn = await this.getConn()
        let [data] = await conn.query(sql, params)
        return data
    }



    /**
     * 查询
     * @param tbName raw string as from block, but recommend use UseJoin model for safety
     * @param field 
     * @param extra 
     * @param nestTables 
     */
    async list(tbName: String|UseJoin, _extra?: SqlExtra, nestTables?:undefined|boolean|string): Promise<{ data, cnt:number}> {
        if (!tbName || !tbName.length) {
            throw 'tbName必须提供'
        }

        let extra = Object.assign({fields:['*']},_extra) 
        let {sql, params} = this.sqlGen.genSelect(tbName, extra)

        let qryOpt = sql
        if(nestTables){
            qryOpt = {sql, nestTables}
        }else if(extra.fields?.includes('*') && Array.isArray(tbName) && tbName.length>1 ){
            nestTables=true
            qryOpt = {sql, nestTables}
        }
        let conn = await this.getConn()
        let [data, fields, query] = await conn.query(qryOpt, params)
        let cnt = data.length
        if(nestTables===true){
            data = data.map(d=>({...d}))
        }
        if(extra.pagin){
            let [[{count}]] = await conn.query(this.sqlGen.countSql)
            cnt = count
        }
        
        return { data, cnt }
    }

    /**
     * 假删除的数据不查询
     * list Without soft delete
     * @param tbName 表名
     * @param field 字段列表
     * @param extra 扩展查询
     */
    async listWsd(tbName: String|UseJoin, extra?: SqlExtra): Promise<{ data, cnt:number }> {
        extra = _.mergeWith(extra, {
            where:{
                cdm:[{
                    lt:{p:'$deleteAt'},
                    r:'is',
                    rt:{p:null},
                }]
            }
        }, (o,s)=>{
            if(_.isArray(o)) 
            return o.concat(s)
        })

        let ret = await this.list(tbName, extra)
        
        return ret
    }

    allInvisibleFields<T>(clazz:{ new(): T }):Array<keyof (T|tableInvisible)> {
        const fields = _.intersection(Object.keys(clazz.prototype), Object.keys(new tableInvisible()))
        return fields as any
    }

    

}




// let u: UseJoin = ['234',{
//     $join:{
//         a:'3'
//     }
// },{
//     $leftJoin:{
//         a:'3'
//     }
// }]
