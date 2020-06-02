import 'reflect-metadata'
import fs from 'fs'
import path from 'path'
import {all, jwtVerify} from './middleware'
import { ROUTER_MAP, MIDDLEWARE_MAP } from './constant'
import { RouteMeta } from './type'
// import Router from 'koa-router'

import koaRouter from "koa-router"
import { DefaultState, Context } from 'koa';

export const addControllerRouter = (router: koaRouter) => {
  const ctrPath = path.join(__dirname, 'controller');
  const modules: ObjectConstructor[] = [];
  // 扫描controller文件夹，收集所有controller
  fs.readdirSync(ctrPath).forEach(name => {
    if (/^[^.]+\.(t|j)s$/.test(name)) {
      modules.push(require(path.join(ctrPath, name)).default)
    }
  });
  // 结合meta数据添加路由 和 验证
  modules.forEach(m => {
    const routerMap: RouteMeta[] = Reflect.getMetadata(ROUTER_MAP, m, 'method') || [];
    const addMidWareMap:[{name:string, middleName:string, opt:{order:number, args?:any[]}}] = Reflect.getMetadata(MIDDLEWARE_MAP, m, 'method') || [];
    const prefixMap: any[] = Reflect.getMetadata(ROUTER_MAP, m, 'class') || [];

    // console.log(prefixMap);


    if (routerMap.length) {
      // 子路由,存在prefixMap就添加子路由
      let subrouter
      if(prefixMap.length){
        let prefix = prefixMap.sort((m,n)=> m.opt.order - n.opt.order).map(p=>p.path).join('')
        subrouter = new koaRouter({
            prefix
        })
      }

      const ctr = new m();
      routerMap.forEach(route => {
        const { name, method, path, isVerify } = route;
        const mids = addMidWareMap
          .filter(m=>m.name==name)
          .sort((m,n)=> m.opt.order - n.opt.order)
          .map(m=>{
            if(m.opt.args){
              return all[m.middleName](...m.opt.args)
            }else{
              return all[m.middleName]()
            }
          })

        if(subrouter){

          if(isVerify){
            subrouter[method](path, jwtVerify(isVerify), ...mids, ctr[name]);
          }else{
            subrouter[method](path, ...mids, ctr[name]);
          }
          
        }else{
          if(isVerify){
            router[method](path, jwtVerify(isVerify), ...mids, ctr[name]);
          }else{
            router[method](path, ...mids, ctr[name]);
          }
        }

      }) // forEach
      if(subrouter){
        router.use(subrouter.routes())
      }

    }
  })
}

