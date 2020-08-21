import { tableBase } from "../tableBase"

// export class user extends tableBase {
export class User {
    id:string|undefined = undefined
    insertAt?:any= undefined
    updateAt?:any= undefined
    deleteAt?:any= undefined
    insertBy?:string|undefined= undefined
    updateBy?:string|undefined= undefined
    deleteBy?:string|undefined= undefined
    insertByCode?:string|undefined= undefined
    updateByCode?:string|undefined= undefined
    deleteByCode?:string|undefined= undefined
    memo:string|undefined= undefined

    state:any= undefined
    
    usr:any= undefined
    pwd:any= undefined
    code:any= undefined
    cardId:any= undefined
    roleId?:string= undefined
    roleCode?:string=undefined
    orgIds?:string[]= undefined
    cnName?:string= undefined
    hkName?:string= undefined
    enName?:string= undefined
    age?:number= undefined
    passport?:string= undefined
    echelonid:any= undefined
    tel?:string= undefined
    email?:string= undefined
    alCardVerify?:number = undefined
    superiorId?:string= undefined
    lang?:string= undefined
}