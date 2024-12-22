const fetch = require("node-fetch");
const { saveToken, loadProxies } = require("../utils/file");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { logger } = require("../utils/logger");
const fs = require("fs");

const API_BASE = "https://pipe-network-backend.pipecanary.workers.dev/api";
const ACCOUNT_FILE = "account.json";

// 从 account.json 文件读取所有用户的函数
async function readUsersFromFile() {
    try {
        const fileData = await fs.promises.readFile(ACCOUNT_FILE, "utf8");
        return JSON.parse(fileData);
    } catch (error) {
        logger("从文件中读取用户信息时出错：", "error", error);
        return [];
    }
}

// 使用单个账户登录的函数
async function login(email, password, proxy) {
    const agent = new HttpsProxyAgent(proxy);
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            agent,
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                await saveToken({ token: data.token, username: email });
                logger(`用户 ${email} 登录成功！`, "success");
            } else {
                logger(`用户 ${email} 登录失败！未返回令牌。`, "error");
            }
        } else if (response.status === 401) {
            logger(`用户 ${email} 的凭据无效，请检查邮箱和密码。`, "error");
        } else {
            const errorText = await response.text();
            logger(`用户 ${email} 登录时出错：${errorText}`, "error");
        }
    } catch (error) {
        logger(`使用 ${email} 登录时出错：`, "error", error.message);
    }
}

// 使用所有账户批量登录的函数
async function loginWithAllAccounts() {
    const proxies = await loadProxies();
    if (proxies.length === 0) {
        logger("未找到可用代理，请检查 proxy.txt 文件。", "error");
        return;
    }

    const accounts = await readUsersFromFile();
    if (accounts.length === 0) {
        logger("未在 account.json 文件中找到账户信息。", "error");
        return;
    }

    for (let i = 0; i < accounts.length; i++) {
        const { email, password } = accounts[i];
        const proxy = proxies[i % proxies.length];
        logger(`尝试使用 ${email} 登录...`);
        await login(email, password, proxy);
    }
}

module.exports = { loginWithAllAccounts };
