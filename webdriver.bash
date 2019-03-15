#!/bin/bash

set -euo pipefail
pid=""

cleanup() {
	if [ "$pid" != "" ]
	then
		while true
		do
			kill "$pid" 1>/dev/null 2>&1 || break
			sleep 1
		done
	fi
}
trap "cleanup" EXIT INT
BROWSER="${BROWSER:-CHROME|FIREFOX|}"
PATH="$PATH:./node_modules/.bin/"
if grep '|' <<<"$BROWSER" >/dev/null
then
	while read -d '|' browser
	do
		echo "$browser"
		BROWSER="$browser" ./webdriver.bash
	done <<<"$BROWSER"
	exit 0
fi

port4444used() {
	netstat -tnlp 2>/dev/null | grep --color -E 4444 >/dev/null
}

if [ "$BROWSER" != "SAUCELABS" ]
then
	if port4444used
	then
		echo "Using existing selenium"
	else
		echo "Starting selenium"
		selenium-standalone install --silent
		selenium-standalone start -- -log /tmp/protractor.log &
		pid="$!"
		while ! port4444used;
		do
			sleep 0.5
		done
	fi
	node webdriver.js
	exit "$?"
fi

result=0

browserName="MicrosoftEdge" platform="Windows 10" version="16.16299" node webdriver.js || result=1
browserName="MicrosoftEdge" platform="Windows 10" version="17.17134" node webdriver.js || result=1
browserName="MicrosoftEdge" platform="Windows 10" version="18.17763" node webdriver.js || result=1
browserName="safari" platform="macOs 10.12" version="11.0" filter="Speed test" node webdriver.js || result=1
browserName="safari" platform="macOs 10.14" version="12.0" filter="Speed test" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="58" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="71" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="73" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="55" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="64" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="65" node webdriver.js || result=1
browserName="internet explorer" platform="Windows 7" version="10.0" node webdriver.js || result=1
browserName="internet explorer" platform="Windows 10" version="11" node webdriver.js || result=1
browserName="iphone" platform="Mac 10.11" version="10.2" node webdriver.js || result=1
exit "$result"
