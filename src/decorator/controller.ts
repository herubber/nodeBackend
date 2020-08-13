import 'reflect-metadata'
import { ROUTER_MAP, MIDDLEWARE_MAP } from '../constant'

/**
 * @desc 生成 http method 装饰器
 * @param {string} method - http method，如 get、post、head
 * @return Decorator - 装饰器
 */
function createMethodDecorator(method: string) {
  // 装饰器接收路由 path 作为参数
  return function httpMethodDecorator(path: string, isVerify?: boolean) {
    return (proto: any, name: string, descriptor) => {
      const target = proto.constructor;
      const routeMap = Reflect.getMetadata(ROUTER_MAP, target, 'method') || [];
      routeMap.push({ name, method, path, isVerify: !!isVerify });
      Reflect.defineMetadata(ROUTER_MAP, routeMap, target, 'method');
    };
  };
}


// 装饰器接收路由 path 作为参数
export function addMidWare(middleName:string, opt?:{/**order小排前面*/order?:number, args?:any[]}) {
  return (proto: any, name: string, descriptor) => {
    const target = proto.constructor;
    const routeMap = Reflect.getMetadata(MIDDLEWARE_MAP, target, 'method') || [];
    opt = opt || {order:0}
    if(!opt.order){
      opt.order=0
    }
    routeMap.push({ name, middleName, opt});
    Reflect.defineMetadata(MIDDLEWARE_MAP, routeMap, target, 'method');
  };
};


export function routerMap(path?:string, opt?:{/**order小排前面*/order?:number, args?:any[]}) {
  return (target: any) => {
    if(!path){
      path = '/'+target.name
    }
    // const target = proto;
    const routeMap = Reflect.getMetadata(ROUTER_MAP, target, 'class') || [];
    opt = opt || {order:0}
    if(!opt.order){
      opt.order=0
    }
    routeMap.push({ path, opt});
    Reflect.defineMetadata(ROUTER_MAP, routeMap, target, 'class');
  };
};




// 导出 http method 装饰器
export const post = createMethodDecorator('post');

export const get = createMethodDecorator('get');

export const del = createMethodDecorator('del');

export const put = createMethodDecorator('put');

export const patch = createMethodDecorator('patch');

export const options = createMethodDecorator('options');

export const head = createMethodDecorator('head');

export const all = createMethodDecorator('all');
