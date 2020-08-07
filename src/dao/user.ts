// import { useConn, insertIgnorNullValue } from "../common/mariadb";
import { useConnp } from "@src/common/mysql";
import _ from "lodash";
import { user } from "@src/models/table/user";
import { Dao } from "./dao";

export async function addUser(_userObj:Partial<user>){
    const dao = new Dao()
    let userObj = _.omit(_userObj, ['pwd']) as Partial<user>
    let u = await dao.insertIgnorNullValue(user.name, userObj, { 
        set:{
            cdm:[{
                p:'pwd',
                v:_userObj.pwd,
                f:'password'
            }],
        },
        returning:'*'
    })
    return u.data[0]

    // let ret = await useConnp(async conn=>{
    //     let userObj = _.omit(_userObj, ['pwd']) as Partial<user>

    //     const dao = new Dao(conn)
    //     let u = await dao.insertIgnorNullValue(user.name, userObj, { set:{
    //         cdm:[{
    //             p:'pwd',
    //             v:_userObj.pwd,
    //             f:'password'
    //         }]
    //     }})
    //     return u.data
    // })
    // return ret
}


export async function getUserById(id: string){
    const dao = new Dao()
    const ret = await dao.listNormal(user.name, ['*'],{
        where:{
            obj:{id}
        }
    })
    return ret.data
}

export async function verifyUserByPwd(usr, pwd: string):Promise<[Partial<user>]>{
    const dao = new Dao()
    const ret = await dao.listNormal(user.name, ['*'],{
        where:{
            obj:{usr},
            cdm:[{
                p:'pwd',
                v:pwd,
                f:'password'
            }]
        }
    })
    // if(ret.data)
    return ret.data
}





// angular 源码 定义 class 接口 是继承 一个 Function
export interface Type<T> extends Function { new (...args: any[]): T; }

function create<T>(clazz: Type<T>): T {
    let ret = new clazz();
    return ret
}
class A {
    public static attribute = "ABC";
    public k = 3
}
let a = create(A);
a.k

