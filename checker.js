import fs from "fs";
import uniq from "lodash.uniq";
import * as acorn from "acorn";

if (process.argv.length < 3) {
    process.stderr.write(`Usage: node ${process.argv[1]} FILE...\n`);
    process.exit(1);
}

function walk(object, callback) {
    if (object == null) return;
    for (let key of Object.keys(object)) {
        if (typeof object[key] === "object") {
            walk(object[key], callback);
            callback(key, object[key]);
        }
    }
}

function compare(object, matchObject) {
    let correct = false;

    if (!object || !matchObject) return false;

    for (let key of Object.keys(object)) {
        if (Object.keys(matchObject).indexOf(key) !== -1) {
            if (typeof object[key] === "object" && typeof matchObject[key] === "object") {
                if (Object.keys(matchObject[key]).length === 0) correct = true;
                else correct = compare(object[key], matchObject[key]);
            } else {
                if (matchObject[key] !== object[key]) correct = false;
                if (matchObject[key] === object[key]) correct = true;
            }
        }
    }

    return correct;
}

function find(object, matchObject, callback) {
    walk(object, function (key, value) {
        if (!value) return;

        if (compare(value, matchObject)) callback(key, value);
    });
}

/*eslint-disable no-loop-func*/
let errors = [];
for (let i = 2; i < process.argv.length; i++) {
    let fileName = process.argv[i];
    let input = fs.readFileSync(fileName).toString().replace(/^#!.*$/mg, "");

    try {
        let parsed = acorn.parse(input, { ecmaVersion: 6, sourceType: "module" });

        let classes = {};

        find(parsed, { type: "ClassDeclaration" }, function (key, value) {
            let className = value.id.name;
            classes[className] = {};
            let currentClass = classes[className];

            currentClass.superClass = value.superClass ? value.superClass.name : null;
            currentClass.children = [];
            currentClass.declarations = [];

            find(value.body.body, { type: "MethodDefinition" }, function (key, value) {
                if (value.kind === "constructor") {
                    find(value, { type: "FunctionExpression", body: { type: "MemberExpression" } }, function (key, value) {
                        find(value.body, { type: "MemberExpression" }, function (key, value) {
                            if (value.object.type === "ThisExpression") {
                                let declaration = input.slice(value.start, value.end);
                                if (currentClass.declarations.indexOf(declaration) === -1) {
                                    currentClass.declarations.push(declaration);
                                }
                            }
                        });
                    });
                }
                currentClass.declarations.push(`this.${value.key.name}`);
            });
        });

        for (let className of Object.keys(classes)) {
            let currentClass = classes[className];
            let superClass = classes[currentClass.superClass];

            if (!superClass) continue;

            superClass.children.push(currentClass);
        }

        for (let className of Object.keys(classes)) {
            let currentClass = classes[className];
            let parentDeclarations = currentClass.declarations;

            for (let childClass of currentClass.children) {
                childClass.declarations.push(...parentDeclarations);
                childClass.declarations = uniq(childClass.declarations);
            }
        }

        for (let className of Object.keys(classes)) {
            let currentClass = classes[className];
            let extendsStr = currentClass.superClass ? ` extends ${currentClass.superClass}` : "";
            process.stdout.write(`Class declaration found: ${className}${extendsStr}\n`);
            process.stdout.write(`\tDeclarations:\n\t  ${currentClass.declarations.join("\n\t  ")}\n`);
        }

        find(parsed, { type: "ClassDeclaration" }, function (key, value) {
            let className = value.id.name;
            let currentClass = classes[className];

            find(value.body.body, { type: "MethodDefinition", value: { type: "FunctionExpression" } }, function (key, value) {
                find(value.value.body, { type: "MemberExpression" }, function (key, value) {
                    if (value.object.type === "ThisExpression") {
                        let declaration = input.slice(value.start, value.end);

                        if (/this\[.*?\]/.test(declaration)) return; // Cannot handle dynamic getting

                        // Attempt to handle this._var[dynamic] by stripping dynamic portion
                        if (/this\..*?\[.*?\]/.test(declaration)) {
                            declaration = declaration.replace(/^(.*?)\[.*?/, /$1/);
                        }

                        if (currentClass.declarations.indexOf(declaration) === -1) {
                            let loc = acorn.getLineInfo(input, value.start);
                            let location = `${fileName}:${loc.line}:${loc.column + 1}`;
                            errors.push(`${location}: "${declaration}" not initialized in constructor of class ${className}\n`);
                        }
                    }
                });
            });
        });
    } catch (e) {
        process.stderr.write(`When processing ${process.argv[i]} caught error: `);
        throw e;
    }
}

errors.forEach(error => process.stderr.write(error));
