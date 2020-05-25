/**
 * database connect pool utility
 */
import mysql, { Pool } from 'mysql'
import * as pmysql from 'promise-mysql'
import { mysqlPoolCfg as dbConfig } from '@src/config'
import log from './logger'
import { ConditionRelation } from '@src/constant'
import _ from "lodash";
import {SqlExtra} from '@src/type'
import { conditionRelation } from "@src/constant";



let pool: Pool|null = null;



/**
 * get the connection of database
 * 获取数据库连接
 */
export const useConn = (act: Function) => {
  if (!pool) {
    log.info("creating pool");
    pool = mysql.createPool(dbConfig);
  }
  pool.getConnection((err, conn) => {
    if (err || !conn) {
      log.error(err);
    } else {
      act(conn);
    }
  });
}

/**
 * get the connection pool of database
 * 获取数据库连接池
 */
export const getPool = () => {
  if (!pool) {
    log.info("creating pool");
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}




let poolp :pmysql.Pool
export const getPoolp = async ()=>{
    if(!poolp){
        log.info("creating pool");
        try {
            poolp = await pmysql.createPool(dbConfig)
        } catch (error) {
            throw error
        }
    }
    return poolp
}



export async function useConnp(act: (conn: pmysql.PoolConnection)=>any) {
    let conn:pmysql.PoolConnection|null=null;
    try {
        poolp = await getPoolp()
        conn = await poolp.getConnection();
        let ret = await act(conn);
        return ret
    } catch (err) {
        throw err;
    } finally {
      let reret = conn?.release()
      console.log(reret)
        // if (conn) conn.release(); //release to pool
    }
}

export async function getConnp() {
    let conn:pmysql.PoolConnection|null=null;
    if(poolp!=null){
        poolp = await getPoolp()
    }
    conn = await poolp.getConnection();
    return conn
}


// export async function insertIgnorNullValue(conn: pmysql.PoolConnection|pmysql.Pool, tbName: String, obj?, extra?:SqlExtra) {
//     // _.isObject(objs) && (objs=[objs])
//     // let insObjs = objs.map(obj => _.omitBy(obj, o=>_.isNil(o)));
//     const insObj = _.omitBy(obj, o=>_.isNil(o))
//     return await insertValue(conn, tbName, insObj, extra)
// }




// export async function insertValue(conn: pmysql.PoolConnection|pmysql.Pool, tbName: String, obj?, extra?:SqlExtra) {
//   if(!tbName){
//     throw 'tbName必须提供'
//   }
//   if(!obj && !extra?.set?.rawSet && extra?.set?.cdm?.length){
//     throw 'obj 和 extra.set不能都不提供'
//   }


//   let sql = `INSERT INTO ${tbName} SET`
//   let params:Array<any> = []
  
//   let setSql:Array<any> = []
//   if(obj) {
//     setSql.push(' ? ')
//     params.push(obj)
//   }

//   if(extra?.set?.cdm?.length) {
//     extra.set.cdm.forEach(c=>{
//       let cdmSql
//       let r = ' = '
//       if(c.r){
//         r = ` ${conditionRelation[c.r]} `
//       }
//       if(c.f){
//         cdmSql = `?? ${r} ${c.f}(?)`
//       }else{
//         cdmSql = `?? ${r} ?`
//       }
//       setSql.push(cdmSql)
//       params.push(c.p)
//       params.push(c.v)
//     })
//   }

//   if(extra?.set?.rawSet){
//     setSql.push(extra.set.rawSet)
//   }
//   let setSqlStr = setSql.join(' , ')
//   sql = `${sql}${setSqlStr} returning *`

//   let [data, fields, query] = await conn.query(sql, params)
//   console.log([data, fields, query]);
//   return {data, fields, query}
// }






