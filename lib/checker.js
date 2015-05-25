"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
//# sourceMappingURL=data:application/json;base64,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Y2hlY2tlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZmluZCBmcm9tIFwibG9kYXNoLmZpbmRcIjtcbmltcG9ydCAqIGFzIGFjb3JuIGZyb20gXCJhY29yblwiO1xuaW1wb3J0IGltcG9ydFJlc29sdmVyIGZyb20gXCIuL2ltcG9ydFJlc29sdmVyXCI7XG5pbXBvcnQgd2Fsa0FTVCBmcm9tIFwiLi9nYWRnZXRzXCI7XG5cbmlmIChwcm9jZXNzLmFyZ3YubGVuZ3RoIDwgMykge1xuICAgIHByb2Nlc3Muc3RkZXJyLndyaXRlKGBVc2FnZTogbm9kZSAke3Byb2Nlc3MuYXJndlsxXX0gRklMRS4uLlxcbmApO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuLyplc2xpbnQtZGlzYWJsZSBuby1sb29wLWZ1bmMqL1xubGV0IGVycm9ycyA9IFtdO1xubGV0IHBhcnNlZEZpbGVzID0ge307XG5mb3IgKGxldCBpID0gMjsgaSA8IHByb2Nlc3MuYXJndi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5ub3JtYWxpemUocHJvY2Vzcy5hcmd2W2ldKTtcbiAgICBjb25zdCBpbnB1dCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlTmFtZSkudG9TdHJpbmcoKS5yZXBsYWNlKC9eIyEuKiQvbWcsIFwiXCIpO1xuXG4gICAgbGV0IGFzdDtcbiAgICB0cnkge1xuICAgICAgICBhc3QgPSBhY29ybi5wYXJzZShpbnB1dCwgeyBlY21hVmVyc2lvbjogNiwgc291cmNlVHlwZTogXCJtb2R1bGVcIiB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvci5tc2cgPSBmaWxlTmFtZSArIFwiOiBcIiArIGVycm9yLm1zZztcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgbGV0IGltcG9ydHMgPSBbXTtcbiAgICBsZXQgY2xhc3NlcyA9IFtdO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgd2Fsa0FTVChhc3QsIHsgdHlwZTogXCJJbXBvcnREZWNsYXJhdGlvblwiIH0sIGZ1bmN0aW9uIChrZXksIG5vZGUpIHtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZCA9IGltcG9ydFJlc29sdmVyKGZpbGVOYW1lLCBub2RlLnNvdXJjZS52YWx1ZSk7XG5cbiAgICAgICAgICAgIGlmIChyZXNvbHZlZC5pbmRleE9mKFwibm9kZV9tb2R1bGVzXCIpICE9PSAtMSkgcmV0dXJuOyAvLyBTa2lwIGltcG9ydHMgZnJvbSBub2RlX21vZHVsZXMgb3Igbm9kZS1zcGVjaWZpYyBjbGFzc2VzXG5cbiAgICAgICAgICAgIGxldCBsb2NhbElkcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgc3BlY2lmaWVyIG9mIG5vZGUuc3BlY2lmaWVycykge1xuICAgICAgICAgICAgICAgIGxvY2FsSWRzLnB1c2goc3BlY2lmaWVyLmxvY2FsLm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFzcGVjaWZpZXIuaW1wb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyLmltcG9ydGVkID0gc3BlY2lmaWVyLmxvY2FsOyAvLyBYWFg6IExvb2sgaW50byBpbXBsaWNhdGlvbnMgb2Ygd2hhdCB0aGlzIG1lYW5zXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW1wb3J0cy5wdXNoKHsgaWQ6IHNwZWNpZmllci5sb2NhbC5uYW1lLCBmcm9tOiBzcGVjaWZpZXIuaW1wb3J0ZWQubmFtZSwgcmVzb2x2ZWQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdhbGtBU1QoYXN0LCB7IHR5cGU6IFwiQ2xhc3NEZWNsYXJhdGlvblwiIH0sIGZ1bmN0aW9uIChrZXksIG5vZGUpIHtcbiAgICAgICAgICAgIGxldCBjbGFzc05hbWUgPSBub2RlLmlkLm5hbWU7XG4gICAgICAgICAgICBsZXQgY3VycmVudENsYXNzID0ge307XG5cbiAgICAgICAgICAgIGN1cnJlbnRDbGFzcy5uYW1lID0gY2xhc3NOYW1lO1xuICAgICAgICAgICAgY3VycmVudENsYXNzLnN1cGVyQ2xhc3MgPSBub2RlLnN1cGVyQ2xhc3MgPyBub2RlLnN1cGVyQ2xhc3MubmFtZSA6IG51bGw7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3MuZGVjbGFyYXRpb25zID0gW107IC8vIHN0cmluZ3M6IHRoaXMudmFyX2lkXG4gICAgICAgICAgICBjdXJyZW50Q2xhc3MudXNlZERlY2xhcmF0aW9ucyA9IFtdOyAvLyBvYmplY3RzOiB7IHN0YXJ0OiBub2RlLnN0YXJ0LCBkZWNsYXJhdGlvbiB9XG5cbiAgICAgICAgICAgIHdhbGtBU1Qobm9kZS5ib2R5LmJvZHksIHsgdHlwZTogXCJNZXRob2REZWZpbml0aW9uXCIgfSwgZnVuY3Rpb24gKGtleSwgbm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzQ29uc3RydWN0b3IgPSBub2RlLmtpbmQgPT09IFwiY29uc3RydWN0b3JcIjtcblxuICAgICAgICAgICAgICAgIHdhbGtBU1Qobm9kZSwgeyB0eXBlOiBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiLCBib2R5OiB7IHR5cGU6IFwiTWVtYmVyRXhwcmVzc2lvblwiIH0gfSwgZnVuY3Rpb24gKGtleSwgbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB3YWxrQVNUKG5vZGUuYm9keSwgeyB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIiB9LCBmdW5jdGlvbiAoa2V5LCBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5vYmplY3QudHlwZSA9PT0gXCJUaGlzRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRlY2xhcmF0aW9uID0gaW5wdXQuc2xpY2Uobm9kZS5zdGFydCwgbm9kZS5lbmQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2Fubm90IGhhbmRsZSBkeW5hbWljIGdldHRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL3RoaXNcXFsuKj9cXF0vLnRlc3QoZGVjbGFyYXRpb24pKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IHRvIGhhbmRsZSB0aGlzLl92YXJbZHluYW1pY10gYnkgc3RyaXBwaW5nIGR5bmFtaWMgcG9ydGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvdGhpc1xcLi4qP1xcWy4qP1xcXS8udGVzdChkZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjbGFyYXRpb24gPSBkZWNsYXJhdGlvbi5yZXBsYWNlKC9eKC4qPylcXFsuKj8vLCAvJDEvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudENsYXNzLmRlY2xhcmF0aW9ucy5pbmRleE9mKGRlY2xhcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDbGFzcy5kZWNsYXJhdGlvbnMucHVzaChkZWNsYXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudENsYXNzLnVzZWREZWNsYXJhdGlvbnMuaW5kZXhPZihkZWNsYXJhdGlvbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MudXNlZERlY2xhcmF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogbm9kZS5zdGFydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3MuZGVjbGFyYXRpb25zLnB1c2goYHRoaXMuJHtub2RlLmtleS5uYW1lfWApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNsYXNzZXMucHVzaChjdXJyZW50Q2xhc3MpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJvci5tc2cgPSBmaWxlTmFtZSArIFwiOiBcIiArIGVycm9yLm1zZztcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgcGFyc2VkRmlsZXNbZmlsZU5hbWVdID0ge1xuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgaW1wb3J0cyxcbiAgICAgICAgY2xhc3NlcyxcbiAgICAgICAgaW5wdXQsXG4gICAgICAgIGFzdFxuICAgIH07XG59XG5cbmZvciAobGV0IGZpbGVOYW1lIG9mIE9iamVjdC5rZXlzKHBhcnNlZEZpbGVzKSkge1xuICAgIGxldCB7Y2xhc3NlcywgaW1wb3J0cywgaW5wdXR9ID0gcGFyc2VkRmlsZXNbZmlsZU5hbWVdO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgZm9yIChsZXQgY2xhc3NJbmZvIG9mIGNsYXNzZXMpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc0luZm8uc3VwZXJDbGFzcyA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGxldCBzdXBlckNsYXNzID0gZmluZChjbGFzc2VzLCB7IG5hbWU6IGNsYXNzSW5mby5zdXBlckNsYXNzIH0pO1xuICAgICAgICAgICAgaWYgKHN1cGVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjbGFzc0luZm8uZGVjbGFyYXRpb25zID0gY2xhc3NJbmZvLmRlY2xhcmF0aW9ucy5jb25jYXQoc3VwZXJDbGFzcy5kZWNsYXJhdGlvbnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIGNsYXNzIGV4dGVuZHMgZnJvbSBvdGhlciBmaWxlcy5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCB7IGlkOiBpbXBvcnRJZCwgZnJvbTogZnJvbUlkLCByZXNvbHZlZDogcmVzb2x2ZWRGaWxlUGF0aCB9IG9mIGltcG9ydHMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGltcG9ydElkID09PSBjbGFzc0luZm8uc3VwZXJDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGltcG9ydGVkRmlsZSA9IHBhcnNlZEZpbGVzW3Jlc29sdmVkRmlsZVBhdGhdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW1wb3J0ZWRGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGltcG9ydGVkQ2xhc3MgPSBmaW5kKGltcG9ydGVkRmlsZS5jbGFzc2VzLCB7IG5hbWU6IGZyb21JZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbXBvcnRlZENsYXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbXBvcnRlZERlY2xhcmF0aW9ucyA9IGltcG9ydGVkQ2xhc3MuZGVjbGFyYXRpb25zO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzSW5mby5kZWNsYXJhdGlvbnMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NJbmZvLmRlY2xhcmF0aW9ucy5jb25jYXQoaW1wb3J0ZWREZWNsYXJhdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IHtuYW1lLCBkZWNsYXJhdGlvbnN9IG9mIGNsYXNzZXMpIHtcbiAgICAgICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGBjbGFzcyAke25hbWV9IGluICR7ZmlsZU5hbWV9IGRlY2xhcmVkOiAke2RlY2xhcmF0aW9ucy5qb2luKFwiLCBcIil9XFxuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCB7bmFtZSwgZGVjbGFyYXRpb25zLCB1c2VkRGVjbGFyYXRpb25zfSBvZiBjbGFzc2VzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB1c2VkRGVjbGFyYXRpb24gb2YgdXNlZERlY2xhcmF0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChkZWNsYXJhdGlvbnMuaW5kZXhPZih1c2VkRGVjbGFyYXRpb24udmFsdWUpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbG9jID0gYWNvcm4uZ2V0TGluZUluZm8oaW5wdXQsIHVzZWREZWNsYXJhdGlvbi5zdGFydCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2NhdGlvbiA9IGAke2ZpbGVOYW1lfToke2xvYy5saW5lfToke2xvYy5jb2x1bW4gKyAxfWA7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKGAke2xvY2F0aW9ufTogXCIke3VzZWREZWNsYXJhdGlvbi52YWx1ZX1cIiBub3QgaW5pdGlhbGl6ZWQgaW4gY29uc3RydWN0b3Igb2YgY2xhc3MgJHtuYW1lfVxcbmApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGVycm9yLm1zZyA9IGZpbGVOYW1lICsgXCI6IFwiICsgZXJyb3IubXNnO1xuICAgIH1cbn1cblxuZXJyb3JzLmZvckVhY2goZXJyb3IgPT4gcHJvY2Vzcy5zdGRlcnIud3JpdGUoZXJyb3IpKTtcbiJdfQ==