"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellscriptHandler = void 0;
const definition = __importStar(require("@/definition"));
const regex_1 = require("@/utils/regex");
const common_1 = require("./common");
class ShellscriptHandler extends common_1.CommonHandler {
    async pickLineCommentSlices(params) {
        this.verifyTaskID(params.taskID);
        const { lineComments } = await definition.getAvailableComments(params.editor.document.languageId);
        if (!lineComments || !lineComments.length) {
            return [];
        }
        const slices = [];
        const marks = lineComments.map(s => `${(0, regex_1.escape)(s)}+`).join('|');
        const exp = new RegExp(`(?<PRE>.?)(?<MARK>${marks}).*?(?:${regex_1.BR}${regex_1.SP}*\\1.*?)*(?:${regex_1.BR}|$)`, 'g');
        let block;
        while ((block = exp.exec(params.text))) {
            this.verifyTaskID(params.taskID);
            const start = params.offset + block.index;
            const end = start + block[0].length;
            if (params.processed.find(([pStart, pEnd]) => pStart <= start && end <= pEnd)) {
                // skip if already processed
                continue;
            }
            // store processed range
            params.processed.push([start, end]);
            if (block.groups.PRE === '$') {
                continue; // skip if line starts with $
            }
            slices.push({
                start,
                end,
                comment: block[0],
                mark: block.groups.MARK,
            });
        }
        return slices;
    }
}
exports.ShellscriptHandler = ShellscriptHandler;
//# sourceMappingURL=shellscript.js.map