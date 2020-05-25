import koaRouter from "koa-router"
import { DefaultState, Context } from 'koa';
import {jwtVerify, scodeVerify} from "../middleware/verify";
import crypto from 'crypto'

// 如果需要前置
// export const router = new koaRouter({
//     prefix:'/user'
// })

//generate salt , now we can use uuid/v5 generate unicode
const makeSalt = () => Math.round((new Date().valueOf() * Math.random())) + '';

const encryptPass = (pass: string, salt: string) => crypto.createHash('md5').update(pass + salt).digest('hex');// generate md5

export const router = new koaRouter<DefaultState, Context>()

// router.get('/login', async (ctx:Context)=>{
//     let { email, password } = ctx.request.body;
//     password = '123'
//     const users = [{id:'3214132', 
//       email:'herubber@hotmail.com', 
//       salt:'asdf', 
//       hash_password:'d2ae116a900074e870211de308362c4d'
//     }]
//     // const users = await dao.getUser({ email });
//     if (!users.length) {
//       return ctx.body = {
//         code: 2,
//         msg: '用户不存在'
//       };
//     }
//     if (users[0].hash_password !== encryptPass(password, users[0].salt)) {
//       return ctx.body = {
//         code: 3,
//         msg: '密码错误'
//       };
//     }
//     ctx.jwtSign({ id: users[0].id, code: users[0].email, cnName:'' });
//     return ctx.body = {
//       code: 0,
//       msg: '登录成功',
//       data: users[0]
//     };
// })

router.get('/testVerify', jwtVerify(), async (ctx:Context)=>{
  let { email, password } = ctx.request.body;
  password = '123'
  const users = [{id:3214132, 
    email:'herubber@hotmail.com', 
    salt:'asdf', 
    hash_password:'d2ae116a900074e870211de308362c4d'
  }]
  // const users = await dao.getUser({ email });
  if (!users.length) {
    return ctx.body = {
      code: 2,
      msg: '用户不存在'
    };
  }
  if (users[0].hash_password !== encryptPass(password, users[0].salt)) {
    return ctx.body = {
      code: 3,
      msg: '密码错误'
    };
  }
  // await ctx.jwtSign({ uid: users[0].id.toString(), name: email });
  return ctx.body = {
    code: 0,
    msg: '登录成功',
    data: users[0]
  };


})
