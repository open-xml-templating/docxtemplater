#!/usr/bin/env bash
set -euo pipefail

tgrep() {
	grep "$@" || true
}

( git status --short|cut -d\  -f2- && git ls-files ) |
sort -u |
( xargs -d '\n' -- stat -c%n 2>/dev/null  ||: ) > trackedfiles.log

files="$(grep -vE '(Makefile)' <trackedfiles.log | tgrep -v '^docs/' | tgrep -v '\.md$' | tgrep '[A-Z_]')"

if [ "$files" = "" ]
then
	exit 0
fi

echo "$(wc -l <<<"$files") files have incorrect casing :"
printf "%s\n" "$files"
exit 1
