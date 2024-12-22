const fetch = require("node-fetch");
const { readToken, loadProxies } = require("../utils/file");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { logger } = require("../utils/logger");
const fs = require("fs").promises;

const API_BASE = "https://pipe-network-backend.pipecanary.workers.dev/api";

// 运行节点测试的主函数
async function runNodeTests() {
    const proxies = await loadProxies();
    if (proxies.length === 0) {
        logger("未找到可用代理，请检查 proxy.txt 文件。", "error");
        return;
    }

    try {
        const initialAgent = new HttpsProxyAgent(proxies[0 % proxies.length]);
        const response = await fetch(`${API_BASE}/nodes`, { agent: initialAgent });
        const nodes = await response.json();

        const tokens = await readToken();

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const proxy = proxies[i % proxies.length];
            const agent = new HttpsProxyAgent(proxy);

            logger(`正在测试节点 ${node.node_id}，使用代理: ${proxy}`);
            const latency = await testNodeLatency(node, agent);

            logger(`节点 ${node.node_id} (${node.ip}) 延迟: ${latency}ms`);

            for (const { token, username } of tokens) {
                await reportTestResult(node, latency, token, agent, username);
            }
        }

        logger("所有节点测试完成！结果已发送至后台。", "success");
    } catch (error) {
        logger("运行节点测试时出错：", "error", error);
    }
}

// 使用代理测试节点延迟的函数
async function testNodeLatency(node, agent) {
    const start = Date.now();
    const timeout = 5000;

    try {
        await Promise.race([
            fetch(`http://${node.ip}`, { mode: "no-cors", agent }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("超时")), timeout)),
        ]);

        return Date.now() - start;
    } catch (error) {
        return -1; // 超时或其他错误
    }
}

// 使用代理向后台报告测试结果的函数
async function reportTestResult(node, latency, token, agent, username) {
    if (!token) {
        logger("未找到令牌，跳过结果报告。", "warn");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/test`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                node_id: node.node_id,
                ip: node.ip,
                latency: latency,
                status: latency > 0 ? "在线" : "离线",
            }),
            agent,
        });

        if (response.ok) {
            logger(`节点 ID ${node.node_id} 的测试结果已报告，用户: ${username}`, "success");
        } else {
            logger(`报告节点 ${node.node_id} 的测试结果失败，用户: ${username}：`, "error", await response.text());
        }
    } catch (error) {
        logger(`报告节点 ${node.node_id} 的测试结果时出错，用户: ${username}：`, "error", error.message);
    }
}

module.exports = { runNodeTests };
