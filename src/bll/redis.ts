import { redis } from "@src/common/redis"
import { User } from "@src/models/table/user"
import { Dao } from "@src/dao/dao"


export default {
    saveUser( user:User){
        redis.hmset(`user:${user.id}`, <any>user)
    }
    // getUser( user:user){
    //     redis.hmset(`user:${user.id}`, <any>user)
    // }



}

