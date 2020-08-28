import { Dao } from "./dao"
import { User } from "@src/models/table/user"
import { Org } from "@src/models/table/org"
import { Role } from "@src/models/table/role"
import { Router } from "@src/models/table/router"
import { Routerpoint } from "@src/models/table/routerpoint"
import { Pointer } from "@src/models/table/pointer"
import { Tag } from "@src/models/table/tag"
import { Team } from "@src/models/table/team"
import { Teamperson } from "@src/models/table/teamperson"
import { Device } from "@src/models/table/device"
import { Setdevicenfc } from "@src/models/table/setdevicenfc"



export class AppDao{
    /**
     * 初始化设备,如果imei已存在device就update,否则insert
     * @param imei 
     * @param orgIds 
     */
    // static async replaceDevice(imei: any, orgIds: string[] | undefined) {
    //     const dao = new Dao()
    //     const devs = await dao.getBy<Device>(Device.name,{imei,state:1},['id'])
    //     let dev= devs.pop()
    //     if(!dev){
    //         await dao.add<Device>(Device.name, {imei,orgIds})
    //     }else{
    //         await dao.update<Device>(Device.name, {imei,orgIds,id:dev.id})
    //     }
    // }

    static async initDevice(tagId: any, imei: any) {
        // const dao = new Dao()
        // let [setdevicenfc] = await dao.getBy<Setdevicenfc>(Setdevicenfc.name,{tagId},['orgIds','state'])
        // return setdevicenfc
    }

    static async getSetdevicenfc(tagId: any) {
        const dao = new Dao()
        let setdevicenfcs = await dao.getBy<Setdevicenfc>(Setdevicenfc.name,{tagId},['orgIds','state'])
        let setdevicenfc = setdevicenfcs.pop()
        return setdevicenfc
    }

    static async getOfflineBaseData(){
        const dao = new Dao()

        // 第一版有使用Offline权限的
        // ScManager	保安经理	保安經理	Security Manager
        // ScGurad	保安	保安	Security Gurad
        let user = await dao.listWsd([User.name])
        let org = await dao.listWsd([Org.name])
        let role = await dao.listWsd([Role.name])
        let router = await dao.listWsd([Router.name])
        let routerpoint = await dao.listWsd([Routerpoint.name])
        let pointer = await dao.listWsd([Pointer.name])
        let tag = await dao.listWsd([Tag.name])
        let team = await dao.listWsd([Team.name])
        let teamperson = await dao.listWsd([Teamperson.name])

        return {user:user.data,org:org.data,role:role.data,router:router.data,routerpoint:routerpoint.data,pointer:pointer.data,tag:tag.data,team:team.data,teamperson:teamperson.data}
    }



    static async setupDeviceNfc(){
        throw new Error("Method not implemented.")
        const dao = new Dao()
    }


    static async getDeviceByImei(imei){
        const dao = new Dao()
        let devices = await dao.getBy<Device>(Device.name,{imei},['id','state','orgIds'])
        let device =devices.pop()
        return device
    }


    static async setupDevice(orgIds, imei, sim){
        const dao = new Dao()


        let orgCodeRet = await dao.listWsd(Org.name, {
            where:{
                cdm:[{
                    lt:{p:'$id'},
                    r:'in',
                    rt:{p:orgIds}
                }]
            },
            fields:['code']
        })

        const devs = await dao.getBy<Device>(Device.name,{imei,state:1},['id'],true)
        let dev= devs.pop()
        if(!dev){
            let {data} = await dao.add<Device>(Device.name, {imei,sim},{
                fields:['id'],
                set:{
                    cdm:[{
                        lt:{p:'$orgIds'},
                        rt:{p:orgCodeRet.data,fn:'json_array'}
                    }]
                }
            })
            // device = data
        }else{
            await dao.updateInv<Device>(Device.name, {id:dev.id,sim},{
                set:{
                    cdm:[{
                        lt:{p:'$orgIds'},
                        rt:{p:orgCodeRet.data,fn:'json_array'}
                    }]
                }
            })

        }



        return {orgIds, orgCodes: orgCodeRet.data}
    }


    static async updateDevice(obj){
        const dao = new Dao()
        let ret = await dao.updateInv(Device.name, obj)
        return ret
    }

}

