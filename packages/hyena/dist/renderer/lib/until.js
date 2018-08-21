import { directive } from "../core";
export const until = (promise, defaultContent) => directive((part) => {
    part.setValue(defaultContent);
    part.setValue(promise);
});
//# sourceMappingURL=until.js.map