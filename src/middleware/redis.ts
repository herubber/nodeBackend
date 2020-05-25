

import { redis } from "@src/common/redis";

import { app } from "@src/config";

import { addLog } from "@src/dao/syslog";
import { Context, Next } from "koa";
// import { syslog } from "@src/dao/models/table/syslog";

const redisMid = () => async (ctx:Context, next:Next) => {



};

export default redisMid

