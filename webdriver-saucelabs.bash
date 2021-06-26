#!/usr/bin/env bash
set -euo pipefail

result=0
declare -a failures=()
test() {
	fail=false
	node webdriver.js || fail=true
	if [ "$fail" = "true" ]
	then
		result=1
		failures+=("Fail for ${browserName} ${version}")
	fi
}
browserName="MicrosoftEdge" platform="Windows 10" version="16.16299" test
browserName="MicrosoftEdge" platform="Windows 10" version="17.17134" test
browserName="MicrosoftEdge" platform="Windows 10" version="18.17763" test
browserName="MicrosoftEdge" platform="Windows 10" version="83.0" test
browserName="MicrosoftEdge" platform="Windows 10" version="88.0" test
browserName="MicrosoftEdge" platform="Windows 10" version="91.0" test
browserName="safari" platform="macOs 10.12" version="11.0" filter="Speed test" test
browserName="safari" platform="macOS 10.14" version="12.0" filter="Speed test" test
browserName="safari" platform="macOS 10.15" version="13.1" filter="Speed test" test
browserName="safari" platform="macOS 10.14" version="14.1" filter="Speed test" test
browserName="chrome" platform="Windows 10" version="58" test
browserName="chrome" platform="Windows 10" version="71" test
browserName="chrome" platform="Windows 10" version="73" test
browserName="chrome" platform="Windows 10" version="75" test
browserName="chrome" platform="Windows 10" version="81" test
browserName="chrome" platform="Windows 10" version="85" test
browserName="chrome" platform="Windows 10" version="88" test
browserName="chrome" platform="Windows 10" version="91" test
browserName="firefox" platform="Windows 10" version="55" test
browserName="firefox" platform="Windows 10" version="60" test
browserName="firefox" platform="Windows 10" version="64" test
browserName="firefox" platform="Windows 10" version="65" test
browserName="firefox" platform="Windows 10" version="66" test
browserName="firefox" platform="Windows 10" version="67" test
browserName="firefox" platform="Windows 10" version="68" test
browserName="firefox" platform="Windows 10" version="73" test
browserName="firefox" platform="Windows 10" version="80" test
browserName="firefox" platform="Windows 10" version="85" test
browserName="firefox" platform="Windows 10" version="89" test
browserName="internet explorer" platform="Windows 7" filter="Speed test" version="10.0" test
browserName="internet explorer" platform="Windows 10" filter="Speed test" version="11" test
browserName="iphone" platform="Mac 10.11" version="10.3" test

if [ "$result" = "1" ]
then
	echo "Failures for following browsers :"
	printf "%s\n" "${failures[@]}"
fi
exit "$result"
