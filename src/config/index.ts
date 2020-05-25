// import { PoolConfig } from 'mysql';
import { PoolConfig } from "promise-mysql";


export const app = {
    port: 3000,
    socketPort: 3001,
    secret: 'lxlxlx',
    // exp: 240 * 60 * 1000,
    exp: '30m',
    refreshExp: 120 * 60 * 1000,
    proxyIpHeaderKey:'x-forwarded-for'
}


const instance = process.env.NODE_APP_INSTANCE;
if (instance) {
    app.socketPort += parseInt(instance, 10);
}

// mariadb://[<user>[:<password>]@]<host>[:<port>]/[<db>[?<opt1>=<value1>[&<optx>=<valuex>]]]
// export const mariadbPoolCfg = 'mariadb://root:123321@192.168.0.116:3306/ipatrol?ssl=false&bigNumberStrings=true&timezone=Asia/Shanghai'
export const mariadbPoolCfg = {
    acquireTimeout: 10000, //    Timeout to get a new connection from pool in ms.
    connectionLimit: 10,
    host: '192.168.0.116',
    user: 'root',
    port: 3306,
    compress: true,
    password: '123321',
    database: 'ipatrol',
    multipleStatements: true,
    permitSetMultiParamEntries: true,
    // ssl:false,
    bigNumberStrings: true,
    resetAfterUse: false,
    timezone: 'Asia/Shanghai',
}

export const mysqlPoolCfg: PoolConfig = {
    acquireTimeout:10000,
    connectionLimit: 10,
    host: "192.168.0.116",
    user: "root",
    port: 3306,
    password: "123321",
    database: "ipatrol",
    charset: 'utf8mb4',//utf8mb4才能保存emoji
    // socketPath: '/var/lib/mysql/mysql.sock',
    returnArgumentsArray:true,
    multipleStatements: true,// 可同时查询多条语句, 但不能参数化传值
    timezone:'+0800',
    supportBigNumbers:true,
    bigNumberStrings:true,
};



export const log4js = {
    appenders: {
        out: {
            type: 'stdout',
            layout: { type: 'basic' }
        },
        file: {
            type: 'file',
            filename: 'logs/system.log',
            maxLogSize: 10485760,
            backups: 3,
            compress: true,
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy/MM/dd:hh.mm.ss}] %p %c - %m%n'
            }
        }
    },
    categories: { default: { appenders: ['file'], level: 'info' } }
}
