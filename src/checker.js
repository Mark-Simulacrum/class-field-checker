import "babel-core/polyfill";
import fs from "fs";
import path from "path";
import find from "lodash.find";
import * as acorn from "acorn";
import importResolver from "./importResolver";
import walkAST from "./gadgets";

if (process.argv.length < 3) {
    process.stderr.write(`Usage: node ${process.argv[1]} FILE...\n`);
    process.exit(1);
}

/*eslint-disable no-loop-func*/
let errors = [];
let parsedFiles = {};
for (let i = 2; i < process.argv.length; i++) {
    const fileName = path.normalize(process.argv[i]);
    const input = fs.readFileSync(fileName).toString().replace(/^#!.*$/mg, "");

    let ast;
    try {
        ast = acorn.parse(input, { ecmaVersion: 6, sourceType: "module" });
    } catch (error) {
        error.msg = fileName + ": " + error.msg;
        throw error;
    }

    let imports = [];
    let classes = [];

    try {
        walkAST(ast, { type: "ImportDeclaration" }, function (key, node) {
            let resolved = importResolver(fileName, node.source.value);

            if (resolved.indexOf("node_modules") !== -1) return; // Skip imports from node_modules or node-specific classes

            let localIds = [];
            for (let specifier of node.specifiers) {
                localIds.push(specifier.local.name);

                if (!specifier.imported) {
                    specifier.imported = specifier.local; // XXX: Look into implications of what this means
                }

                imports.push({ id: specifier.local.name, from: specifier.imported.name, resolved });
            }
        });

        walkAST(ast, { type: "ClassDeclaration" }, function (key, node) {
            let className = node.id.name;
            let currentClass = {};

            currentClass.name = className;
            currentClass.superClass = node.superClass ? node.superClass.name : null;
            currentClass.declarations = []; // strings: this.var_id
            currentClass.usedDeclarations = []; // objects: { start: node.start, declaration }

            walkAST(node.body.body, { type: "MethodDefinition" }, function (key, node) {
                const isConstructor = node.kind === "constructor";

                walkAST(node, { type: "FunctionExpression", body: { type: "MemberExpression" } }, function (key, node) {
                    walkAST(node.body, { type: "MemberExpression" }, function (key, node) {
                        if (node.object.type === "ThisExpression") {
                            let declaration = input.slice(node.start, node.end);

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
                currentClass.declarations.push(`this.${node.key.name}`);
            });

            classes.push(currentClass);
        });
    } catch (error) {
        error.msg = fileName + ": " + error.msg;
        throw error;
    }

    parsedFiles[fileName] = {
        fileName,
        imports,
        classes,
        input,
        ast
    };
}

for (let fileName of Object.keys(parsedFiles)) {
    let {classes, imports, input} = parsedFiles[fileName];

    try {
        for (let classInfo of classes) {
            if (classInfo.superClass === null) continue;

            let superClass = find(classes, { name: classInfo.superClass });
            if (superClass) {
                classInfo.declarations = classInfo.declarations.concat(superClass.declarations);
            } else {
                // Resolve class extends from other files.
                for (let { id: importId, from: fromId, resolved: resolvedFilePath } of imports) {
                    if (importId === classInfo.superClass) {
                        let importedFile = parsedFiles[resolvedFilePath];

                        if (importedFile) {
                            let importedClass = find(importedFile.classes, { name: fromId });

                            if (importedClass) {
                                let importedDeclarations = importedClass.declarations;

                                classInfo.declarations =
                                    classInfo.declarations.concat(importedDeclarations);
                            }
                        }
                    }
                }
            }
        }

        for (let {name, declarations} of classes) {
            process.stdout.write(`class ${name} in ${fileName} declared: ${declarations.join(", ")}\n`);
        }

        for (let {name, declarations, usedDeclarations} of classes) {
            for (let usedDeclaration of usedDeclarations) {
                if (declarations.indexOf(usedDeclaration.value) === -1) {
                    let loc = acorn.getLineInfo(input, usedDeclaration.start);
                    let location = `${fileName}:${loc.line}:${loc.column + 1}`;
                    errors.push(`${location}: "${usedDeclaration.value}" not initialized in constructor of class ${name}\n`);
                }
            }
        }
    } catch (error) {
        error.msg = fileName + ": " + error.msg;
    }
}

errors.forEach(error => process.stderr.write(error));
