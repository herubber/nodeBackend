import { Dao } from "./dao"
import { user } from "@src/models/table/user"






export async function getOfflineBaseData(){
    const dao = new Dao()


    // 第一版有使用Offline权限的
    // ScManager	保安经理	保安經理	Security Manager
    // ScGurad	保安	保安	Security Gurad
    await dao.listWsd([user.name])


}


// 
