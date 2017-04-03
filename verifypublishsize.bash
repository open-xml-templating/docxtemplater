#!/bin/bash

rm *.tgz -rf
npm pack .
size="$(wc -c <*.tgz)"
echo "size is $size"

if [ "$size" -gt 1500000 ]
then
	echo "Size exceeds 1.5 M, abort publish"
fi
