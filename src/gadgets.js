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

export default function find(object, matchObject, callback) {
    walk(object, function (key, value) {
        if (!value) return;

        if (compare(value, matchObject)) callback(key, value);
    });
}
