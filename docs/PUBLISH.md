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

如果使用 `qiye-源码.zip`，请先解压，再上传内部源码；只上传 ZIP 文件不会让 GitHub 在首页展示 README，也不会启用自动检查。

## 用 Git 上传

本地项目已经初始化 Git 仓库。先检查当前暂存及未暂存内容，确认后再提交；不要把其他项目一起加入。

在 GitHub 创建仓库后，使用页面提供的真实远端地址配置 `origin`，并推送 `main` 分支。请根据自己的 GitHub 账号配置提交身份和认证，不要复制其他人的账号或远端地址。

## 生成下载包

```bash
python3 scripts/package.py
```

生成 `dist/栖页-插件.zip` 和 `dist/qiye-源码.zip`。插件包包含运行资源和 MIT 许可证；源码包包含文档、测试和自动检查配置，不包含 `.git/` 等本地元数据。

可以在 GitHub Releases 创建与插件版本一致的发布版本，把 `栖页-插件.zip` 附在其中。源码、下载包和 Chrome Web Store 发布是不同的交付方式；上传 GitHub 不会自动上架扩展商店。

## 发布前核对

- `extension/manifest.json` 中名称和图标路径正确。
- README 中的图片和文档链接可在仓库内打开。
- 根目录与插件目录的 `LICENSE` 相同，原版权和许可完整。
- 回归测试与后台启动检查通过。
- 用独立浏览器确认新标签页、保存与已查看流程。
- 下载包可以解压，加载目录内包含 `manifest.json`。
