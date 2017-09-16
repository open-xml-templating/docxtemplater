#!/bin/bash

set -euo pipefail
pkill -f selenium-standalone || true
pid=""

cleanup() {
	pkill -f selenium-standalone || true
	if [ "$pid" != "" ]
	then
		kill "$pid" || true
	fi
}
trap "cleanup" EXIT INT
PATH="$PATH:./node_modules/.bin/"

selenium-standalone install --silent
selenium-standalone start -- -log /tmp/protractor.log &
sleep 2
pid="$!"
echo "node webdriver"
node webdriver.js
