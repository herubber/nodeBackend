import { redis } from "@src/common/redis"
import { User } from "@src/models/table/user"
import _ from "lodash"

export default {
    saveUser( user:User){
        redis.hmset(`user:${user.id}`, <any>user)
    },
    // getUser( user:user){
    //     redis.hmset(`user:${user.id}`, <any>user)
    // }

    async getUserById(id:string,fields?:(keyof User|'token')[]):Promise<Partial<User>>{   
        let usr:Partial<User>
        if(fields&&fields.length){
            let rmp = await redis.hmget(`user:${id}`,fields)
            usr = _.zipObject(fields, rmp)
        }else{
            usr = await redis.hgetall(`user:${id}`)
        }
        return usr
    }

}

