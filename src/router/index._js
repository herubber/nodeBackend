const Router = require("koa-router")
const fs = require("fs")
const path = require('path')





export function addRouter(router){
    
    // const ctrPath = path.join(__dirname, 'router')
    const ctrPath = __dirname
    const modules =[]
    
    // 扫描router
    fs.readdirSync(ctrPath).forEach(name => {
      if (/^[^.]+\.(t|j)s$/.test(name)) {
        if(name != path.basename(__filename)){
            modules.push(require(path.join(ctrPath, name)))
        }
      }
    });
    modules.forEach(m=>{
        if(m.requirePath){
            router.use(m.requirePath||'', m.router)
        }else{
            router.use(m.router)
        }
    })
}

