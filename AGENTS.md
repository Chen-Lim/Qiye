# 栖页开发约定

- 产品展示名称为「栖页」，代码及仓库标识使用 `qiye`。
- 扩展是纯 HTML、CSS、JavaScript ES Modules，Chromium Manifest V3（Chrome / Edge），无需构建即可加载。
- 正式源码在 `extension/`；启动入口为 `extension/index.html` 和 `extension/background/sw.js`。
- 修改消息协议时同时更新 `shared/messages.js` 及架构说明。
- 保存与查看状态只通过后台存储服务修改；持久化成功后再更新内存并广播。
- 主页面无保存及已查看记录时隐藏整个侧栏；打开保存链接不会删除记录。
- 适当运行 `node extension/tests/nodeRunner.mjs`、`node extension/tests/swSmoke.mjs`。
- `python3 scripts/package.py` 生成插件包和源码包；插件包不包含测试，两个包均排除本地配置、缓存和 Git 元数据。
- 保留 LICENSE 中的版权主体、年份和 MIT 条款。
- 用户数据不属于仓库。不要读取、提交或操作用户日常 Chrome 配置。
- 只在用户要求时提交或上传，禁止改写远端历史。
