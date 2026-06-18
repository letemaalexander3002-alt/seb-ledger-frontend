#!/usr/bin/env python3
"""
build_frontend_zip.py
----------------------------------------------------------------------
Packages the SEB-Ledger frontend project into a clean, distributable
.zip archive — excluding build artifacts, dependency folders, and VCS
metadata. Intended to be run from the project root:

    python3 build_frontend_zip.py

Produces: seb-ledger-frontend_<YYYYMMDD-HHMM>.zip in the parent directory
of the project (so the archive itself is never zipped into itself).
----------------------------------------------------------------------
"""

import os
import sys
import zipfile
from datetime import datetime

# Directories that should never be included in the distributable archive.
EXCLUDED_DIRS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".vite",
    "__pycache__",
}

# Specific files to exclude by exact name.
EXCLUDED_FILES = {
    ".DS_Store",
    "Thumbs.db",
}

# File extensions to exclude (e.g. local env secrets, logs).
EXCLUDED_EXTENSIONS = {
    ".log",
}

# Names of local env files to exclude — these typically hold secrets such
# as VITE_API_BASE_URL overrides or backend tokens and should never ship
# inside a distributed archive.
EXCLUDED_ENV_FILES = {".env", ".env.local", ".env.production"}


def should_skip_dir(dirname: str) -> bool:
    return dirname in EXCLUDED_DIRS


def should_skip_file(filename: str) -> bool:
    if filename in EXCLUDED_FILES:
        return True
    if filename in EXCLUDED_ENV_FILES:
        return True
    _, ext = os.path.splitext(filename)
    if ext in EXCLUDED_EXTENSIONS:
        return True
    return False


def build_zip(project_root: str, output_path: str) -> int:
    """Walks project_root and writes a zip to output_path.
    Returns the number of files written."""
    file_count = 0
    project_name = os.path.basename(os.path.normpath(project_root))

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for current_dir, subdirs, files in os.walk(project_root):
            # Prune excluded directories in-place so os.walk skips them.
            subdirs[:] = [d for d in subdirs if not should_skip_dir(d)]

            for filename in files:
                if should_skip_file(filename):
                    continue

                absolute_path = os.path.join(current_dir, filename)
                relative_path = os.path.relpath(absolute_path, project_root)
                # Nest everything under the project folder name inside the
                # zip, so extracting it recreates "seb-ledger-frontend/...".
                archive_path = os.path.join(project_name, relative_path)

                zf.write(absolute_path, archive_path)
                file_count += 1

    return file_count


def main() -> None:
    project_root = os.path.dirname(os.path.abspath(__file__))
    timestamp = datetime.now().strftime("%Y%m%d-%H%M")
    project_name = os.path.basename(os.path.normpath(project_root))

    output_filename = f"{project_name}_{timestamp}.zip"
    output_path = os.path.join(os.path.dirname(project_root), output_filename)

    print(f"Packaging '{project_name}' for distribution…")
    print(f"  Source: {project_root}")
    print(f"  Output: {output_path}")

    file_count = build_zip(project_root, output_path)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\nDone. Archived {file_count} files ({size_kb:.1f} KB) → {output_path}")
    print("Excluded: node_modules, dist, build, .git, .vite, env files, logs.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — top-level CLI error reporting
        print(f"Error while building zip: {exc}", file=sys.stderr)
        sys.exit(1)
