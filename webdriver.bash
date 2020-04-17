#!/usr/bin/env bash
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
	while read -r -d '|' browser
	do
		echo "$browser"
		BROWSER="$browser" ./webdriver.bash
	done <<<"$BROWSER"
	exit 0
fi

port4444used() {
	netstat -tnlp 2>/dev/null | grep 4444 >/dev/null
}

if [ "$BROWSER" != "SAUCELABS" ]
then
	if port4444used
	then
		echo "Using existing selenium"
	else
		if ! [ -d node_modules/selenium-standalone/.selenium ]
		then
			mkdir -p "$HOME/tmp/"
			if [ -d "$HOME/tmp/.selenium" ]
			then
				echo "Copying selenium from cache"
				cp -r "$HOME/tmp/.selenium" node_modules/selenium-standalone/.selenium
			else
				echo "Installing selenium"
				selenium-standalone install
				cp -r node_modules/selenium-standalone/.selenium "$HOME/tmp/.selenium"
			fi
		fi
		echo "Starting selenium"
		selenium-standalone start -- -log /tmp/protractor.log &
		pid="$!"
		while ! port4444used;
		do
			sleep 0.5
		done
	fi
	node webdriver.js
	exit "$?"
else
	bash webdriver-saucelabs.bash
fi

