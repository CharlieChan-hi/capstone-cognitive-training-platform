# 为什么本地运行这么麻烦？— 写给纯小白的解释和教程

## 一、为什么 Manus 部署后点个链接就能用？

想象一下开餐厅：

| 你看到的 | 背后其实有 |
|---------|-----------|
| 一个网址，点开就能用 | 一台24小时运行的服务器电脑 |
| 页面秒开 | 已经装好了 Node.js、MySQL、所有依赖包 |
| 数据能保存 | 数据库已经建好表、配好账号密码 |

**Manus 帮你做的事情**：把"开餐厅"的所有脏活累活（租房子、装修、买厨具、接水电）全帮你干了，你只看到一个漂亮的门面。

## 二、为什么本地要装这么多东西？

你的项目有3个部分，缺一不可：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端页面    │ ──→ │  后端服务器   │ ──→ │  MySQL数据库  │
│  (React)     │     │  (Node.js)   │     │  (存数据)     │
└─────────────┘     └─────────────┘     └─────────────┘
   你看到的网页        处理请求逻辑         保存训练记录
```

- **Node.js** = 让你的电脑能运行 JavaScript 后端代码（就像装了一个"引擎"）
- **npm** = Node.js 的"应用商店"，用来下载项目需要的几百个小工具包
- **MySQL** = 数据库，存用户信息、训练记录、成绩数据
- **npm install** = 把项目依赖的几百个包一次性下载到本地

**一句话总结**：Manus 上这些东西早就装好了，本地你得自己装一遍。

## 三、一步步教你在本地跑起来

### 前提：你的 Mac 需要装好这些

#### 第1步：安装 Homebrew（Mac 的软件管理器）

打开「终端」app（在启动台 → 其他 → 终端），粘贴：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

等它装完，可能要几分钟。

#### 第2步：安装 Node.js

```bash
brew install node
```

装完验证：
```bash
node --version   # 应该显示 v18 或 v20 之类的
npm --version    # 应该显示 9 或 10 之类的
```

#### 第3步：安装 MySQL

```bash
brew install mysql
brew services start mysql   # 启动 MySQL 服务
```

设置 MySQL 密码（第一次用默认没密码）：
```bash
mysql_secure_installation
```

它会问你一系列问题：
- 设置 root 密码 → 输一个你记得住的密码，比如 `123456`
- 其他问题一路按 Y (Yes) 就行

#### 第4步：创建数据库

```bash
mysql -u root -p
```

输入你刚设的密码，进入 MySQL 后输入：

```sql
CREATE DATABASE focuslab;
exit;
```

#### 第5步：配置项目环境变量

进入项目目录。当前这份指南默认对应的项目位置是 `/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main`；如果你的本机项目不在这里，请把下面命令里的路径替换成你自己的实际路径：
```bash
cd "/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main"
```

看看有没有 `.env` 文件：
```bash
ls -la .env*
```

如果没有，创建一个：
```bash
nano .env
```

写入以下内容（密码换成你自己设的）：
```
DATABASE_URL=mysql://root:<your-local-password>@localhost:3306/focuslab
SESSION_SECRET=any-random-string-here-abc123
```

按 `Ctrl+X`，然后按 `Y`，然后按回车保存。

#### 第6步：安装项目依赖

```bash
npm install
```

这一步会下载几百个包，需要几分钟，耐心等。

#### 第7步：初始化数据库表

```bash
npm run db:push
```

这会根据代码里的 schema 自动在 MySQL 里建好所有表。

#### 第8步：启动项目！

```bash
npm run dev
```

看到类似这样的输出就成功了：
```
  ➜  Local:   http://localhost:3000/
```

打开浏览器访问 **http://localhost:3000** 就能看到你的项目了！

## 四、以后每次要用的时候

只需要两步：

```bash
# 1. 确保 MySQL 在运行
brew services start mysql

# 2. 启动项目
cd "/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main"
npm run dev
```

然后打开浏览器访问 http://localhost:3000

## 五、常见问题

| 问题 | 解决办法 |
|------|---------|
| `npm install` 报错 | 试试 `sudo npm install`，或删掉 `node_modules` 文件夹重新装 |
| MySQL 连不上 | 运行 `brew services restart mysql` |
| 端口被占用 | 关掉其他在用 3000 端口的程序，或改 `.env` 里的端口 |
| 页面打开白屏 | 看终端有没有报错，通常是数据库没连上 |
| `db:push` 失败 | 检查 `.env` 里的 DATABASE_URL 密码对不对 |

## 六、关机后要重新来吗？

- **Node.js、npm、MySQL** → 装一次就永久有了，不用重装
- **npm install** → 只要没删 `node_modules` 文件夹就不用重新装
- **MySQL 服务** → 关机后需要重新启动（`brew services start mysql`）
- **项目** → 每次要用都得 `npm run dev` 启动

---

*最后的最后：这些步骤看着多，但其实只是第一次麻烦。装好之后每次就两行命令的事。Manus 之所以简单，是因为有人替你把这些步骤提前做好了，部署在了云服务器上。*
