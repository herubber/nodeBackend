import { AppDao } from "@src/dao/appBaseData";
import { redis } from "@src/common/redis";
import { baseData, errCode, eCodeStr } from "@src/constant";
import _ from "lodash";
import { Redis, Pipeline } from "ioredis";
import { Dao } from "@src/dao/dao";



async function redis2obj(match, iteration?:(k:string,redis:Redis|Pipeline)=>boolean){
    let [,baseDataKey] = await redis.scan(0,"match",match,"count",10000)
    baseDataKey.forEach(bk=>{
        // let lastKey = bk.slice(bk.lastIndexOf(':'))
        // if(lastKey=='version'){
        if(iteration && iteration(bk,redis)){
            // 如果 iteration 处理号返回true
        }else{
            
        }
        
    })
}

/**
 * 状态是0或2抛出异常
 * @param state 通用状态代码
 * @param param 状态参数
 * @param cb 抛异常前执行
 */
function throwIfStateAbnormal(state,param,cb?){
    // 状态 0待审核, 1正常/使用, 2停用/冻结
    if(state==0){
        cb&&cb()
        throw new Error(eCodeStr(errCode.stateNeedAudit,[`$$${param}`]))
    } else if(state==2){
        cb&&cb()
        throw new Error(eCodeStr(errCode.stateNeedUnfreeze,[`$$${param}`]))
    }
}


export class OfflineRepository{
    private baseData = baseData
    async getBaseData(imei, version){

        let device = await AppDao.getDeviceByImei(imei)
        if(!device){
            throw new Error(eCodeStr(errCode.deviceNotInitial));
        }
        throwIfStateAbnormal(device.state, 'device')
        let data ={}
        // redis cache
        let curVersion = await redis.get(`${this.baseData}:version`)
        // version equal redis baseData version, no need sync
        if(version == curVersion){
            return data
        }

        let [,baseDataKey] = await redis.scan(0,"match",`${this.baseData}:*`,"count",10000)
        // baseDataKey = baseDataKey.sort()
        baseDataKey = baseDataKey.filter(k=>!k.endsWith(":version"))
        let pl = redis.pipeline()
        baseDataKey.forEach(bk=>{
            // let lastKey = bk.slice(bk.lastIndexOf(':'))
            // if(lastKey=='version'){
                pl.hgetall(bk)
        })
        
        let baseData = (await pl.exec()).map(([,r])=>r)
        baseDataKey.forEach((k,i)=>{
            // let lastKey = k.slice(k.lastIndexOf(':'))
            // if(lastKey=='version'){
            let bk = k.slice(k.indexOf(':')+1)
            let path = `${bk.slice(0, bk.indexOf(':'))}[${i}]`
            _.set(data,path,baseData[i])
            
        })
        for (const key in data) {
            data[key] = data[key].filter(e=>e)
        }

        // if has no cache, lode from db and cache it
        if(!data || _.isEmpty(data)){
            data = await AppDao.getOfflineBaseData()
            for(let k in data){
                for(let m of data[k]){
                    pl.hmset(`${this.baseData}:${k}:${m.id}`,m)
                }
            }
        }
        // pl.exec()
        try {
            let ret = await pl.exec()
        } catch (error) {
            console.log(error)
        }

        (<any>data).version = curVersion||'1'

        return data
    }

    async initDevice(tagId, imei, sim){
        let setdevicenfc = await AppDao.getSetdevicenfc(tagId)
        if(!setdevicenfc){
            // 不在setdevicenfc表里, 此卡不是集团初始化设备用卡
            throw new Error(eCodeStr(errCode.notInitialCard))
        }
        throwIfStateAbnormal(setdevicenfc.state, 'card')

        let ret = await AppDao.setupDevice(setdevicenfc.orgIds,imei, sim)
        
        return ret
    }
    

}