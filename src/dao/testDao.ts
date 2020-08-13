import { Dao } from "./dao";
import { user } from "@src/models/table/user";


async function testSelect(){
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
    console.log(ret);

    let u = await dao.get(user.name, '97721130458021888')
    console.log(u);
    
    let us = dao.getBy(user.name, {usr:'test'})


}

async function testUpdate(){
    
}

