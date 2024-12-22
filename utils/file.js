const fs = require("fs").promises;
const { logger } = require("./logger");

const TOKEN_FILE = "tokenz.json";

// 保存令牌的函数
async function saveToken(data) {
    try {
        let tokens = [];
        try {
            const fileData = await fs.readFile(TOKEN_FILE, 'utf8');
            tokens = JSON.parse(fileData);
        } catch (error) {
            logger("未找到之前的令牌文件。", "error");
        }

        const tokenExists = tokens.some(token => token.username === data.username);

        if (tokenExists) {
            logger(`用户 ${data.username} 的令牌已存在。`);
        } else {
            tokens.push(data);
            await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
            logger('令牌保存成功！', "success");
        }
    } catch (error) {
        logger('保存令牌时出错:', "error", error);
    }
}

// 读取所有保存令牌的函数
async function readToken() {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf8");
        return JSON.parse(data);
    } catch {
        logger("未找到令牌文件，请先登录。", "error");
        process.exit(1);
    }
}

// 加载代理列表的函数
async function loadProxies() {
    try {
        const data = await fs.readFile('proxy.txt', 'utf8');
        return data.split('\n').filter(proxy => proxy.trim() !== '');
    } catch (error) {
        logger('读取代理文件时出错:', "error", error);
        return [];
    }
}

module.exports = { saveToken, readToken, loadProxies };
