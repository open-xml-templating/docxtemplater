#!/usr/bin/env bash

set -euo pipefail

if ! [ -f test/mocha.html ]
then
	echo "test/mocha.html does not exist" 1>&2
	exit 1
fi
port4444used() {
	netstat -tnlp 2>/dev/null | grep 4444 >/dev/null
}
install_selenium() {
	rm node_modules/selenium-standalone/.selenium/*driver -rf
	echo "Installing selenium"
	selenium-standalone install 2>&1 | tee /tmp/selenium_install.log
	if grep --quiet -E '(Error)|(Could not download)' </tmp/selenium_install.log
	then
		echo "Error downloading selenium drivers"
		exit 1
	fi
	rsync node_modules/selenium-standalone/.selenium/ "$HOME/tmp/.selenium/"
}
export GRAY='[90m'
export NORMAL='[m'

selenium_pid=""
start_selenium() {
	{ selenium-standalone start 2>&1 | tee /tmp/webdriver.log | sed -E "s/^.*$/$GRAY\0$NORMAL/g" ; } &
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
force_stop_selenium() {
	fuser -k 4444/tcp || true
}
cleanup() {
	stop_selenium
}
trap "cleanup" EXIT INT

BROWSER="${BROWSER:-CHROME|FIREFOX|}"
PATH="$PATH:./node_modules/.bin/"
selenium_cache_dir="$HOME/tmp/.selenium"
selenium_dir="node_modules/selenium-standalone/.selenium"
if grep '|' <<<"$BROWSER" >/dev/null
then
	while read -r -d '|' browser
	do
		BROWSER="$browser" ./webdriver.bash
	done <<<"$BROWSER"
	exit 0
fi

export -f stop_selenium

isempty() {
	[ ! "$(ls -A "$1")" ]
}

if [ "$BROWSER" != "SAUCELABS" ]
then
	retries=2
	while [ "$retries" -gt 0 ]
	do
		retries="$((retries - 1))"
		if port4444used
		then
			echo "Using existing selenium for $BROWSER"
		else
			if ! [ -d "$selenium_dir" ] || isempty "$selenium_dir"
			then
				rm -rf "$selenium_dir"
				mkdir -p "$HOME/tmp/"
				if [ -d "$selenium_cache_dir" ] && ! isempty "$selenium_cache_dir"
				then
					echo "Copying selenium from cache"
					cp -r "$selenium_cache_dir" node_modules/selenium-standalone/.selenium
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
					force_stop_selenium
					install_selenium
					start_selenium
				fi
				sleep 0.5
			done
		fi
		result=0
		{ FORCE_COLOR=1 node webdriver.js | tee /tmp/test.log; } || result="$?"
		if [ "$result" = "0" ]
		then
			exit 0
		fi

		if grep 'This version of ChromeDriver only supports Chrome version ' </tmp/test.log ||
			grep 'Error: Failed to create session.' </tmp/test.log
		then
			echo "Retrying by restarting selenium: $retries"
			force_stop_selenium
			install_selenium
			start_selenium
		else
			exit "$result"
		fi
	done
else
	bash webdriver-saucelabs.bash
fi

