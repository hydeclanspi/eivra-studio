# Frozen legacy snapshot

`dugou-legacy/` preserves every tracked file from commit `11b4f89d4b726c0b87ab631315ce8e75334a332c` before the product-wide Eivra migration. File bytes are unchanged; checksums are listed in `dugou-legacy.manifest.json`.

This directory is a read-only historical archive, not an active application or deployment root. The maintained application remains `../eivra-studio/`; CI definitions remain `../.github/workflows/`. Instructions inside the snapshot describe that historical version and do not govern the active code.

Dependencies, build caches, local credentials and `.git/` are not included. The independent `data` branch and its encrypted snapshots are not copied or merged.

To inspect or run the old version, copy its application into a separate checkout and install its locked dependencies there. Do not deploy it over the current site or point an experimental instance at live synchronization services.
