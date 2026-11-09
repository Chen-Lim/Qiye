# 上传与发布栖页

## 应上传什么

上传 `qiye` 文件夹内部的项目内容。仓库首页应能直接看到 `README.md`、`LICENSE` 和 `extension/`，不要再套一层 `qiye/qiye/`。

源码包括扩展、测试、项目文档、展示素材、打包脚本和 `.github/workflows/check.yml`。本地安装兼容入口位于项目之外，不属于仓库。

不要上传 `.git/`、`dist/`、`node_modules/`、日志、缓存、个人浏览数据或本地配置；项目的 `.gitignore` 已包含这些排除规则。

## 用 GitHub 网页上传

1. 在自己的 GitHub 账号下创建仓库，名称可用 `qiye`。
2. 点击 **Add file → Upload files**。
3. 上传本项目内部的文件和目录，并确认 `README.md` 位于仓库根目录。
4. 检查文件列表，再提交。

macOS Finder 默认隐藏点开头的项目，按 `⌘⇧.` 可显示它们。上传源码时应包含 `.gitignore` 和 `.github/`，但不要上传 `.git/`。

如果使用 Release 的 `TabNest-Source.zip` 或本地生成的 `qiye-源码.zip`，请先解压，再上传 `qiye/` 内部源码；只上传 ZIP 文件不会让 GitHub 在首页展示 README，也不会启用自动检查。

## 用 Git 上传

本地项目已经初始化 Git 仓库。先检查当前暂存及未暂存内容，确认后再提交；不要把其他项目一起加入。

在 GitHub 创建仓库后，使用页面提供的真实远端地址配置 `origin`，并推送 `main` 分支。请根据自己的 GitHub 账号配置提交身份和认证，不要复制其他人的账号或远端地址。

## 生成下载包

```bash
python3 scripts/package.py
```

生成 `dist/栖页-插件.zip` 和 `dist/qiye-源码.zip`。插件包包含运行资源和 MIT 许可证；源码包包含文档、测试和自动检查配置，不包含 `.git/` 等本地元数据。

只维护根目录的 `LICENSE`。打包脚本会自动将它原样加入插件包根目录，源码包也保留这一份文件；无需在 `extension/` 下另存副本。

## GitHub Release 的附件命名

本地脚本和 Actions 的输出文件名保持不变。上传到 Releases 前，复制并命名为：

| 本地 / Actions 输出 | Release 附件名称 | 用途 |
| --- | --- | --- |
| `dist/栖页-插件.zip` | `TabNest-Chrome.zip` | 普通用户解压后，加载直接包含 `manifest.json` 的目录 |
| `dist/qiye-源码.zip` | `TabNest-Source.zip` | 开发者解压后，加载 `qiye/extension/` |

仅复制并改名，无需改变 ZIP 内部结构。插件包内保留运行资源与 `LICENSE`；完整源码包保留 `qiye/` 外层目录。详细安装步骤见[安装与更新](INSTALL.md)。

在 GitHub Releases 创建与 `extension/manifest.json` 的版本号一致的标签（例如插件版本 `2.0.2` 对应 `v2.0.2`），上传以上两份附件。README 的 `/releases/latest/download/TabNest-Chrome.zip` 和 `TabNest-Source.zip` 依赖这两个固定名称，每次发布应保持一致。

GitHub Actions 对每次 push 和 pull request 执行回归测试、后台启动检查、Chrome / Edge 浏览器验收与打包；通过后可下载 `qiye-packages`。`qiye-browser-check` 分别保留两个浏览器的截图及 `result.json`，失败时尽可能附带失败截图，保留 14 天。

目前 Release 仍需手动发布，Actions 不会自动创建版本或上传 Release 附件。源码、下载包和 Chrome Web Store / Microsoft Edge Add-ons 发布是不同的交付方式；上传 GitHub 不会自动上架扩展商店。

## 上架 Edge Add-ons

Edge 使用 Chromium Manifest V3，可以直接复用 `dist/栖页-插件.zip`，不需要修改清单或单独打包。

1. 在 [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/) 注册并创建扩展条目。
2. 上传 `dist/栖页-插件.zip`，确认清单版本为 3、扩展名称为「栖页」。
3. 填写商店说明、截图、隐私说明和支持链接；隐私说明可直接参考 `PRIVACY.md`。
4. 提交审核。Edge 与 Chrome 的审核相互独立，通过其中一个商店不会自动上架另一个。

本地验收 Edge 时，在 `edge://extensions` 开启「开发人员模式」，点击「加载解压缩的扩展」并选择 `extension/` 目录。

## 发布前核对

- `extension/manifest.json` 中名称和图标路径正确。
- README 中的图片和文档链接可在仓库内打开。
- 根目录的 `LICENSE` 通过校验，插件包中的 `LICENSE` 与其内容一致。
- 回归测试、后台启动检查与 Chrome / Edge 浏览器自动验收通过。
- 查看 `qiye-browser-check` 结果；新标签页、保存、已查看、刷新保留和多页面同步均正常。
- 下载包可以解压，加载目录内包含 `manifest.json`。
- Release 标签与插件版本号一致，附件名为 `TabNest-Chrome.zip` 和 `TabNest-Source.zip`，README 的下载入口可用。
