#!/bin/bash

set -euo pipefail
pid=""

cleanup() {
	if [ "$pid" != "" ]
	then
		kill "$pid" || true
	fi
}
trap "cleanup" EXIT INT
PATH="$PATH:./node_modules/.bin/"

REMOTE_BROWSER="${REMOTE_BROWSER:-""}"
if [ "$REMOTE_BROWSER" = "" ]
then
	if netstat -tnlp | grep --color -E 4444 >/dev/null
	then
		echo "Using existing selenium"
	else
		selenium-standalone install --silent
		selenium-standalone start -- -log /tmp/protractor.log &
		pid="$!"
	fi
fi
echo "node webdriver"


if [ "$REMOTE_BROWSER" = "" ]
then
	node webdriver.js
	exit "$?"
fi

browserName=firefox platform="Windows 10" node webdriver.js
browserName=chrome platform="Windows 10" node webdriver.js
browserName="internet explorer" platform=XP version=6 node webdriver.js
browserName="internet explorer" platform=XP version=7 node webdriver.js
browserName="internet explorer" platform="Windows 7" version=8 node webdriver.js
browserName="internet explorer" platform="Windows 7" version=9 node webdriver.js
browserName="internet explorer" platform="Windows 8" version=10 node webdriver.js
browserName="internet explorer" platform="Windows 10" version=11 node webdriver.js
browserName=MicrosoftEdge platform="Windows 10" version=13 node webdriver.js
browserName=opera platform="Windows 2008" version=12 node webdriver.js
browserName=safari platform="OS X 10.8" version=6 node webdriver.js
browserName=safari platform="OS X 10.9" version=7 node webdriver.js
browserName=safari platform="OS X 10.10" version=8 node webdriver.js
browserName=safari platform="OS X 10.11" version=9 node webdriver.js
browserName="iphone" platform="OS X 10.11" version="9.2" node webdriver.js
browserName="iphone" platform="OS X 10.11" version="7.0" node webdriver.js
browserName=android platform=Linux version=4.0 node webdriver.js
browserName=android platform=Linux version=4.4 node webdriver.js
browserName=android platform=Linux version=5.1 node webdriver.js
