#!/usr/bin/env python3
"""Package the runnable 栖页 extension with its MIT notice."""
import json
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXTENSION = ROOT / "extension"
OUTPUT = ROOT / "dist" / "栖页-插件.zip"
ALLOWED_SUFFIXES = {".html", ".css", ".js", ".json", ".png", ".svg", ".woff", ".woff2"}


def main():
    manifest = json.loads((EXTENSION / "manifest.json").read_text())
    if manifest["name"] != "栖页" or manifest["action"]["default_title"] != "栖页":
        raise ValueError("发布包名称必须为栖页")
    license_text = (ROOT / "LICENSE").read_text()
    if (EXTENSION / "LICENSE").read_text() != license_text:
        raise ValueError("项目与插件 LICENSE 必须一致")
    required = ["Copyright (c) 2026 Zara Zhang", "Copyright (c) 2026 dengduck",
                "Permission is hereby granted", "THE SOFTWARE IS PROVIDED"]
    if not all(part in license_text for part in required):
        raise ValueError("许可证声明不完整")
    files = []
    for file in sorted(EXTENSION.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(EXTENSION)
        if "tests" in relative.parts or any(part.startswith(".") for part in relative.parts):
            continue
        if file.name == "config.local.js":
            continue
        if file.name == "LICENSE" or file.suffix in ALLOWED_SUFFIXES:
            files.append((file, relative.as_posix()))
    OUTPUT.parent.mkdir(exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=OUTPUT.parent, suffix=".zip", delete=False) as temporary:
        temp_path = Path(temporary.name)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for file, relative in files:
                info = zipfile.ZipInfo(relative, date_time=(2026, 11, 9, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, file.read_bytes())
        temp_path.replace(OUTPUT)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"已生成：{OUTPUT}（{len(files)} 个文件，版本 {manifest['version']}）")


if __name__ == "__main__":
    main()
