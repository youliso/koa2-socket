import * as http from 'http';
import {join} from 'path';
import * as Koa from 'koa';
import * as Static from 'koa-static';
import * as BodyParser from 'koa-bodyparser';
import * as Cors from 'koa2-cors';
import {Server as socketServer} from "socket.io";
import {tokenUse} from './lib/token';
import Logger from './lib/logger';
import {Sockets} from './lib/socket';
import Timer from './lib/timer';
import Router from './router';

const Config = require('./config/config.json');
const koa = new Koa();

class App {
    constructor() {
    }

    async init() {
        //onerror
        koa.on('error', err => Logger.error(err));
        //init
        koa.use(async (ctx, next) => {
            if (ctx.request.path === "/favicon.ico") return;
            await next();
            if (ctx.request.path === "/") ctx.body = "Copyright (c) 2020 youliso";
            Logger.access(`${ctx.originalUrl} ${ctx.header["x-real-ip"] || "-"} ${ctx.header["user-agent"]}`);
        });
        //origin
        let origin = null;
        koa.use(Cors({
            origin: (ctx: Koa.ParameterizedContext) => {
                let i = Config.domainWhiteList.indexOf(ctx.header.origin);//域名白名单
                origin = Config.domainWhiteList[i];
                return Config.domainWhiteList[i];
            },
            ...Config.cors
        }));
        //bodyParser
        koa.use(BodyParser());
        //token
        koa.use(tokenUse);
        //static
        koa.use(Static(join(__dirname, '../resources/static')));
        koa.use(await Router.http())
        const server = http.createServer(koa.callback());
        const io = new socketServer(server, {
            cors: {
                origin,
                ...Config.cors
            } as any,
            path: Config.socketPath,
            serveClient: false,
            pingInterval: 10000,
            pingTimeout: 5000,
            cookie: false
        });
        //socket模块初始化
        Sockets.init(io, await Router.socket());
        //定时器模块开启
        await Timer.start();
        //绑定端口
        server.listen(Config.port, () => {
            console.log(`[success] ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
            console.log(`[port] http://127.0.0.1:${Config.port}`);
        });
    }
}

new App().init().catch(e => Logger.error(e));
