import { user } from "./table/user";
import { tableInvisible } from "./tableBase";
import _ from "lodash";


const ivb = new tableInvisible()
export const invisibleFieldsArray = Object.getOwnPropertyNames(ivb)
export const invisibleFields:{[name in keyof tableInvisible]:string} = Object.fromEntries(invisibleFieldsArray.map(a=>[a,a])) as any



const u = new user()
export const userFieldsArray = Object.getOwnPropertyNames(u)
export const userFields:{[name in keyof user]:string} = Object.fromEntries(userFieldsArray.map(a=>[a,a])) as any
export const userInvisibleFieldsArray = _.intersection(invisibleFieldsArray,userFieldsArray)
export const userInvisibleFields:{[name in keyof (user|tableInvisible)]:string} = _.pick(userFields,userInvisibleFieldsArray) as any

console.log(userFields)
