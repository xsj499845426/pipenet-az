const fetch = require("node-fetch");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { readToken, loadProxies } = require("../utils/file");
const { logger } = require("../utils/logger");
const fs = require("fs").promises;

const API_BASE = "https://pipe-network-backend.pipecanary.workers.dev/api";

// 获取积分的函数
async function fetchPoints(token, username, agent) {
    try {
        const response = await fetch(`${API_BASE}/points`, {
            headers: { Authorization: `Bearer ${token}` },
            agent,
        });

        if (response.ok) {
            const data = await response.json();
            logger(`用户 ${username} 的当前积分为: ${data.points}`, "info");
        } else {
            logger(`无法获取用户 ${username} 的积分，状态码: ${response.status}`, "error");
        }
    } catch (error) {
        logger(`获取用户 ${username} 的积分时出错: ${error.message}`, "error");
    }
}

// 发送心跳的函数
async function sendHeartbeat() {
    const proxies = await loadProxies();
    if (proxies.length === 0) {
        logger("未找到可用代理，请检查 proxy.txt 文件。", "error");
        return;
    }

    const tokens = await readToken();

    for (let i = 0; i < tokens.length; i++) {
        const { token, username } = tokens[i];
        const proxy = proxies[i % proxies.length];
        const agent = new HttpsProxyAgent(proxy);

        try {
            const ip = await fetchIpAddress(agent);
            const geo = await fetchGeoLocation(ip, agent);

            const response = await fetch(`${API_BASE}/heartbeat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, ip, geo }),
                agent,
            });

            if (response.ok) {
                logger(`心跳发送成功，用户: ${username}, 使用代理: ${proxy}`, "success");
                await fetchPoints(token, username, agent);
            } else {
                logger(`无法发送心跳，用户: ${username}, 错误: ${await response.text()}`, "error");
            }
        } catch (error) {
            logger(`发送心跳时出错，用户: ${username}, 错误: ${error.message}`, "error");
        }
    }
}

// 获取IP地址的函数
async function fetchIpAddress(agent) {
    try {
        const response = await fetch("https://api64.ipify.org?format=json", { agent });
        const { ip } = await response.json();
        return ip;
    } catch (error) {
        logger("获取IP地址时出错:", "error", error);
        throw error;
    }
}

// 获取地理位置信息的函数
async function fetchGeoLocation(ip, agent) {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`, { agent });
        if (response.ok) {
            return await response.json();
        }
        logger("获取地理位置信息失败，可能返回了无效的响应。", "error");
        return null;
    } catch (error) {
        logger("获取地理位置信息时出错:", "error", error);
        return null;
    }
}

module.exports = { sendHeartbeat };
