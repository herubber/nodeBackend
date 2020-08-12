
import { Context } from "koa";

// import {get} from '../decorator/controller'

import { post, get, addMidWare } from '../decorator/controller'
import { midNames } from "@src/middleware";
import { Dao } from "@src/dao/dao";
import { user } from "@src/models/table/user";

export default class Sign {
    @addMidWare(midNames.test1, { args: ['a', 'b'] })
    @addMidWare(midNames.test3, { order: 1 })
    @addMidWare(midNames.test2)
    @get('/test')
    async addOrg(ctx: Context){
        let dao = new Dao()
        const ret = await dao.listWsd(user.name, ['*'],{
            where:{
                obj:{usr:'test'},
                cdm:[{
                    lt:{p:'$pwd'},
                    rt:{
                        p:'123321',
                        fn:'password'
                    }
                }]
            }
        })
        // if(ret.data)
        console.log(ret.data)
        ctx.response.body = {
            foo : 'hello',
            bar : 'world',
            t:4
        }
        
    }


}