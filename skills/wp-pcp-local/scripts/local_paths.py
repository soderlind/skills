"""Expand Local by Flywheel sites.json paths for filesystem use.

Local stores default macOS site directories as ~/Local Sites/<name>.
Those strings are not valid paths until the tilde is expanded.
"""

from __future__ import annotations

import os


def expand_site_path(path: str) -> str:
    return os.path.expanduser(path).rstrip("/")


def cwd_is_in_site(cwd: str, site_path: str) -> bool:
    expanded = expand_site_path(site_path)
    return cwd == expanded or cwd.startswith(expanded + "/")
