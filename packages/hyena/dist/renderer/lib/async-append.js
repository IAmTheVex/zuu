var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { directive, NodePart } from "../core";
export const asyncAppend = (value, mapper) => directive((part) => __awaiter(this, void 0, void 0, function* () {
    var e_1, _a;
    if (value === part._previousValue) {
        return;
    }
    part._previousValue = value;
    let itemPart;
    let i = 0;
    try {
        for (var value_1 = __asyncValues(value), value_1_1; value_1_1 = yield value_1.next(), !value_1_1.done;) {
            let v = yield value_1_1.value;
            if (i === 0) {
                part.clear();
            }
            if (part._previousValue !== value) {
                break;
            }
            if (mapper !== undefined) {
                v = mapper(v, i);
            }
            let itemStartNode = part.startNode;
            if (itemPart !== undefined) {
                itemStartNode = document.createTextNode("");
                itemPart.endNode = itemStartNode;
                part.endNode.parentNode.insertBefore(itemStartNode, part.endNode);
            }
            itemPart = new NodePart(part.instance, itemStartNode, part.endNode);
            itemPart.setValue(v);
            i++;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (value_1_1 && !value_1_1.done && (_a = value_1.return)) yield _a.call(value_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}));
//# sourceMappingURL=async-append.js.map