export class Device{
    id:string|undefined = undefined
    insertAt?:any= undefined
    updateAt?:any= undefined
    deleteAt?:any= undefined
    insertBy?:string= undefined
    updateBy?:string= undefined
    deleteBy?:string= undefined
    insertByCode?:string= undefined
    updateByCode?:string= undefined
    deleteByCode?:string= undefined
    memo:string|undefined= undefined
    state?:number=undefined

    orgIds?:string[]= undefined
    orgCodes?:string[]= undefined
    imei?:string= undefined
    sim?:string= undefined
    mac?:string= undefined
    latestUserId?:string= undefined
    latestUserCode?:string= undefined
}


