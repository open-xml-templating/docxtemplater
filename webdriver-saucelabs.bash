#!/usr/bin/env bash
set -euo pipefail

result=0
browserName="MicrosoftEdge" platform="Windows 10" version="16.16299" node webdriver.js || result=1
browserName="MicrosoftEdge" platform="Windows 10" version="17.17134" node webdriver.js || result=1
browserName="MicrosoftEdge" platform="Windows 10" version="18.17763" node webdriver.js || result=1
browserName="MicrosoftEdge" platform="Windows 10" version="83.0" node webdriver.js || result=1
browserName="safari" platform="macOs 10.12" version="11.0" filter="Speed test" node webdriver.js || result=1
browserName="safari" platform="macOS 10.14" version="12.0" filter="Speed test" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="58" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="71" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="73" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="75" node webdriver.js || result=1
browserName="chrome" platform="Windows 10" version="80" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="55" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="60" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="64" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="65" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="66" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="67" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="68" node webdriver.js || result=1
browserName="firefox" platform="Windows 10" version="73" node webdriver.js || result=1
browserName="internet explorer" platform="Windows 7" filter="Speed test" version="10.0" node webdriver.js || result=1
browserName="internet explorer" platform="Windows 10" filter="Speed test" version="11" node webdriver.js || result=1
browserName="iphone" platform="Mac 10.11" version="10.3" node webdriver.js || result=1
exit "$result"
