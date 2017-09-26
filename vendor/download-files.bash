#!/bin/bash

set -euo pipefail

downloadifnotexists() {
	url="$1"
	path="$(basename "$url")"
	if [ -f "$path" ]
	then
		return 0
	fi
	wget "$url"
}

downloadifnotexists https://cdnjs.cloudflare.com/ajax/libs/mocha/3.5.3/mocha.css
downloadifnotexists https://cdnjs.cloudflare.com/ajax/libs/mocha/3.5.3/mocha.js
