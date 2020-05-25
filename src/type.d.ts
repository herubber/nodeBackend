import { Context, Next } from "koa"
import { ConditionRelation } from './constant'
import { PoolConnection } from "promise-mysql";
import { Dao } from "./dao/dao";
import { Payload } from "./models/payload";


declare module "koa" {
    interface Context {
        // session: session.Session | null;
        // readonly sessionOptions: session.opts | undefined;
        jwtSign: (payload: Payload, exp?: number) => any;
        scodeSign?: (uid: string) => any;
        newTransDao : () => Promise<void>;
        // mysqlTransConn?:PoolConnection
        mysqlTransDao?:Dao
        // [name:string]:any
    }
}

declare module "mysql" {
  interface PoolConfig{
    returnArgumentsArray?:boolean
  }
}

// export type Partial<T> = {
//   [P in keyof T]?: T[P];
// }

export declare interface CondictionModel{

    /**字段名 */
    p:string

    /**参数值 */
    v:any

    /**函数名,如果有需要 */
    f?:string

    /**关系 ConditionRelation,  */
    r?: keyof ConditionRelation

}

export declare interface SqlExtra{
  returning?:string,
  set?:{
    cdm?:Array<CondictionModel>,
    rawSet?:string
  },
  select?:{
    invisibleField?:Array<string>,
    rawSelect?:string
  },
  where?:{
    obj?:any,
    cdm?:Array<CondictionModel>,
    rawWhere?:string
  },
  order?:{
    desc?:boolean,
    rawOrder:string[],
  },
  pagin?:{
    pagesize:number,
    page:number,
  }
}


export type ResData = {
  code: number;
  msg?: string;
  data?: any;
  err?: any;
}
// type PlainObject = { [P: string]: any };
type PlainObject = Record<string, any>;
type MysqlResult = {
  affectedRows?: number;
  insertId?: string;
}

type RouteMeta = {
  name: string;
  method: string;
  path: string;
  isVerify: boolean;
}

type MiddleWare = (...arg: any[]) => (ctx: Context, next?: Next) => Promise<void>;

export {
  // ResData,
  MysqlResult,
  PlainObject,
  RouteMeta,
  MiddleWare,
}