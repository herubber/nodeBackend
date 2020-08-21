

export class Router{

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

    state?:number= undefined

    orgId?:string= undefined
    orgCode?:string= undefined
    code?:string= undefined
    cnName?:string= undefined
    hkName?:string= undefined
    enName?:string= undefined
    routerType?:string= undefined
    frequent?:number[]= undefined
    startTime?:string= undefined
    endTime?:string= undefined
}