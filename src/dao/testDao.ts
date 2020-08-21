import { Dao } from "./dao";
import { User } from "@src/models/table/user";


export async function testSelect(){
    let dao = new Dao()
    // const ret = await dao.listWsd(user.name, ['*'],{
    //     where:{
    //         o:{usr:'test'},
    //         cdm:[{
    //             lt:{p:'$pwd'},
    //             rt:{
    //                 p:'123321',
    //                 fn:'password'
    //             }
    //         }]
    //     }
    // })
    // console.log(ret);

    // let u = await dao.get(user.name, '97721130458021888')
    // console.log(u);
    
    // let us = await dao.getBy(user.name, {usr:'test'})
    // console.log(us);

    let ret = await dao.list([{
        tb:'user',
        as:'u'
    },{
        tb:'org',
        as:'o',
        l:{
            cdm:[{
                lt:{
                    fn:'JSON_CONTAINS',
                    p:['$u.orgIds','$o.id']
                },
            }]
        }
    }],{
        where:{
            o:{
                "u.id":98731173353619460
            }
        },
        pagin:{
            pagesize:1,
            page:1
        }
    })
    console.log(ret)

    ret = await dao.list([{
        tb:'user',
        as:'u'
    },{
        tb:'org',
        as:'o',
        l:{
            cdm:[{
                lt:{
                    fn:'JSON_CONTAINS',
                    p:['$u.orgIds','$o.id']
                },
            }]
        }
    }],{
        fields:['$u.id', {p:'$o.id',fn:'count'}, {p:'$u.insertAt',fn:'UNIX_TIMESTAMP', as:'ii'}],
        where:{
            o:{
                "u.id":98731173353619460
            }
        },
        groupBy:['$u.id',{p:'$u.insertAt'}],
        order:[{p:'$u.id', desc:true}],
        pagin:{
            pagesize:1,
            page:1
        }
    })


    console.log(ret)
}

async function testUpdate(){
    
}

