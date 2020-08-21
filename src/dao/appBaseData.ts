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


export async function getOfflineBaseData(){
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

    return {user,org,role,router,routerpoint,pointer,tag,team,teamperson}
}

// 
