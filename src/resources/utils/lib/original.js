'use strict';

class original {

    static getInstance() {
        if (!original.instance) original.instance = new original();
        return original.instance;
    }

    constructor() {
        this.config = require('../../cfg/config.json');
        this.logger = require('./logger');
        this.crypto = require('./crypto');
        this.db = {};
        for (let i in this.config.db) {
            this.db[i] = require(`./db/${this.config.db[i].type}`);
            this.db[i].connect(this.config.db[i].data);
        }
    }

    trim(str) {
        if (!str) return null;
        str = str.toString();
        let obj = str.replace(/^\s*|\s*$/g, "");
        return obj === '' ? null : /^[0-9]+.?[0-9]*$/.test(obj) ? Number(obj) : obj;
    }

    isNull(arg) {
        if (typeof arg === 'string') arg = this.trim(arg);
        return !arg && arg !== 0 && typeof arg !== "boolean" ? true : false;
    }

    isNullAll(than, obj) {
        obj = obj || [];
        for (let i of obj) if (this.isNull(than[i])) return true;
        return false;
    }

    getAll(obj) {
        obj = obj || [];
        let data = {};
        for (let i of obj) if (this[i]) data[i] = this[i];
        return data;
    }

    success(msg, data) {
        let req = {
            msg: 'success',
            code: 0,
            time: new Date().getTime()
        }
        if (typeof msg === 'string') req.msg = msg;
        if (typeof msg === 'object') req.data = msg;
        if (typeof data === 'object') req.data = data;
        return req;
    }

    error(msg, data) {
        let req = {
            msg: 'error',
            code: -1,
            time: new Date().getTime()
        }
        if (typeof msg === 'string') req.msg = msg;
        if (typeof msg === 'object') req.data = msg;
        if (typeof data === 'object') req.data = data;
        return req;
    }

    async _add(table, data) {
        return await this.db.main.query('insert into ' + table + ' set ?', [data]);
    }

    async _get(table, id) {
        if (id) return await this.db.main.single('select * from ' + table + ' where id = ?', [id]);
        else return await this.db.main.first('select * from ' + table);
    }

    async _upd(table, data, id) {
        return await this.db.main.query('update ' + table + ' set ? where id = ?', [data, id])
    }

    async _del(table, id) {
        return await this.db.main.query('delete from ' + table + ' where id = ?', [id]);
    }
}

module.exports = original.getInstance();