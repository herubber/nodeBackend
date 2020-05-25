import { tableBase } from "../tableBase"

// export class user extends tableBase {
export class user {
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
    roleId:any= undefined
    orgIds:any= undefined
    cnName:any= undefined
    hkName:any= undefined
    enName:any= undefined
    age:any= undefined
    passport:any= undefined
    echelonid:any= undefined
    tel:any= undefined
    email:any= undefined
    superiorId:any= undefined
}