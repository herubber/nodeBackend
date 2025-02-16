import mariadb from "mariadb";
import * as _ from 'lodash'
import { mariadbPoolCfg } from "@src/config";

// const mariadb = require('mariadb');
export const pool = mariadb.createPool(mariadbPoolCfg);

export async function useConn(act: (conn: mariadb.PoolConnection)=>any) {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("connected ! connection id is " + conn.threadId);
        let ret = await act(conn);
        return ret
        // const rows = await conn.query("SELECT 1 as val");
        // rows: [ {val: 1}, meta: ... ]

        // const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
        // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

// export async function insertIgnorNullValue(conn: mariadb.PoolConnection, tbName: String, objs ) {
//     _.isObject(objs) && (objs=[objs])
//     let insObjs = objs.map(obj => _.omitBy(obj, o=>_.isNil(o)));
//     let ret = insObjs.map(async insObj => {
//         let obj = await conn.query(`INSERT INTO ${tbName} SET ?`, insObj)
//         console.log(obj);
//         return  obj
//     });
// }





// export const exportDao = (sql: string) => {
//   return (...args: any[]): Promise<any> => new Promise((resolve, reject) => {
//     log.info('====== execute sql ======')
//     log.info(sql, ...args);
//     const callback = (err, result) => {
//       if (err) reject(err)
//       else resolve(result);
//     }
//     if (!sql) pool.query(args.shift(), callback);
//     else pool.query(sql, ...args, callback);
//   });
// }

// /**
//  * sql transaction
//  * @param  {Array} list 
//  * const rets = await transaction([
//  *     ["insert into user_group values (?,?)",[11,11]],
//  *     ["insert into user_friend set ? ",{user_id:'12',friend_id:12}],
//  *     'select * from user'
//  * ]);
//  */
// export const transaction = (list: any[]): Promise<any[]> => {
//   return new Promise((resolve, reject) => {
//     if (!Array.isArray(list) || !list.length) return reject('it needs a Array with sql')
//     pool.getConnection((err, connection) => {
//       if (err) return reject(err);
//       connection.beginTransaction(err => {
//         if (err) return reject(err);
//         log.info('============ begin execute transaction ============')
//         let rets: any[] = [];
//         return (function dispatch(i) {
//           let args = list[i];
//           if (!args) {//finally commit
//             connection.commit(err => {
//               if (err) {
//                 connection.rollback();
//                 connection.release();
//                 return reject(err);
//               }
//               log.info('============ success executed transaction ============')
//               connection.release();
//               resolve(rets);
//             });
//           } else {
//             log.info(args);
//             // args = typeof args == 'string' ? [args] : args;
//             // const sql = args.shift();
//             const callback: queryCallback = (error, ret) => {
//               if (error) {
//                 connection.rollback();
//                 connection.release();
//                 return reject(error);
//               }
//               rets.push(ret);
//               dispatch(i + 1);
//             }
//             if (typeof args == 'string') connection.query(args, callback);
//             else connection.query(args.shift(), ...args, callback);
//           }
//         })(0);
//       });
//     });
//   })
// }
