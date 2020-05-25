import * as pmysql from 'promise-mysql'
import { SqlExtra } from '@src/type'
import { conditionRelation } from "@src/constant";
import _ from 'lodash';
import { getPoolp } from '@src/common/mysql';
import { MySqlGen, SqlGen } from './orm/mysqlGen';
import { tableInvisible } from '../models/tableBase';

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
        console.log([data, fields, query]);
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
    
    async insertValue<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra): Promise<{ data: T, fields, query }> {
        if (!tbName) {
            throw 'tbName必须提供'
        }
        if (!obj && !extra?.set?.rawSet && extra?.set?.cdm?.length) {
            throw 'obj 和 extra.set不能都不提供'
        }

        let {sql, params} = this.sqlGen.genInsert(tbName, obj, extra)

        let conn = await this.getConn()
        let [data, fields, query] = await conn.query(sql, params)
        console.log([data, fields, query]);
        return { data, fields, query }
    }

    async insertIgnorNullValue<T>(tbName: String, obj?: Partial<T>, extra?: SqlExtra): Promise<{ data: T, fields, query }> {
        // _.isObject(objs) && (objs=[objs])
        // let insObjs = objs.map(obj => _.omitBy(obj, o=>_.isNil(o)));
        const insObj = _.omitBy(obj, o => _.isNil(o)) as Partial<T>
        let ret = await this.insertValue(tbName, insObj, extra)
        return ret
    }



    async list(tbName: String, field: Array<string>, extra?: SqlExtra): Promise<{ data, cnt:number, fields, query }> {
        if (!tbName) {
            throw 'tbName必须提供'
        }
        if (!field.length && !extra?.select?.rawSelect && extra?.select?.invisibleField?.length) {
            throw '没有提供需要查询的field'
        }

        let {sql, params} = this.sqlGen.genSelect(tbName, field, extra)

        let conn = await this.getConn()
        let [data, fields, query] = await conn.query(sql, params)
        let cnt = data.length
        if(extra?.pagin){
            [cnt] = await conn.query(this.sqlGen.countSql)
        }
        // console.log([data, fields, query]);
        return { data, cnt, fields, query }
    }

    /**
     * 假删除的数据不查询
     * @param tbName 表名
     * @param field 字段列表
     * @param extra 扩展查询
     */
    async listNormal(tbName: String, field: Array<string>, extra?: SqlExtra): Promise<{ data, cnt:number, fields, query }> {
        extra = _.mergeWith(extra, {
            where:{
                cdm:[{
                    p:'deleteAt',
                    v:null,
                    r:'is'
                }]
            }
        }, (o,s)=>{
            if(_.isArray(o)) 
            return o.concat(s)
        })

        let ret = await this.list(tbName, field, extra)
        
        return ret
    }

    allInvisibleFields<T>(clazz:{ new(): T }):Array<keyof (T|tableInvisible)> {
        const fields = _.intersection(Object.keys(clazz.prototype), Object.keys(tableInvisible.prototype))
        return fields as any
    }


}
