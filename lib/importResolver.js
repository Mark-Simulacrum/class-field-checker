"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = resolveImport;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

function resolveImport(filePath, importString) {
    if (importString.indexOf(".") === 0) {
        var joinedPath = _path2["default"].join(_path2["default"].dirname(filePath), importString + ".js");
        return _path2["default"].normalize(joinedPath);
    } else {
        return _path2["default"].join("node_modules", importString);
    }
}

module.exports = exports["default"];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbXBvcnRSZXNvbHZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztxQkFFd0IsYUFBYTs7OztvQkFGcEIsTUFBTTs7OztBQUVSLFNBQVMsYUFBYSxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUU7QUFDMUQsUUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQyxZQUFJLFVBQVUsR0FBRyxrQkFBSyxJQUFJLENBQUMsa0JBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQztBQUN6RSxlQUFPLGtCQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNyQyxNQUFNO0FBQ0gsZUFBTyxrQkFBSyxJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ2xEO0NBQ0oiLCJmaWxlIjoiaW1wb3J0UmVzb2x2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZXNvbHZlSW1wb3J0KGZpbGVQYXRoLCBpbXBvcnRTdHJpbmcpIHtcbiAgICBpZiAoaW1wb3J0U3RyaW5nLmluZGV4T2YoXCIuXCIpID09PSAwKSB7XG4gICAgICAgIGxldCBqb2luZWRQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShmaWxlUGF0aCksIGltcG9ydFN0cmluZyArIFwiLmpzXCIpO1xuICAgICAgICByZXR1cm4gcGF0aC5ub3JtYWxpemUoam9pbmVkUGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbihcIm5vZGVfbW9kdWxlc1wiLCBpbXBvcnRTdHJpbmcpO1xuICAgIH1cbn1cbiJdfQ==