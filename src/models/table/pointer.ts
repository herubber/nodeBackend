export class Pointer{
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
    cnName?:string= undefined
    hkName?:string= undefined
    enName?:string= undefined
    code?:string= undefined
    nearPointer1?:string= undefined
    nearPointerCode1?:string= undefined
    nearPointer2?:string= undefined
    nearPointerCode2?:string= undefined
    nearPointer3?:string= undefined
    nearPointerCode3?:string= undefined
    nearPointer4?:string= undefined
    nearPointerCode4?:string= undefined
    nearPointer5?:string= undefined
    nearPointerCode5?:string= undefined
    nfcIds?:string[]= undefined
    beaconIds?:string[]= undefined
    beaconLimit?:number= undefined
}