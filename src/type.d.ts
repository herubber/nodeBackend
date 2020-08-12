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

// export declare interface CondictionModel{

//     /**字段名 */
//     p:string

//     /**参数值 */
//     v:any|any[]

//     /**函数名,如果有需要 */
//     f?:string

//     /**关系 ConditionRelation,  */
//     r?: keyof ConditionRelation

// }


export type ExpressionGroup = Array<ExpressionModel|ExpressionGroup>

/**
 * Link扩展块, 用于hwere或 on 类似的条件表达式
 */
export declare interface LinkBlock{
  /**
   * 简单的field=value可以直接用obj对象传入
   */
  obj?:any,
  /**
   * 简单的条件表达式模型
   */
  // cdm?:Array<CondictionModel>,
  cdm?:ExpressionGroup,
  /**
   * 字符串方式
   */
  raw?:string
}



export declare interface SqlExtra{
  returning?:string,
  set?:{
    // cdm?:Array<CondictionModel>,
    cdm?:Array<ExpressionModel>,
    rawSet?:string
  },
  select?:{
    invisibleField?:Array<string>,
    rawSelect?:string
  },
  where?:LinkBlock,
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
type ExpressionSiteParam = string|ExpressionSite|any
export declare interface ExpressionSite{
  /**
   * 参数可以是字段名,用$开头
   * 可以是任何值
   * 暂时不可以是表达式本身,完善后可以用表达式本身,组织表达式树,递归嵌套解释表达式生成
   */
  p:ExpressionSiteParam|Array<ExpressionSiteParam>,
  /**
   * 函数名,如果有
   */
  fn?:string,
  /**
   * todo: 如果fn带over, 未实现8-12
   */
  over?:{
    p?:ExpressionSiteParam|Array<ExpressionSiteParam>,
    o?:ExpressionSiteParam|Array<ExpressionSiteParam>,
  }
}

/**
 * 表达式, 灵感于 .net fx 表达式/树模型, 这里设置没有用表达式书组成, 用到只能自己写sql了
 * 后面有空的就重构 构建者模式的设计,可以补充更复杂的嵌套sql
 */
export declare interface ExpressionModel{

  link?:'and'|'or'
  /**
   * 表达式左边
   */
  lt:ExpressionSite,
  /**
   * 表达式右边
   * 暂时想到between关系表达式右边带2个,所以可以是数组
   */
  rt?:ExpressionSite|Array<ExpressionSite>,
  /**
   * 暂时想到between关系表达式右边带2个
   */
  /**
   * 关系
   */
  r?:keyof ConditionRelation
}

type joinType = '$join'|'$left'|'$right'
export declare interface JoinModel{
  tb:string,
  as?:string,
  on:LinkBlock
}

export type $join = {$join:JoinModel}
export type $leftJoin = {$leftJoin:JoinModel}
export type $rightJoin = {$rightJoin:JoinModel}

declare type join = $join|$leftJoin|$rightJoin

export declare type UseJoin = Array<string|join>

export {
  // ResData,
  MysqlResult,
  PlainObject,
  RouteMeta,
  MiddleWare,
}