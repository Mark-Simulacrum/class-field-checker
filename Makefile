build:
	babel --source-maps inline src --out-dir lib
	sed -i -e '1i#!/usr/bin/env node' lib/checker.js
	chmod u+x lib/checker.js