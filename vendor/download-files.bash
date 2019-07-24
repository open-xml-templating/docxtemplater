#!/bin/bash

set -euo pipefail

downloadifnotexists() {
	url="$1"
	# dash-case
	path="$(basename "$url" | sed -e 's/\([A-Z]\)/-\L\1/g' -e 's/^-//')"
	if [ -f "$path" ]
	then
		return 0
	fi
	wget "$url" -O "$path"
}

downloadifnotexists https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
downloadifnotexists https://cdnjs.cloudflare.com/ajax/libs/mocha/3.5.3/mocha.css
downloadifnotexists https://cdnjs.cloudflare.com/ajax/libs/mocha/3.5.3/mocha.js
downloadifnotexists https://unpkg.com/pizzip@3.0.5/dist/pizzip.js
downloadifnotexists https://unpkg.com/pizzip@3.0.5/dist/pizzip-utils.js
downloadifnotexists https://unpkg.com/pizzip@3.0.5/dist/pizzip-utils-ie.js
