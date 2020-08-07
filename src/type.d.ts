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
    v:any|any[]

    /**函数名,如果有需要 */
    f?:string

    /**关系 ConditionRelation,  */
    r?: keyof ConditionRelation

}


/**
 * where 扩展块, 应该用 抽象多种表达式类型
 */
export declare interface WhereBlock{
  /**
   * 简单的field=value可以直接用obj对象传入
   */
  obj?:any,
  /**
   * 简单的条件表达式模型
   */
  cdm?:Array<CondictionModel>,
  /**
   * 字符串方式
   */
  rawWhere?:string
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
  where?:WhereBlock,
  order?:{
    desc?:boolean,
    rawOrder:string[],
  },
  pagin?:{
    pagesize:number,
    page:number,
  },
  groupBy?:{
    rawGroupBy:string[]
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

declare interface ExpressionSite{
  fn?:string,
  p:Array<string|ExpressionSite|any>,
}

/**
 * 表达式, 灵感于 .net fx 表达式/树模型, 这里设置没有用表达式书组成, 用到只能自己写sql了
 * 后面有空的就重构 构建者模式的设计,可以补充更复杂的嵌套sql
 */
declare interface ExpressionModel{
  /**
   * 表达式左边
   */
  left:{
      fn:string,
      p:any|any[],
  },
  /**
   * 表达式右边
   * 暂时想到between关系表达式右边带2个,所以可以是数组
   */
  right:{
    fn:string,
    p:any|any[],
  }|Array<{
    fn:string,
    p:any|any[],
  }>,
  /**
   * 暂时想到between关系表达式右边带2个
   */
  /**
   * 关系
   */
  relate:keyof ConditionRelation
}

type joinType = '$join'|'$left'|'$right'
export declare interface JoinModel{
  tb:string,
  as?:string,
  on:Array<string|ExpressionModel>
}

type $join = {$join:JoinModel}
type $leftJoin = {$leftJoin:JoinModel}
type $rightJoin = {$rightJoin:JoinModel}

declare type join = $join|$leftJoin|$rightJoin

export declare type UseJoin = Array<string|join>

export {
  // ResData,
  MysqlResult,
  PlainObject,
  RouteMeta,
  MiddleWare,
}