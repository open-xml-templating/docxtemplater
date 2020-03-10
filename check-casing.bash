#!/usr/bin/env bash
set -euo pipefail

tgrep() {
	grep "$@" || true
}

( git status --short|cut -d\  -f2- && git ls-files ) |
sort -u |
( xargs -d '\n' -- stat -c%n 2>/dev/null  ||: ) > trackedfiles.log

count="$(grep -vE '(Makefile)' <trackedfiles.log | tgrep -v '^docs/' | tgrep -v '\.md$' | tgrep '[A-Z_]' | tee /dev/stderr | wc -l)"
if [ "$count" = "0" ]
then
	exit 0
fi
echo "$count files have incorrect casing"
exit 1
