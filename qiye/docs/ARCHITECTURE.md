# 栖页架构

## 1. 运行结构

`extension/index.html` 加载 `ui/main.js`。页面与后台通过 `runtime.sendMessage` 请求数据，通过名为 `qiye-ui` 的 runtime Port 接收广播。后台入口是 `background/sw.js`，启动后初始化标签注册表、计时、存储、空闲检测、专注及提醒服务。

## 2. 主要模块

| 模块 | 职责 |
|---|---|
| `ui/views/tabsGrid.js` | 按网站增量渲染当前标签，刷新时长及保存标识 |
| `ui/views/sidebar.js` | 待查看与已查看、搜索、排序、折叠和显隐 |
| `background/savedStore.js` | URL 规范化去重、串行保存/删除/查看状态更新 |
| `background/featureHub.js` | 功能请求分发与状态广播 |
| `background/timeTracker.js` | 唯一浏览时间账本 |
| `background/focusTimer.js` | 专注计时及恢复 |
| `background/focusGuard.js` | 允许网站及阻止页控制 |
| `background/historyService.js` | 历史导出、保留期限和清空 |
| `shared/messages.js` | 请求与广播协议的权威定义 |

## 3. 保存记录

`chrome.storage.local.saved` 存储条目数组：`id`、`url`、`title`、`favIconUrl`、`savedAt`、`viewed`。缺失 `viewed` 的旧记录按未查看处理。

保存按规范化 URL 去重；查看状态不影响保存标识。所有修改共用串行队列，存储成功后再修改内存，失败不得显示成功。

勾选设置 `viewed=true`，取消勾选恢复为待查看。打开链接保留记录。两类记录均为空时，侧栏清空、隐藏且不占宽度。

## 4. 计时与恢复

计时模块以时间片记录访问。暂停原因可以叠加，包含窗口失焦、空闲、暂停记录、不计时网站等。`qiye-tick` 周期闹钟驱动时间结算；专注和暂停记录分别使用 `qiye-focus-timer-end`、`qiye-private-mode-end`。

后台支持从本地快照恢复；页面 Port 重连后重新取状态快照，再重放重连期间的广播。

## 5. 消息协议

| 请求 | 输入 | 返回 |
|---|---|---|
| `REQ_GET_STATE` | 无 | 跟踪、专注、暂停记录、配置 |
| `REQ_GET_TABS` | 无 | `{tabs}` |
| `REQ_GET_SAVED` | 无 | `{saved}` |
| `REQ_SAVE_FOR_LATER` | `{tabId}` | `{entry, created}` |
| `REQ_REMOVE_SAVED` | `{id}` | `{removed, id}` |
| `REQ_SET_SAVED_VIEWED` | `{id, viewed:boolean}` | `{entry}` |

请求统一返回 `{ok:true,data}` 或 `{ok:false,error}`。保存变更通过 `BCAST_SAVED_CHANGE {saved}` 同步到各页面。页面收到等价快照时不重建列表，避免打断正在进行的点击。完整协议见 `extension/shared/messages.js`。

## 6. 界面与打包

展示名称为「栖页」，技术标识为 `qiye`；样式由 `style.css` 的浅色/深色主题变量控制。原网站图标不可用时使用通用网页图标。

主页面统一按网站分组，设置不显示分类和自定义分组入口，存储仍兼容已有配置。

打包仅包含扩展运行资源及许可证，不包含测试、本地配置、缓存及用户数据。
