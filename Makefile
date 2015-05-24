build:
	babel --source-maps inline checker.js > checker.js5
	sed -i -e '1i#!/usr/bin/env node' checker.js5
	chmod u+x ./checker.js5