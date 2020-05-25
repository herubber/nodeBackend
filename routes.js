const Router = require('koa-router')

const addRouter = router => {
    const ctrPath = path.join(__dirname, 'controller');
    const modules = [];
    // 扫描controller文件夹，收集所有controller
    fs.readdirSync(ctrPath).forEach(name => {
        if (/^[^.]+\.(t|j)s$/.test(name)) {
            modules.push(require(path.join(ctrPath, name)).default)
        }
    });
    // 结合meta数据添加路由 和 验证
    modules.forEach(m => {
        const routerMap = Reflect.getMetadata(ROUTER_MAP, m, 'method') || [];
        if (routerMap.length) {
            const ctr = new m();
            routerMap.forEach(route => {
                const { name, method, path, isVerify } = route;
                router[method](path, verify(path, isVerify), ctr[name]);
            })
        }
    })
}

// export default addRouter
module.exports = addRouter
