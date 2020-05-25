import Router from "koa-router";
import fs from "fs";
import path from 'path'





export function addRouter(router: Router) {


  const ctrPath = __dirname
  const modules: Array<{ requirePath?: string, router: Router }> = [];
  // 扫描controller文件夹，收集所有controller
  fs.readdirSync(ctrPath).forEach(name => {
    if (/^[^.]+\.(t|j)s$/.test(name)) {
      if (name != path.basename(__filename)) {
        modules.push(require(path.join(ctrPath, name)))
      }
    }
  });
  modules.forEach(m => {
      // router.use(m.router.routes(), m.router.allowedMethods())
      router.use(m.router.routes())
    
  })
}

