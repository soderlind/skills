#!/usr/bin/env python3
"""Local stores default macOS site paths as ~/Local Sites/<name> in sites.json."""

import os
import unittest

from local_paths import cwd_is_in_site, expand_site_path


class ExpandSitePathTests(unittest.TestCase):
    def test_expands_tilde_local_sites_path(self):
        home = os.path.expanduser("~")
        self.assertEqual(
            expand_site_path("~/Local Sites/sm"),
            f"{home}/Local Sites/sm",
        )

    def test_leaves_absolute_paths_unchanged(self):
        self.assertEqual(
            expand_site_path("/Users/you/Sites/plugins"),
            "/Users/you/Sites/plugins",
        )

    def test_strips_trailing_slash(self):
        home = os.path.expanduser("~")
        self.assertEqual(
            expand_site_path("~/Local Sites/sm/"),
            f"{home}/Local Sites/sm",
        )


class CwdMatchTests(unittest.TestCase):
    def test_matches_site_root(self):
        home = os.path.expanduser("~")
        cwd = f"{home}/Local Sites/sm"
        self.assertTrue(cwd_is_in_site(cwd, "~/Local Sites/sm"))

    def test_matches_cwd_inside_tilde_site_path(self):
        home = os.path.expanduser("~")
        cwd = f"{home}/Local Sites/sm/app/public"
        self.assertTrue(cwd_is_in_site(cwd, "~/Local Sites/sm"))

    def test_does_not_match_unrelated_directory(self):
        self.assertFalse(cwd_is_in_site("/tmp/other", "~/Local Sites/sm"))

    def test_does_not_match_prefix_sibling(self):
        home = os.path.expanduser("~")
        cwd = f"{home}/Local Sites/smarter"
        self.assertFalse(cwd_is_in_site(cwd, "~/Local Sites/sm"))


if __name__ == "__main__":
    unittest.main()
