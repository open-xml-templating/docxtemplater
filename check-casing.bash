#/bin/bash


ignored="$(git ls-files -o -i --exclude-standard)"
all="$(find . -type f | cut -c 3- | grep -v '^.git')"
trackedfiles="$(( git status --short|cut -d\  -f2- && git ls-files ) | sort -u | ( xargs -d '\n' -- stat -c%n 2>/dev/null  ||: ))"
count="$(echo "$trackedfiles" | grep -v -E '(Makefile)' | grep -v '^docs/' | grep -v '\.md$' | grep '[A-Z_]' | tee /dev/stderr | wc -l)"
if [ "$count" = "0" ]
then
	echo "Casing OK"
	exit 0
fi
echo "$count files have incorrect casing"
exit 1
