const fetch = require("node-fetch");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { logger } = require("../utils/logger");
const { loadProxies } = require("../utils/file");

const API_URL = "https://pipe-network-backend.pipecanary.workers.dev/api/signup";
const ACCOUNT_FILE = "account.json";

// 使用指定代理注册新用户的函数
async function registerUser(email, password, proxy) {
    try {
        const agent = new HttpsProxyAgent(proxy);
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
                referralCode: "NDQ4NzMwMT",
            }),
            agent,
        });

        if (response.ok) {
            const data = await response.text();
            if (data) {
                // 将用户添加到 account.json
                await addUserToFile(email, password);
                logger("注册成功！", "success", data);
            } else {
                logger("注册失败，请重试。", "error");
            }
        } else {
            const errorText = await response.text();
            logger("注册时发生错误：", "error", errorText);
        }
    } catch (error) {
        logger("注册用户时出错：", "error", error.message);
    }
}

// 提示用户输入电子邮件和密码的函数
function promptUserForCredentials() {
    const email = readlineSync.question("请输入您的邮箱：");
    const password = readlineSync.question("请输入您的密码：", {
        hideEchoBack: true, // 隐藏输入的密码
    });
    return { email, password };
}

// 将新用户添加到 account.json 的函数
async function addUserToFile(email, password) {
    try {
        let fileData = await fs.promises.readFile(ACCOUNT_FILE, "utf8");
        let users = fileData ? JSON.parse(fileData) : [];
        users.push({ email, password });

        await fs.promises.writeFile(ACCOUNT_FILE, JSON.stringify(users, null, 2));
        logger("用户已成功添加到文件中！");
    } catch (error) {
        logger("将用户添加到文件时出错：", "error", error.message);
    }
}

// 主注册执行函数
async function register() {
    const { email, password } = promptUserForCredentials();

    const proxies = await loadProxies();
    if (proxies.length === 0) {
        logger("未找到可用代理，请检查 proxy.txt 文件。", "error");
        return;
    }

    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
    logger(`使用代理：${randomProxy}`);

    await registerUser(email, password, randomProxy);
}

module.exports = { promptUserForCredentials, register };
