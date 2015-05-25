"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = find;
function walk(object, callback) {
    if (object == null) return;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = Object.keys(object)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            if (typeof object[key] === "object") {
                walk(object[key], callback);
                callback(key, object[key]);
            }
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
}

function compare(object, matchObject) {
    var correct = false;

    if (!object || !matchObject) return false;

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = Object.keys(object)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key = _step2.value;

            if (Object.keys(matchObject).indexOf(key) !== -1) {
                if (typeof object[key] === "object" && typeof matchObject[key] === "object") {
                    if (Object.keys(matchObject[key]).length === 0) correct = true;else correct = compare(object[key], matchObject[key]);
                } else {
                    if (matchObject[key] !== object[key]) correct = false;
                    if (matchObject[key] === object[key]) correct = true;
                }
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

    return correct;
}

function find(object, matchObject, callback) {
    walk(object, function (key, value) {
        if (!value) return;

        if (compare(value, matchObject)) callback(key, value);
    });
}

module.exports = exports["default"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9nYWRnZXRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O3FCQThCd0IsSUFBSTtBQTlCNUIsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRTtBQUM1QixRQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUUsT0FBTzs7Ozs7O0FBQzNCLDZCQUFnQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyw4SEFBRTtnQkFBNUIsR0FBRzs7QUFDUixnQkFBSSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLEVBQUU7QUFDakMsb0JBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDNUIsd0JBQVEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDOUI7U0FDSjs7Ozs7Ozs7Ozs7Ozs7O0NBQ0o7O0FBRUQsU0FBUyxPQUFPLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRTtBQUNsQyxRQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7O0FBRXBCLFFBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxLQUFLLENBQUM7Ozs7Ozs7QUFFMUMsOEJBQWdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLG1JQUFFO2dCQUE1QixHQUFHOztBQUNSLGdCQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzlDLG9CQUFJLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLEVBQUU7QUFDekUsd0JBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FDMUQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3pELE1BQU07QUFDSCx3QkFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDdEQsd0JBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDO2lCQUN4RDthQUNKO1NBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxXQUFPLE9BQU8sQ0FBQztDQUNsQjs7QUFFYyxTQUFTLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRTtBQUN4RCxRQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUMvQixZQUFJLENBQUMsS0FBSyxFQUFFLE9BQU87O0FBRW5CLFlBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3pELENBQUMsQ0FBQztDQUNOIiwiZmlsZSI6ImdhZGdldHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiB3YWxrKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMob2JqZWN0KSkge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB3YWxrKG9iamVjdFtrZXldLCBjYWxsYmFjayk7XG4gICAgICAgICAgICBjYWxsYmFjayhrZXksIG9iamVjdFtrZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY29tcGFyZShvYmplY3QsIG1hdGNoT2JqZWN0KSB7XG4gICAgbGV0IGNvcnJlY3QgPSBmYWxzZTtcblxuICAgIGlmICghb2JqZWN0IHx8ICFtYXRjaE9iamVjdCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKG9iamVjdCkpIHtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG1hdGNoT2JqZWN0KS5pbmRleE9mKGtleSkgIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtYXRjaE9iamVjdFtrZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKG1hdGNoT2JqZWN0W2tleV0pLmxlbmd0aCA9PT0gMCkgY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZWxzZSBjb3JyZWN0ID0gY29tcGFyZShvYmplY3Rba2V5XSwgbWF0Y2hPYmplY3Rba2V5XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaE9iamVjdFtrZXldICE9PSBvYmplY3Rba2V5XSkgY29ycmVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaE9iamVjdFtrZXldID09PSBvYmplY3Rba2V5XSkgY29ycmVjdCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29ycmVjdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZmluZChvYmplY3QsIG1hdGNoT2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHdhbGsob2JqZWN0LCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm47XG5cbiAgICAgICAgaWYgKGNvbXBhcmUodmFsdWUsIG1hdGNoT2JqZWN0KSkgY2FsbGJhY2soa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG59XG4iXX0=