#/bin/bash


ignored="$(git ls-files -o -i --exclude-standard)"
all="$(find . -type f | cut -c 3- | grep -v '^.git')"

( git status --short|cut -d\  -f2- && git ls-files ) |
sort -u |
( xargs -d '\n' -- stat -c%n 2>/dev/null  ||: ) > trackedfiles

count="$(grep -v -E '(Makefile)' <trackedfiles | grep -v '^docs/' | grep -v '\.md$' | grep '[A-Z_]' | tee /dev/stderr | wc -l)"
if [ "$count" = "0" ]
then
	echo "Casing OK"
	exit 0
fi
echo "$count files have incorrect casing"
exit 1
