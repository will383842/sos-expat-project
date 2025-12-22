"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLang = void 0;
function resolveLang(input) {
    if (!input)
        return "en";
    const s = String(input).toLowerCase();
    return s.startsWith("fr") ? "fr-FR" : "en";
}
exports.resolveLang = resolveLang;
//# sourceMappingURL=i18n.js.map