import 'reflect-metadata'
import { JWT_MAP } from '../constant'


export function jwt() {
  return (proto: any, name: string) => {
    const target = proto.constructor;
    const jwtMap = Reflect.getMetadata(JWT_MAP, target, 'method') || [];
    jwtMap.push({ name });
    Reflect.defineMetadata(JWT_MAP, jwtMap, target, 'method');
  };
}


