export class Tag{
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
    pointerId?:string= undefined
    pointerCode?:string= undefined
    tagType?:string= undefined
    tagId?:string= undefined
    rssi?:string= undefined
}