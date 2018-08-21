export function camelToDashes(s) {
    return (s.replace(/\.?([A-Z]+)/g, function (x, y) { return "-" + y.toLowerCase(); }).replace(/^-/, ""));
}
//# sourceMappingURL=util.js.map