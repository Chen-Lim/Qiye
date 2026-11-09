<p align="center">
  <img src="docs/assets/logo.png" width="64" height="64" alt="栖页 · 栖息小鸟" />
</p>

<h1 align="center">栖页 · TabNest</h1>

<p align="center">找回打开的网页，收好稍后想读的内容，回看时间花在哪里。</p>

栖页是一个 Chrome / Edge 新标签页扩展。点击浏览器的「＋」，把已打开标签、稍后阅读和浏览统计放在同一个工作台上。

Chromium Manifest V3 · Chrome / Edge 通用 · 本地存储 · 无需注册

**[下载插件 ZIP](https://github.com/Maxine0917/Qiye/releases/latest/download/TabNest-Chrome.zip)** · [四步安装](#从插件包安装) · [让 Agent 帮你安装](#让-agent-帮你安装)

![打开与跳转：浏览器已有许多标签，点击加号打开栖页，再点击标题切回原标签页](docs/assets/open-and-switch.gif)

## 快速安装

### 从插件包安装

1. [下载 TabNest-Chrome.zip](https://github.com/Maxine0917/Qiye/releases/latest/download/TabNest-Chrome.zip)，解压到长期保留的目录。
2. Chrome 输入 `chrome://extensions`，开启**开发者模式**；Edge 输入 `edge://extensions`，开启**开发人员模式**。
3. Chrome 点击**加载未打包的扩展程序**，Edge 点击**加载解压缩的扩展**，选择解压后直接包含 `manifest.json` 的文件夹。
4. 点击浏览器的「＋」，进入栖页；若提示新标签页被更改，选择**保持现状**。

部分 Chrome 版本将第 3 步按钮称为「加载已解压的扩展程序」。选择文件夹即可，不能直接选择 ZIP 或 `manifest.json` 文件。插件包内无需再寻找 `extension/`，安装目录请保留。**使用插件不需要 Node.js、Python 或服务器。**

<details>
<summary>看完整安装动图：下载 → 解压 → 加载 → 打开栖页</summary>

![完整安装：从 GitHub 下载插件包，在 macOS 解压并核对 manifest.json，在 Chrome 开启开发者模式、选择运行文件夹，点击原生加号打开栖页](docs/assets/install.gif)

录制使用 macOS、真实 v2.0.2 插件包和独立 Chrome 配置，添加了鼠标与步骤提示并做了剪辑。其他系统的解压和文件选择界面可能不同；Chrome 中的加载方式相同。

</details>

### 让 Agent 帮你安装

复制下面的指令，发给能联网并操作本机文件的 Agent：

```text
请帮我把 https://github.com/Maxine0917/Qiye 的栖页（TabNest）插件安装到本机 Chrome 或 Edge（以我使用的浏览器为准）：先阅读仓库 README 和 docs/INSTALL.md，再从 https://github.com/Maxine0917/Qiye/releases/latest/download/TabNest-Chrome.zip 下载最新版插件包，解压到长期保留的目录并保留包内 LICENSE（若已有安装，先确认原安装路径再处理），找到并核对 manifest.json，给出它所在文件夹的绝对路径；Chrome 引导我打开 chrome://extensions、开启开发者模式、点击“加载未打包的扩展程序”（部分版本叫“加载已解压的扩展程序”），Edge 引导我打开 edge://extensions、开启开发人员模式、点击“加载解压缩的扩展”，选择该文件夹，最后点击浏览器的“＋”确认栖页正常显示。
```

Agent 帮你准备安装文件，浏览器中的加载操作仍需你确认。后续更新沿用同一路径。

<details>
<summary>从源码安装与更新已有安装</summary>

从 [TabNest-Source.zip](https://github.com/Maxine0917/Qiye/releases/latest/download/TabNest-Source.zip) 安装，选择 `qiye/extension/`；从 **Code → Download ZIP** 安装，选择解压目录中的 `extension/`。它们都直接包含 `manifest.json`，根目录的 `LICENSE` 请与源码一起保留。

更新时，先核对扩展详情中的原加载目录，更新该目录的文件，再在扩展卡片上点击 **↻ 重新加载**，最后新建标签页。只刷新网页不会更新 Chrome 记录的名称和图标。换目录可能改变扩展身份，数据不会自动迁移。

</details>

详细目录示例、更新步骤与常见问题见[安装与更新](docs/INSTALL.md)；当前版本说明见 [Release](https://github.com/Maxine0917/Qiye/releases/latest)。

## 为什么做栖页

查资料时找不到开过的页面、想读的内容舍不得关、忙完说不清时间去了哪——这些日常困扰是栖页的开发起点。它把**正在打开、留到稍后、已经看过**的网页收在一起。

| 日常遇到的问题 | 栖页提供的处理方式 |
| --- | --- |
| 标签太多，找不到刚才那一页 | 按网站整理已打开标签，点击标题直接切回原页面 |
| 同一网页开了好几份，清理很费劲 | 关闭单页、关闭重复，或一次关闭当前网站分组 |
| 想读但现在没空，关掉又怕忘 | 放进「稍后查看」，读完勾选移入「已查看」 |
| 工作时容易顺手点去别的网站 | 开启专注计时，只允许访问事先列出的网站 |
| 不想一直计时，也想知道时间去了哪 | 按需暂停记录，查看今天、本周、本月、今年的浏览统计 |

## 看看它怎么工作

### 1. 点击「＋」打开，点击标题回到原网页

安装后，新建标签页就是栖页。已经打开的网页自动按网站排列，不需要逐个在标签栏里翻找。点击一个标题，会激活**已有的那个标签页**，支持跨窗口跳转。上方动图展示了这两个动作。

### 2. 看完就关掉，重复的和整组的也能一起清理

点击条目右侧的「×」关闭单页，页面会弹出小小的撒花效果。「关闭重复」经确认后，每组重复网址保留最早打开的一页；「关闭全部」经确认后，关闭**当前网站分组**里的所有标签页。

![关闭操作：关闭一个标签页并触发撒花，关闭重复网址，再关闭一个网站下的全部标签页](docs/assets/close-tabs.gif)

### 3. 没空读就留到稍后，看过的单独收好

点击书签，把网页加入「稍后查看」；读完勾选，移入可折叠的「已查看」。不用再让标签栏兼任待阅读清单，也能分清哪些还没读、哪些已经处理过。

![稍后查看：点击书签保存网页，勾选移入已查看，再展开阅读记录](docs/assets/save-and-viewed.gif)

保存网页不会关闭原标签页；打开保存的链接不会删除记录或自动标记已查看。两份清单都支持搜索，取消勾选可恢复待查看状态。保存状态跨刷新保留，在多个栖页之间同步；没有记录时，右侧分区自动隐藏。

### 4. 暂时不想计时，就暂停一会儿

点击「暂停记录」，选择暂停时长，栖页在这段时间内停止计时。再次点击即可提前恢复，到时也会自动恢复。**暂停的是栖页记录，Chrome 的浏览历史仍会保留。**

![暂停记录：选择暂停15分钟，看到暂停倒计时，再点击恢复记录](docs/assets/pause-recording.gif)

### 5. 给当前任务留一段不被打断的时间

先在**设置 → 允许访问的网站**中填写域名并保存；再点击**专注计时**，勾选**限制网站访问**，选择时长开始。列表中的网站可以正常访问，其他普通网页会进入专注提醒页。

![专注流程：保存允许网站，开启25分钟专注并限制网站访问，正常打开MDN，再验证其他网站被拦截](docs/assets/focus-allowlist.gif)

允许列表会保留，方便下次使用。只开启倒计时、未勾选限制时，不会拦截网站。提醒页支持返回、结束专注或仅在本次允许该域名，适合个人自我约束。

### 6. 回看今天、本周、本月、今年，知道时间花在哪

点击「统计」，切换四个时间范围，查看累计浏览时长和网站排行；今天的视图还提供 24 小时热力图。浏览历史支持导出 JSON / CSV，便于自己继续整理。

![浏览统计：依次展示今天、本周、本月、今年的累计时长与网站排行，数值为演示数据](docs/assets/browsing-stats.gif)

*六张功能动图取自实际扩展操作，使用独立浏览器中的示例网页和数据，添加了鼠标与步骤提示并做了剪辑。统计数值仅用于展示界面，不代表真实使用成果；录制日为周一，所以今天与本周累计相同。*

<details>
<summary>查看静态工作台与设置截图</summary>

![栖页工作台：按网站整理标签页，右侧展示稍后查看与已查看](docs/assets/workspace.png)

![栖页设置：浏览记录、主题、保留期限与专注允许网站](docs/assets/settings.png)

界面支持浅色、深色或跟随系统；可设置空闲检测、不计时域名和历史保留期限。

</details>

## 问题反馈与功能建议

遇到异常，请[提交问题反馈](https://github.com/Maxine0917/Qiye/issues/new?title=问题反馈：)，说明浏览器及版本、插件版本、复现步骤，以及预期和实际表现；截图请遮挡个人信息。

如果有希望改进的使用场景，欢迎[提出功能建议](https://github.com/Maxine0917/Qiye/issues/new?title=功能建议：)，描述你遇到的困扰、目前的处理方式，以及希望达到的效果。

## 隐私与数据

浏览记录、保存网页和设置存储在本机的 `chrome.storage.local` 中。Chrome / Edge 使用相同的存储 API，但各自维护独立的数据，切换浏览器不会自动同步。扩展没有账号系统，不向分析或遥测服务上传这些记录。

网页图标可能从原网站加载，点击链接也会访问对应网站；这些请求受网站自身的隐私政策约束。完整权限用途见[隐私说明](PRIVACY.md)。

目前支持浏览历史导出，尚不提供保存列表和设置的完整导入迁移工具。卸载前请保留需要的数据。

## 开发与验证

<details>
<summary>测试、打包、浏览器验收与项目结构</summary>

项目使用原生 HTML、CSS 和 JavaScript ES Modules，无构建步骤即可加载。以下命令在项目根目录运行；测试需要 Node.js 22 或更高版本，打包需要 Python 3。

```bash
# 回归测试
node extension/tests/nodeRunner.mjs

# 后台启动检查
node extension/tests/swSmoke.mjs

# 生成插件包与完整源码包
python3 scripts/package.py
```

打包后得到：

```text
dist/
├── 栖页-插件.zip   # 运行资源与许可证，可解压安装
└── qiye-源码.zip   # 源码、测试、文档与 GitHub Actions
```

浏览器验收需要另行安装 Playwright，并安装可用的 Chrome 或 Edge：

```bash
npm install --no-save --package-lock=false playwright@1.65.0
npx playwright install chrome msedge

# Chrome
node extension/tests/browser-ui.mjs

# Edge
QIYE_BROWSER_CHANNEL=msedge node extension/tests/browser-ui.mjs
```

验收使用独立临时浏览器配置，覆盖新标签页计数、关闭重复、保存、已查看、刷新保留、多页面同步、主题和窄屏布局，不使用日常浏览器配置。默认使用 Chrome；设置 `QIYE_BROWSER_CHANNEL=msedge` 可改用 Microsoft Edge。若 Playwright 位于其他位置，可用 `PLAYWRIGHT_MODULE` 指定模块入口；临时解压的浏览器可通过 `QIYE_BROWSER_EXECUTABLE` 指定可执行文件。截图和 `result.json` 默认保存到系统临时目录，可用 `QIYE_SCREENSHOT_DIR` 调整。Linux 环境可用 `npx playwright install --with-deps chrome msedge` 一并安装所需系统依赖。

每次 push 和 pull request，GitHub Actions 都会执行回归测试、后台启动检查、真实 Chrome / Edge 浏览器验收和打包。通过后可在该次运行的 Artifacts 中下载 `qiye-packages`；`qiye-browser-check` 保存验收截图与结果，保留 14 天。浏览器操作失败时会尽可能额外保存 `failure.png` 和诊断结果，方便定位问题。

### 项目结构

```text
qiye/
├── extension/         # Chrome / Edge 加载此目录
│   ├── background/    # 存储、计时、专注与同步
│   ├── shared/        # 常量、类型与消息协议
│   ├── ui/            # 界面与交互
│   ├── icons/         # 栖息小鸟 SVG 与 PNG 图标
│   └── tests/         # 回归测试与浏览器验收
├── docs/              # 安装、架构、设计决策与展示素材
├── scripts/           # 打包工具
├── .github/workflows/ # 自动检查
├── README.md
├── PRIVACY.md
└── LICENSE
```

[架构说明](docs/ARCHITECTURE.md) · [开发决策](docs/DECISIONS.md) · [更新记录](CHANGELOG.md) · [发布指南](docs/PUBLISH.md)

</details>

## 许可与致谢

项目在已有 MIT 许可代码基础上继续开发，感谢 Zara Zhang 的原有贡献。版权主体、年份、MIT 授权及免责条款保留于 [LICENSE](LICENSE)。
