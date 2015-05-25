#!/usr/bin/env node
"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require("babel-core/polyfill");

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _lodashFind = require("lodash.find");

var _lodashFind2 = _interopRequireDefault(_lodashFind);

var _acorn = require("acorn");

var acorn = _interopRequireWildcard(_acorn);

var _importResolver = require("./importResolver");

var _importResolver2 = _interopRequireDefault(_importResolver);

var _gadgets = require("./gadgets");

var _gadgets2 = _interopRequireDefault(_gadgets);

if (process.argv.length < 3) {
    process.stderr.write("Usage: node " + process.argv[1] + " FILE...\n");
    process.exit(1);
}

/*eslint-disable no-loop-func*/
var errors = [];
var parsedFiles = {};

var _loop = function (i) {
    var fileName = _path2["default"].normalize(process.argv[i]);
    var input = _fs2["default"].readFileSync(fileName).toString().replace(/^#!.*$/mg, "");

    var ast = undefined;
    try {
        ast = acorn.parse(input, { ecmaVersion: 6, sourceType: "module" });
    } catch (error) {
        error.msg = fileName + ": " + error.msg;
        throw error;
    }

    var imports = [];
    var classes = [];

    try {
        (0, _gadgets2["default"])(ast, { type: "ImportDeclaration" }, function (key, node) {
            var resolved = (0, _importResolver2["default"])(fileName, node.source.value);

            if (resolved.indexOf("node_modules") !== -1) return; // Skip imports from node_modules or node-specific classes

            var localIds = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = node.specifiers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var specifier = _step.value;

                    localIds.push(specifier.local.name);

                    if (!specifier.imported) {
                        specifier.imported = specifier.local; // XXX: Look into implications of what this means
                    }

                    imports.push({ id: specifier.local.name, from: specifier.imported.name, resolved: resolved });
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                        _iterator["return"]();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        });

        (0, _gadgets2["default"])(ast, { type: "ClassDeclaration" }, function (key, node) {
            var className = node.id.name;
            var currentClass = {};

            currentClass.name = className;
            currentClass.superClass = node.superClass ? node.superClass.name : null;
            currentClass.declarations = []; // strings: this.var_id
            currentClass.usedDeclarations = []; // objects: { start: node.start, declaration }

            (0, _gadgets2["default"])(node.body.body, { type: "MethodDefinition" }, function (key, node) {
                var isConstructor = node.kind === "constructor";

                (0, _gadgets2["default"])(node, { type: "FunctionExpression", body: { type: "MemberExpression" } }, function (key, node) {
                    (0, _gadgets2["default"])(node.body, { type: "MemberExpression" }, function (key, node) {
                        if (node.object.type === "ThisExpression") {
                            var declaration = input.slice(node.start, node.end);

                            // Cannot handle dynamic getting
                            if (/this\[.*?\]/.test(declaration)) return;

                            // Attempt to handle this._var[dynamic] by stripping dynamic portion
                            if (/this\..*?\[.*?\]/.test(declaration)) {
                                declaration = declaration.replace(/^(.*?)\[.*?/, /$1/);
                            }

                            if (isConstructor) {
                                if (currentClass.declarations.indexOf(declaration) === -1) {
                                    currentClass.declarations.push(declaration);
                                }
                            } else {
                                if (currentClass.usedDeclarations.indexOf(declaration) === -1) {
                                    currentClass.usedDeclarations.push({
                                        start: node.start,
                                        value: declaration
                                    });
                                }
                            }
                        }
                    });
                });
                currentClass.declarations.push("this." + node.key.name);
            });

            classes.push(currentClass);
        });
    } catch (error) {
        error.msg = fileName + ": " + error.msg;
        throw error;
    }

    parsedFiles[fileName] = {
        fileName: fileName,
        imports: imports,
        classes: classes,
        input: input,
        ast: ast
    };
};

for (var i = 2; i < process.argv.length; i++) {
    _loop(i);
}

var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
    for (var _iterator2 = Object.keys(parsedFiles)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var fileName = _step2.value;
        var _parsedFiles$fileName = parsedFiles[fileName];
        var classes = _parsedFiles$fileName.classes;
        var imports = _parsedFiles$fileName.imports;
        var input = _parsedFiles$fileName.input;

        try {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = classes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var classInfo = _step3.value;

                    if (classInfo.superClass === null) continue;

                    var superClass = (0, _lodashFind2["default"])(classes, { name: classInfo.superClass });
                    if (superClass) {
                        classInfo.declarations = classInfo.declarations.concat(superClass.declarations);
                    } else {
                        // Resolve class extends from other files.
                        var _iteratorNormalCompletion6 = true;
                        var _didIteratorError6 = false;
                        var _iteratorError6 = undefined;

                        try {
                            for (var _iterator6 = imports[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                var _step6$value = _step6.value;
                                var importId = _step6$value.id;
                                var fromId = _step6$value.from;
                                var resolvedFilePath = _step6$value.resolved;

                                if (importId === classInfo.superClass) {
                                    var importedFile = parsedFiles[resolvedFilePath];

                                    if (importedFile) {
                                        var importedClass = (0, _lodashFind2["default"])(importedFile.classes, { name: fromId });

                                        if (importedClass) {
                                            var importedDeclarations = importedClass.declarations;

                                            classInfo.declarations = classInfo.declarations.concat(importedDeclarations);
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            _didIteratorError6 = true;
                            _iteratorError6 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
                                    _iterator6["return"]();
                                }
                            } finally {
                                if (_didIteratorError6) {
                                    throw _iteratorError6;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                        _iterator3["return"]();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = classes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _step4$value = _step4.value;
                    var _name = _step4$value.name;
                    var declarations = _step4$value.declarations;

                    process.stdout.write("class " + _name + " in " + fileName + " declared: " + declarations.join(", ") + "\n");
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                        _iterator4["return"]();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = classes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _step5$value = _step5.value;
                    var _name2 = _step5$value.name;
                    var declarations = _step5$value.declarations;
                    var usedDeclarations = _step5$value.usedDeclarations;
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = usedDeclarations[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var usedDeclaration = _step7.value;

                            if (declarations.indexOf(usedDeclaration.value) === -1) {
                                var loc = acorn.getLineInfo(input, usedDeclaration.start);
                                var _location = "" + fileName + ":" + loc.line + ":" + (loc.column + 1);
                                errors.push("" + _location + ": \"" + usedDeclaration.value + "\" not initialized in constructor of class " + _name2 + "\n");
                            }
                        }
                    } catch (err) {
                        _didIteratorError7 = true;
                        _iteratorError7 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion7 && _iterator7["return"]) {
                                _iterator7["return"]();
                            }
                        } finally {
                            if (_didIteratorError7) {
                                throw _iteratorError7;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
                        _iterator5["return"]();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        } catch (error) {
            error.msg = fileName + ": " + error.msg;
        }
    }
} catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
} finally {
    try {
        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
            _iterator2["return"]();
        }
    } finally {
        if (_didIteratorError2) {
            throw _iteratorError2;
        }
    }
}

errors.forEach(function (error) {
    return process.stderr.write(error);
});
//# sourceMappingURL=data:application/json;base64,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QUFDIiwiZmlsZSI6ImNoZWNrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJiYWJlbC1jb3JlL3BvbHlmaWxsXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGZpbmQgZnJvbSBcImxvZGFzaC5maW5kXCI7XG5pbXBvcnQgKiBhcyBhY29ybiBmcm9tIFwiYWNvcm5cIjtcbmltcG9ydCBpbXBvcnRSZXNvbHZlciBmcm9tIFwiLi9pbXBvcnRSZXNvbHZlclwiO1xuaW1wb3J0IHdhbGtBU1QgZnJvbSBcIi4vZ2FkZ2V0c1wiO1xuXG5pZiAocHJvY2Vzcy5hcmd2Lmxlbmd0aCA8IDMpIHtcbiAgICBwcm9jZXNzLnN0ZGVyci53cml0ZShgVXNhZ2U6IG5vZGUgJHtwcm9jZXNzLmFyZ3ZbMV19IEZJTEUuLi5cXG5gKTtcbiAgICBwcm9jZXNzLmV4aXQoMSk7XG59XG5cbi8qZXNsaW50LWRpc2FibGUgbm8tbG9vcC1mdW5jKi9cbmxldCBlcnJvcnMgPSBbXTtcbmxldCBwYXJzZWRGaWxlcyA9IHt9O1xuZm9yIChsZXQgaSA9IDI7IGkgPCBwcm9jZXNzLmFyZ3YubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGgubm9ybWFsaXplKHByb2Nlc3MuYXJndltpXSk7XG4gICAgY29uc3QgaW5wdXQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZU5hbWUpLnRvU3RyaW5nKCkucmVwbGFjZSgvXiMhLiokL21nLCBcIlwiKTtcblxuICAgIGxldCBhc3Q7XG4gICAgdHJ5IHtcbiAgICAgICAgYXN0ID0gYWNvcm4ucGFyc2UoaW5wdXQsIHsgZWNtYVZlcnNpb246IDYsIHNvdXJjZVR5cGU6IFwibW9kdWxlXCIgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3IubXNnID0gZmlsZU5hbWUgKyBcIjogXCIgKyBlcnJvci5tc2c7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIGxldCBpbXBvcnRzID0gW107XG4gICAgbGV0IGNsYXNzZXMgPSBbXTtcblxuICAgIHRyeSB7XG4gICAgICAgIHdhbGtBU1QoYXN0LCB7IHR5cGU6IFwiSW1wb3J0RGVjbGFyYXRpb25cIiB9LCBmdW5jdGlvbiAoa2V5LCBub2RlKSB7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWQgPSBpbXBvcnRSZXNvbHZlcihmaWxlTmFtZSwgbm9kZS5zb3VyY2UudmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAocmVzb2x2ZWQuaW5kZXhPZihcIm5vZGVfbW9kdWxlc1wiKSAhPT0gLTEpIHJldHVybjsgLy8gU2tpcCBpbXBvcnRzIGZyb20gbm9kZV9tb2R1bGVzIG9yIG5vZGUtc3BlY2lmaWMgY2xhc3Nlc1xuXG4gICAgICAgICAgICBsZXQgbG9jYWxJZHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHNwZWNpZmllciBvZiBub2RlLnNwZWNpZmllcnMpIHtcbiAgICAgICAgICAgICAgICBsb2NhbElkcy5wdXNoKHNwZWNpZmllci5sb2NhbC5uYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICghc3BlY2lmaWVyLmltcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwZWNpZmllci5pbXBvcnRlZCA9IHNwZWNpZmllci5sb2NhbDsgLy8gWFhYOiBMb29rIGludG8gaW1wbGljYXRpb25zIG9mIHdoYXQgdGhpcyBtZWFuc1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGltcG9ydHMucHVzaCh7IGlkOiBzcGVjaWZpZXIubG9jYWwubmFtZSwgZnJvbTogc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUsIHJlc29sdmVkIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB3YWxrQVNUKGFzdCwgeyB0eXBlOiBcIkNsYXNzRGVjbGFyYXRpb25cIiB9LCBmdW5jdGlvbiAoa2V5LCBub2RlKSB7XG4gICAgICAgICAgICBsZXQgY2xhc3NOYW1lID0gbm9kZS5pZC5uYW1lO1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRDbGFzcyA9IHt9O1xuXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3MubmFtZSA9IGNsYXNzTmFtZTtcbiAgICAgICAgICAgIGN1cnJlbnRDbGFzcy5zdXBlckNsYXNzID0gbm9kZS5zdXBlckNsYXNzID8gbm9kZS5zdXBlckNsYXNzLm5hbWUgOiBudWxsO1xuICAgICAgICAgICAgY3VycmVudENsYXNzLmRlY2xhcmF0aW9ucyA9IFtdOyAvLyBzdHJpbmdzOiB0aGlzLnZhcl9pZFxuICAgICAgICAgICAgY3VycmVudENsYXNzLnVzZWREZWNsYXJhdGlvbnMgPSBbXTsgLy8gb2JqZWN0czogeyBzdGFydDogbm9kZS5zdGFydCwgZGVjbGFyYXRpb24gfVxuXG4gICAgICAgICAgICB3YWxrQVNUKG5vZGUuYm9keS5ib2R5LCB7IHR5cGU6IFwiTWV0aG9kRGVmaW5pdGlvblwiIH0sIGZ1bmN0aW9uIChrZXksIG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpc0NvbnN0cnVjdG9yID0gbm9kZS5raW5kID09PSBcImNvbnN0cnVjdG9yXCI7XG5cbiAgICAgICAgICAgICAgICB3YWxrQVNUKG5vZGUsIHsgdHlwZTogXCJGdW5jdGlvbkV4cHJlc3Npb25cIiwgYm9keTogeyB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIiB9IH0sIGZ1bmN0aW9uIChrZXksIG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2Fsa0FTVChub2RlLmJvZHksIHsgdHlwZTogXCJNZW1iZXJFeHByZXNzaW9uXCIgfSwgZnVuY3Rpb24gKGtleSwgbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUub2JqZWN0LnR5cGUgPT09IFwiVGhpc0V4cHJlc3Npb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkZWNsYXJhdGlvbiA9IGlucHV0LnNsaWNlKG5vZGUuc3RhcnQsIG5vZGUuZW5kKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbm5vdCBoYW5kbGUgZHluYW1pYyBnZXR0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC90aGlzXFxbLio/XFxdLy50ZXN0KGRlY2xhcmF0aW9uKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0ZW1wdCB0byBoYW5kbGUgdGhpcy5fdmFyW2R5bmFtaWNdIGJ5IHN0cmlwcGluZyBkeW5hbWljIHBvcnRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL3RoaXNcXC4uKj9cXFsuKj9cXF0vLnRlc3QoZGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uID0gZGVjbGFyYXRpb24ucmVwbGFjZSgvXiguKj8pXFxbLio/LywgLyQxLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDbGFzcy5kZWNsYXJhdGlvbnMuaW5kZXhPZihkZWNsYXJhdGlvbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MuZGVjbGFyYXRpb25zLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDbGFzcy51c2VkRGVjbGFyYXRpb25zLmluZGV4T2YoZGVjbGFyYXRpb24pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzLnVzZWREZWNsYXJhdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG5vZGUuc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY3VycmVudENsYXNzLmRlY2xhcmF0aW9ucy5wdXNoKGB0aGlzLiR7bm9kZS5rZXkubmFtZX1gKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goY3VycmVudENsYXNzKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyb3IubXNnID0gZmlsZU5hbWUgKyBcIjogXCIgKyBlcnJvci5tc2c7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHBhcnNlZEZpbGVzW2ZpbGVOYW1lXSA9IHtcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgIGltcG9ydHMsXG4gICAgICAgIGNsYXNzZXMsXG4gICAgICAgIGlucHV0LFxuICAgICAgICBhc3RcbiAgICB9O1xufVxuXG5mb3IgKGxldCBmaWxlTmFtZSBvZiBPYmplY3Qua2V5cyhwYXJzZWRGaWxlcykpIHtcbiAgICBsZXQge2NsYXNzZXMsIGltcG9ydHMsIGlucHV0fSA9IHBhcnNlZEZpbGVzW2ZpbGVOYW1lXTtcblxuICAgIHRyeSB7XG4gICAgICAgIGZvciAobGV0IGNsYXNzSW5mbyBvZiBjbGFzc2VzKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3NJbmZvLnN1cGVyQ2xhc3MgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBsZXQgc3VwZXJDbGFzcyA9IGZpbmQoY2xhc3NlcywgeyBuYW1lOiBjbGFzc0luZm8uc3VwZXJDbGFzcyB9KTtcbiAgICAgICAgICAgIGlmIChzdXBlckNsYXNzKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NJbmZvLmRlY2xhcmF0aW9ucyA9IGNsYXNzSW5mby5kZWNsYXJhdGlvbnMuY29uY2F0KHN1cGVyQ2xhc3MuZGVjbGFyYXRpb25zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBjbGFzcyBleHRlbmRzIGZyb20gb3RoZXIgZmlsZXMuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeyBpZDogaW1wb3J0SWQsIGZyb206IGZyb21JZCwgcmVzb2x2ZWQ6IHJlc29sdmVkRmlsZVBhdGggfSBvZiBpbXBvcnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbXBvcnRJZCA9PT0gY2xhc3NJbmZvLnN1cGVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbXBvcnRlZEZpbGUgPSBwYXJzZWRGaWxlc1tyZXNvbHZlZEZpbGVQYXRoXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGltcG9ydGVkRmlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbXBvcnRlZENsYXNzID0gZmluZChpbXBvcnRlZEZpbGUuY2xhc3NlcywgeyBuYW1lOiBmcm9tSWQgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1wb3J0ZWRDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW1wb3J0ZWREZWNsYXJhdGlvbnMgPSBpbXBvcnRlZENsYXNzLmRlY2xhcmF0aW9ucztcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc0luZm8uZGVjbGFyYXRpb25zID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzSW5mby5kZWNsYXJhdGlvbnMuY29uY2F0KGltcG9ydGVkRGVjbGFyYXRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCB7bmFtZSwgZGVjbGFyYXRpb25zfSBvZiBjbGFzc2VzKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgY2xhc3MgJHtuYW1lfSBpbiAke2ZpbGVOYW1lfSBkZWNsYXJlZDogJHtkZWNsYXJhdGlvbnMuam9pbihcIiwgXCIpfVxcbmApO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQge25hbWUsIGRlY2xhcmF0aW9ucywgdXNlZERlY2xhcmF0aW9uc30gb2YgY2xhc3Nlcykge1xuICAgICAgICAgICAgZm9yIChsZXQgdXNlZERlY2xhcmF0aW9uIG9mIHVzZWREZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVjbGFyYXRpb25zLmluZGV4T2YodXNlZERlY2xhcmF0aW9uLnZhbHVlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvYyA9IGFjb3JuLmdldExpbmVJbmZvKGlucHV0LCB1c2VkRGVjbGFyYXRpb24uc3RhcnQpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jYXRpb24gPSBgJHtmaWxlTmFtZX06JHtsb2MubGluZX06JHtsb2MuY29sdW1uICsgMX1gO1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChgJHtsb2NhdGlvbn06IFwiJHt1c2VkRGVjbGFyYXRpb24udmFsdWV9XCIgbm90IGluaXRpYWxpemVkIGluIGNvbnN0cnVjdG9yIG9mIGNsYXNzICR7bmFtZX1cXG5gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvci5tc2cgPSBmaWxlTmFtZSArIFwiOiBcIiArIGVycm9yLm1zZztcbiAgICB9XG59XG5cbmVycm9ycy5mb3JFYWNoKGVycm9yID0+IHByb2Nlc3Muc3RkZXJyLndyaXRlKGVycm9yKSk7XG4iXX0=