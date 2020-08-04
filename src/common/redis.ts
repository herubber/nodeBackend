

import Redis from "ioredis";
// const redis = new Redis(); // uses defaults unless given configuration object
// Connect to 127.0.0.1:6380, db 4, using password "authpassword":
// new Redis("redis://:authpassword@127.0.0.1:6380/4");

export const redis = new Redis({
    port: 6379, // Redis port
    host: "192.168.0.132", // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    // password: "auth",
    db: 0,
});


