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
exports.ReactHandler = void 0;
const definition = __importStar(require("@/definition"));
const regex_1 = require("@/utils/regex");
const common_1 = require("./common");
class ReactHandler extends common_1.CommonHandler {
    async pickBlockCommentSlices(params) {
        this.verifyTaskID(params.taskID);
        const { blockComments } = await definition.getAvailableComments(params.editor.document.languageId);
        if (!blockComments || !blockComments.length) {
            return [];
        }
        const slices = [];
        for (const marks of blockComments) {
            this.verifyTaskID(params.taskID);
            const markStart = (0, regex_1.escape)(marks[0]);
            const markEnd = (0, regex_1.escape)(marks[1]);
            const exp = new RegExp(`(?<PRE>(?:^|${regex_1.BR})\\s*|\{\\s*)(?<START>${markStart})(?<CONTENT>${regex_1.ANY}*?)(?<END>${markEnd})`, 'g');
            let block;
            while ((block = exp.exec(params.text))) {
                this.verifyTaskID(params.taskID);
                const start = params.offset + block.index + block.groups.PRE.length;
                const end = params.offset + block.index + block[0].length;
                if (params.processed.find(([pStart, pEnd]) => pStart <= start && end <= pEnd)) {
                    // skip if already processed
                    continue;
                }
                // store processed range
                params.processed.push([start, end]);
                slices.push({
                    start,
                    end,
                    comment: block[0],
                    content: block.groups.CONTENT,
                    marks,
                });
            }
        }
        return slices;
    }
}
exports.ReactHandler = ReactHandler;
//# sourceMappingURL=react.js.map