# Pipe Network Bot

一个自动化工具，用于注册、登录、测试节点延迟以及管理 Pipe Network 的账户信息。

---

## 功能介绍

1. **注册功能**
   - 自动化注册新用户，并将用户信息保存到 `account.json` 文件中。
   - 支持使用代理以防止 IP 限制。

2. **登录功能**
   - 使用存储在 `account.json` 中的账户信息自动登录。
   - 支持多账户批量登录。

3. **节点测试**
   - 自动测试节点的延迟。
   - 结果上传至后台。

4. **心跳功能**
   - 定时发送心跳包，保持账户活跃。

---

## 环境依赖

在运行代码之前，请确保您的系统已安装以下依赖项：

1. **Node.js**（建议使用最新的 LTS 版本）
2. **npm** 或 **yarn**

### 依赖的 NPM 包

- `node-fetch`
- `https-proxy-agent`
- `readline-sync`


## 安装与使用教程
克隆代码仓库
```
git clone https://github.com/ziqing888/pipenetwork-bot.git
cd pipenetwork-bot
```
可以通过以下命令安装依赖：

```bash
npm install
```
配置文件
proxy.txt

在根目录下创建一个名为 proxy.txt 的文件。
文件格式：每行一个代理，例如：
```
http://username:password@proxy1:port
http://username:password@proxy2:port
```
account.json

系统会自动生成，存储注册或登录成功的用户信息。
运行脚本

```
npm run start
```
按照终端中的说明完成设置。

-选择 1 以注册新帐户。

-您需要在注册帐户后登录以获取访问令牌。

-选择 2 以登录帐户。

-最后选择 3  运行机器人
## 注意事项
确保 proxy.txt 中的代理可用。
请勿多次频繁操作，可能导致账户被限制。

