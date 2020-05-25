import { useConnp } from "@src/common/mysql";
import _ from "lodash";
import { syslog } from "@src/models/table/syslog";
import { Dao } from "./dao";

export async function addLog(obj:Partial<syslog>){
    const dao = new Dao()
    let u = await dao.insertValue(syslog.name, obj)
    return u.data
}