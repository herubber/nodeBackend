

export class Payload{
    id:string=''
    code:string=''
    cnName:string=''
    hkName:string=''
    enName:string=''
}


const pl = new Payload()
export const payloadFieldsArray = Object.getOwnPropertyNames(pl)
export const payloadFields:{[name in keyof Payload]:string} = Object.fromEntries(payloadFieldsArray.map(a=>[a,a])) as any

