#!/usr/bin/env bash
set -euo pipefail

selenium_pid=""
port4444used() {
	netstat -tnlp 2>/dev/null | grep 4444 >/dev/null
}
install_selenium() {
	echo "Installing selenium"
	selenium-standalone install
	rsync node_modules/selenium-standalone/.selenium/ "$HOME/tmp/.selenium/"
}
start_selenium() {
	{ selenium-standalone start 2>&1 | tee /tmp/webdriver.log ; } &
	selenium_pid="$!"
}
stop_selenium() {
	if [ "$selenium_pid" != "" ]
	then
		while true
		do
			kill "$selenium_pid" 1>/dev/null 2>&1 || break
			sleep 1
		done
	fi
}
cleanup() {
	stop_selenium
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

export -f stop_selenium

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
				install_selenium
			fi
		fi
		echo "Starting selenium"
		start_selenium
		while ! port4444used;
		do
			if grep 'Missing.*driver' </tmp/webdriver.log
			then
				echo "missing driver"
				rm /tmp/webdriver.log
				install_selenium
				start_selenium
			fi
			sleep 0.5
		done
	fi
	node webdriver.js
	exit "$?"
else
	bash webdriver-saucelabs.bash
fi

