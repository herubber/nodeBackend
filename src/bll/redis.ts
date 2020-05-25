import { redis } from "@src/common/redis"
import { user } from "@src/models/table/user"


export default {
    saveUser( user:user){
        redis.hmset(`user:${user.id}`, <any>user)
    }
    // getUser( user:user){
    //     redis.hmset(`user:${user.id}`, <any>user)
    // }
}

