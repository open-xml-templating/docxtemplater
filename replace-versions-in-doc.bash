#!/usr/bin/env bash
set -euo pipefail

ag libs/docxtemplater | grep -v bash

version="$(jq .version --raw-output <package.json)"
echo "$version"

for i in docs/source/*.rst
do
	sed -i -E "s@libs/docxtemplater/[0-9]+\.[0-9]+\.[0-9]+@libs/docxtemplater/$version@g" "$i"
	echo "$i"
done

git add '*.rst'
git commit -m "Update versions in documentation"
