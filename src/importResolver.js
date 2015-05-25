import path from "path";

export default function resolveImport(filePath, importString) {
    if (importString.indexOf(".") === 0) {
        let joinedPath = path.join(path.dirname(filePath), importString + ".js");
        return path.normalize(joinedPath);
    } else {
        return path.join("node_modules", importString);
    }
}
