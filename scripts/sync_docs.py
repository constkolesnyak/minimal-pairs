"""Export the static site assets into docs/ for GitHub Pages hosting."""

from __future__ import annotations

import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_DIR = REPO_ROOT / "minimal_pairs"
DOCS_DIR = REPO_ROOT / "docs"

COPY_TARGETS = [
    (PACKAGE_DIR / "index.html", DOCS_DIR / "index.html"),
    (PACKAGE_DIR / "css", DOCS_DIR / "css"),
    (PACKAGE_DIR / "js", DOCS_DIR / "js"),
    (PACKAGE_DIR / "data", DOCS_DIR / "data"),
]


def copy_path(source: Path, destination: Path) -> None:
    if source.is_dir():
        if destination.exists():
            shutil.rmtree(destination)
        shutil.copytree(source, destination)
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> None:
    DOCS_DIR.mkdir(exist_ok=True)

    for source, destination in COPY_TARGETS:
        copy_path(source, destination)


if __name__ == "__main__":
    main()
