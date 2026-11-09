#!/usr/bin/env python3
"""Build installable 栖页 and GitHub-ready source archives."""
import json
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXTENSION = ROOT / "extension"
OUTPUT = ROOT / "dist" / "栖页-插件.zip"
SOURCE_OUTPUT = ROOT / "dist" / "qiye-源码.zip"
ALLOWED_SUFFIXES = {".html", ".css", ".js", ".json", ".png", ".svg", ".woff", ".woff2"}
SOURCE_SUFFIXES = ALLOWED_SUFFIXES | {".mjs", ".md", ".py", ".sh", ".yml", ".yaml"}
SOURCE_ROOT_FILES = [
    ".gitignore", "AGENTS.md", "CHANGELOG.md", "LICENSE", "PRIVACY.md",
    "README.md", "build.sh",
]
SOURCE_DIRECTORIES = [".github", "docs", "extension", "scripts"]


def validate():
    manifest = json.loads((EXTENSION / "manifest.json").read_text())
    if any(name != "栖页" for name in (
        manifest["name"], manifest.get("short_name"), manifest["action"]["default_title"]
    )):
        raise ValueError("发布包名称必须为栖页")
    license_text = (ROOT / "LICENSE").read_text()
    if (EXTENSION / "LICENSE").read_text() != license_text:
        raise ValueError("项目与插件 LICENSE 必须一致")
    required = ["Copyright (c) 2026 Zara Zhang", "Copyright (c) 2026 dengduck",
                "Permission is hereby granted", "THE SOFTWARE IS PROVIDED"]
    if not all(part in license_text for part in required):
        raise ValueError("许可证声明不完整")


def runtime_files():
    files = []
    for file in sorted(EXTENSION.rglob("*")):
        if not file.is_file() or file.is_symlink():
            continue
        relative = file.relative_to(EXTENSION)
        if "tests" in relative.parts or any(part.startswith(".") for part in relative.parts):
            continue
        if file.name == "config.local.js":
            continue
        if file.name == "LICENSE" or file.suffix in ALLOWED_SUFFIXES:
            files.append((file, relative.as_posix()))
    return files


def source_files():
    files = [(ROOT / name, f"qiye/{name}") for name in SOURCE_ROOT_FILES]
    for directory in SOURCE_DIRECTORIES:
        for file in sorted((ROOT / directory).rglob("*")):
            if not file.is_file() or file.is_symlink():
                continue
            relative = file.relative_to(ROOT / directory)
            if any(part.startswith(".") or part in {"__pycache__", "node_modules"}
                   for part in relative.parts):
                continue
            if file.name == "config.local.js":
                continue
            if file.name == "LICENSE" or file.suffix in SOURCE_SUFFIXES:
                files.append((file, f"qiye/{file.relative_to(ROOT).as_posix()}"))
    return files


def write_archive(output, files):
    output.parent.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".zip", delete=False) as temporary:
        temp_path = Path(temporary.name)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for file, relative in files:
                info = zipfile.ZipInfo(relative, date_time=(2026, 11, 9, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, file.read_bytes())
        temp_path.replace(output)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"已生成：{output}（{len(files)} 个文件）")


def main():
    validate()
    write_archive(OUTPUT, runtime_files())
    write_archive(SOURCE_OUTPUT, source_files())


if __name__ == "__main__":
    main()
