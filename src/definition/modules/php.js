"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHPLanguage = void 0;
const common_1 = require("./common");
class PHPLanguage extends common_1.Language {
    setAvailableComments(comments) {
        comments.lineComments.push('#');
        return super.setAvailableComments(comments);
    }
}
exports.PHPLanguage = PHPLanguage;
//# sourceMappingURL=php.js.map