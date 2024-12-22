const { loginWithAllAccounts } = require("./services/login");
const { register } = require("./services/register");
const { sendHeartbeat } = require("./services/heartbeat");
const { runNodeTests } = require("./services/nodes");
const { askQuestion } = require("./utils/userInput");
const { banner } = require("./utils/banner");
const { logger } = require("./utils/logger");

(async () => {
    logger(banner, "debug")
    const choice = await askQuestion(
        "请选择一个选项：\n1. 注册\n2. 登录\n3. 运行节点\n> "
    );

    switch (choice) {
        case "1":
            logger(`正在注册新账户...`);
            await register();
            break;
        case "2":
            logger(`正在从 accounts.json 获取账户并登录...`);
            await loginWithAllAccounts();
            break;
        case "3":
            logger(`正在使用代理运行所有账户...`);
            await sendHeartbeat();
            setInterval(sendHeartbeat, 5 * 60 * 1000); // 每5分钟发送一次心跳
            await runNodeTests();
            setInterval(runNodeTests, 30 * 60 * 1000); // 每30分钟运行一次节点测试
            logger("心跳将在每5分钟发送一次，节点结果将在每30分钟发送一次", "debug");
            logger("请勿更改此设置，否则您的账户可能会被封禁。", "debug");
            break;
        default:
            logger("无效的选项，程序退出。", "error");
    }
})();
