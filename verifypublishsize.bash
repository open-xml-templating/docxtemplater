#!/usr/bin/env bash
set -euo pipefail

rm -rf -- *.tgz
npm pack .
size="$(wc -c <*.tgz)"
echo "size is $size"

if [ "$size" -gt 200000 ]
then
	echo "Size exceeds 200kB, abort publish"
	exit 1
fi
