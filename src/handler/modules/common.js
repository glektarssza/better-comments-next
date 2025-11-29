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
exports.CommonHandler = exports.Handler = void 0;
const configuration = __importStar(require("@/configuration"));
const definition = __importStar(require("@/definition"));
const regex_1 = require("@/utils/regex");
const utils_1 = require("@/utils/utils");
const vscode = __importStar(require("vscode"));
class Handler {
    languageId;
    triggerUpdateTimeout = undefined;
    taskID = '';
    constructor(languageId) {
        this.languageId = languageId;
    }
    async triggerUpdateDecorations({ timeout, ...params }) {
        if (this.triggerUpdateTimeout) {
            clearTimeout(this.triggerUpdateTimeout);
        }
        this.triggerUpdateTimeout = setTimeout(async () => {
            try {
                await this.updateDecorations(params);
            }
            catch (e) {
                if (!(e instanceof utils_1.CancelError)) {
                    throw e;
                }
            }
        }, timeout);
    }
    setDecorations(editor, tagRanges) {
        configuration.getTagDecorationTypes().forEach((td, tag) => {
            const ranges = tagRanges.get(tag) || [];
            editor.setDecorations(td, ranges);
            const documentUri = editor.document.uri.toString();
            for (const visibleEditor of vscode.window.visibleTextEditors) {
                if (visibleEditor === editor) {
                    continue;
                }
                if (visibleEditor.document.uri.toString() !== documentUri) {
                    continue;
                }
                visibleEditor.setDecorations(td, ranges);
            }
        });
    }
    // verify taskID is current task
    verifyTaskID(taskID) {
        if (taskID !== this.taskID) {
            throw new utils_1.CancelError('Task canceled');
        }
    }
}
exports.Handler = Handler;
class CommonHandler extends Handler {
    async updateDecorations(params) {
        const taskID = this.taskID = (0, utils_1.generateUUID)();
        const processed = [];
        const tagRanges = new Map();
        const { preloadLines, updateDelay } = configuration.getConfigurationFlatten();
        // # update for visible ranges
        for (const visibleRange of params.editor.visibleRanges) {
            this.verifyTaskID(taskID);
            const startLineIdx = Math.max(0, visibleRange.start.line - preloadLines);
            const startLine = params.editor.document.lineAt(startLineIdx);
            const endLineIdx = Math.min(params.editor.document.lineCount - 1, visibleRange.end.line + preloadLines);
            const endLine = params.editor.document.lineAt(endLineIdx);
            const range = new vscode.Range(startLine.range.start.line, 0, endLine.range.end.line, endLine.range.end.character);
            const text = params.editor.document.getText(range);
            const offset = params.editor.document.offsetAt(range.start);
            const pickParams = { editor: params.editor, text, offset, tagRanges, taskID, processed };
            await this.pickDocCommentDecorationOptions(pickParams);
            await this.pickBlockCommentDecorationOptions(pickParams);
            await this.pickLineCommentDecorationOptions(pickParams);
        }
        this.setDecorations(params.editor, tagRanges);
        setTimeout(async () => {
            // # update for full text
            this.verifyTaskID(taskID);
            const text = params.editor.document.getText();
            const pickParams = { editor: params.editor, text, offset: 0, tagRanges, taskID, processed };
            await this.pickDocCommentDecorationOptions(pickParams);
            await this.pickBlockCommentDecorationOptions(pickParams);
            await this.pickLineCommentDecorationOptions(pickParams);
            this.setDecorations(params.editor, tagRanges);
        }, updateDelay);
    }
    async pickLineCommentSlices(params) {
        this.verifyTaskID(params.taskID);
        const { lineComments } = await definition.getAvailableComments(params.editor.document.languageId);
        if (!lineComments || !lineComments.length) {
            return [];
        }
        const slices = [];
        const marks = lineComments.map(s => `${(0, regex_1.escape)(s)}+`).join('|');
        const exp = new RegExp(`(?<MARK>${marks}).*?(?:${regex_1.BR}${regex_1.SP}*\\1.*?)*(?:${regex_1.BR}|$)`, 'g');
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
            slices.push({
                start,
                end,
                comment: block[0],
                mark: block.groups.MARK,
            });
        }
        return slices;
    }
    async pickLineCommentDecorationOptions(params) {
        const slices = await this.pickLineCommentSlices(params);
        this.verifyTaskID(params.taskID);
        const multilineTags = configuration.getMultilineTagsEscaped();
        const lineTags = configuration.getLineTagsEscaped();
        const { fullHighlight, strict } = configuration.getConfigurationFlatten();
        for (const slice of slices) {
            this.verifyTaskID(params.taskID);
            const mark = (0, regex_1.escape)(slice.mark);
            const lineProcessed = [];
            if (multilineTags.length) {
                const m1Exp = (() => {
                    const tag = multilineTags.join('|');
                    return strict
                        ? new RegExp(`(?<PRE>${regex_1.SP}*${mark}${regex_1.SP})(?<TAG>${tag})(?<CONTENT>${regex_1.TAG_SUFFIX}${regex_1.ANY}*)`, 'gi')
                        : new RegExp(`(?<PRE>${regex_1.SP}*${mark}${regex_1.SP}?)(?<TAG>${tag})(?<CONTENT>${regex_1.ANY}*)`, 'gi');
                })();
                // Find the matched multiline
                let m1;
                while ((m1 = m1Exp.exec(slice.comment))) {
                    this.verifyTaskID(params.taskID);
                    const m1Start = slice.start + m1.index;
                    const tagName = m1.groups.TAG.toLowerCase();
                    // exec with remember last reg index, reset m2Exp avoid reg cache
                    const m2Exp = new RegExp(`(?<PRE>^|${regex_1.SP}*)(?<MARK>${mark})(?<SPACE>${regex_1.SP}*)(?<CONTENT>.*)`, 'gim');
                    // Find decoration range
                    let m2;
                    while ((m2 = m2Exp.exec(m1[0]))) {
                        this.verifyTaskID(params.taskID);
                        if (!m2.groups.CONTENT) {
                            if (m2.index >= m1[0].length) {
                                break; // index 已经移动到最后的位置，跳出循环
                            }
                            continue; // 空行
                        }
                        if (m2.index !== 0 && m2.groups.SPACE.length <= 1) {
                            m1Exp.lastIndex = m1.index + m2.index - 1;
                            break;
                        }
                        const m2StartSince = m1Start + m2.index;
                        const m2Start = fullHighlight
                            ? m2StartSince + m2.groups.PRE.length
                            : m2StartSince + m2.groups.PRE.length + m2.groups.MARK.length;
                        const m2End = m2StartSince + m2[0].length;
                        // store processed range
                        lineProcessed.push([m2Start, m2End]);
                        const startPos = params.editor.document.positionAt(m2Start);
                        const endPos = params.editor.document.positionAt(m2End);
                        const range = new vscode.Range(startPos, endPos);
                        const opt = params.tagRanges.get(tagName) || [];
                        opt.push(range);
                        params.tagRanges.set(tagName, opt);
                    }
                }
            }
            if (lineTags.length) {
                const lineExp = strict
                    ? new RegExp(`(?<PRE>(?:^|${regex_1.SP})${mark}${regex_1.SP})(?<TAG>${lineTags.join('|')})(?<CONTENT>${regex_1.TAG_SUFFIX}.*)`, 'gim')
                    : new RegExp(`(?<PRE>(?:^|${regex_1.SP})${mark}${regex_1.SP}?)(?<TAG>${lineTags.join('|')})(?<CONTENT>.*)`, 'gim');
                let line;
                while ((line = lineExp.exec(slice.comment))) {
                    this.verifyTaskID(params.taskID);
                    const lineStartSince = slice.start + line.index;
                    const lineStart = fullHighlight
                        ? lineStartSince
                        : lineStartSince + line.groups.PRE.length;
                    const lineEnd = lineStartSince + line[0].length;
                    if (lineProcessed.find(([pStart, pEnd]) => pStart <= lineStart && lineEnd <= pEnd)) {
                        // skip if already processed
                        continue;
                    }
                    // store processed range
                    lineProcessed.push([lineStart, lineEnd]);
                    const startPos = params.editor.document.positionAt(lineStart);
                    const endPos = params.editor.document.positionAt(lineEnd);
                    const range = new vscode.Range(startPos, endPos);
                    const tagName = line.groups.TAG.toLowerCase();
                    const opt = params.tagRanges.get(tagName) || [];
                    opt.push(range);
                    params.tagRanges.set(tagName, opt);
                }
            }
        }
    }
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
            const exp = new RegExp(`(?<PRE>(?:^|${regex_1.BR})\\s*)(?<START>${markStart})(?<CONTENT>${regex_1.ANY}*?)(?<END>${markEnd})`, 'g');
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
    async pickBlockCommentDecorationOptions(params) {
        const slices = await this.pickBlockCommentSlices(params);
        const multilineTags = configuration.getMultilineTagsEscaped();
        const { strict } = configuration.getConfigurationFlatten();
        for (const slice of slices) {
            this.verifyTaskID(params.taskID);
            let content = slice.content;
            let contentStart = slice.start + slice.marks[0].length;
            const pre = (0, regex_1.escape)(slice.marks[0].slice(-1));
            const suf = (0, regex_1.escape)(slice.marks[1].slice(0, 1));
            if (!!pre && !!suf) {
                const trimExp = new RegExp(`^(${pre}*)(${regex_1.ANY}*)${suf}*$`, 'i');
                const trimed = trimExp.exec(slice.content);
                if (!trimed) {
                    continue;
                }
                if (!trimed[2].length) {
                    continue;
                }
                content = trimed[2];
                contentStart += trimed[1].length;
            }
            const lineProcessed = [];
            if (multilineTags.length) {
                // exec with remember last reg index, reset m2Exp avoid reg cache
                const m1Exp = (() => {
                    const tag = multilineTags.join('|');
                    return strict
                        ? new RegExp(`(?<PRE>^(?<SPACE1>${regex_1.SP})|${regex_1.BR}(?<SPACE2>${regex_1.SP}*))(?<TAG>${tag})(?<CONTENT>${regex_1.TAG_SUFFIX}${regex_1.ANY}*)`, 'gi')
                        : new RegExp(`(?<PRE>^(?<SPACE1>${regex_1.SP}?)|${regex_1.BR}(?<SPACE2>${regex_1.SP}*))(?<TAG>${tag})(?<CONTENT>${regex_1.ANY}*)`, 'gi');
                })();
                // Find the matched multiline
                let m1;
                while ((m1 = m1Exp.exec(content))) {
                    this.verifyTaskID(params.taskID);
                    const m1Start = contentStart + m1.index;
                    const tagName = m1.groups.TAG.toLowerCase();
                    const m1Space = m1.groups.SPACE1 || m1.groups.SPACE2 || '';
                    const m2Exp = /(?<PRE>(?:\r?\n|^)(?<SPACE>[ \t]*))(?<CONTENT>.*)/g;
                    // Find decoration range
                    let m2;
                    while ((m2 = m2Exp.exec(m1[0]))) {
                        this.verifyTaskID(params.taskID);
                        if (!m2.groups.CONTENT) {
                            if (m2.index >= m1[0].length) {
                                break; // index 已经移动到最后的位置，跳出循环
                            }
                            continue; // 空行，继续下次匹配
                        }
                        const m2Space = m2.groups.SPACE || '';
                        if (m2.index !== 0 && m2Space.length <= m1Space.length) {
                            m1Exp.lastIndex = m1.index + m2.index - 1; // 行的缩进比tag的缩进少，跳出遍历，并修改 m1 的 lastIndex
                            break;
                        }
                        const m2StartSince = m1Start + m2.index;
                        const m2Start = m2StartSince + m2.groups.PRE.length;
                        const m2End = m2StartSince + m2[0].length;
                        // store processed range
                        lineProcessed.push([m2Start, m2End]);
                        const startPos = params.editor.document.positionAt(m2Start);
                        const endPos = params.editor.document.positionAt(m2End);
                        const range = new vscode.Range(startPos, endPos);
                        const opt = params.tagRanges.get(tagName) || [];
                        opt.push(range);
                        params.tagRanges.set(tagName, opt);
                    }
                }
            }
            const lineTags = configuration.getLineTagsEscaped();
            if (lineTags.length) {
                const lineExp = strict
                    ? new RegExp(`(?<PRE>^${regex_1.SP}|${regex_1.BR}${regex_1.SP}*)(?<TAG>${lineTags.join('|')})(?<CONTENT>${regex_1.TAG_SUFFIX}.*)`, 'gim')
                    : new RegExp(`(?<PRE>^${regex_1.SP}?|${regex_1.BR}${regex_1.SP}*)(?<TAG>${lineTags.join('|')})(?<CONTENT>.*)`, 'gim');
                // Find the matched line
                let line;
                while ((line = lineExp.exec(content))) {
                    this.verifyTaskID(params.taskID);
                    const lineStartSince = contentStart + line.index;
                    const lineStart = lineStartSince + line.groups.PRE.length;
                    const lineEnd = lineStartSince + line[0].length;
                    if (lineProcessed.find(([pStart, pEnd]) => pStart <= lineStart && lineEnd <= pEnd)) {
                        continue; // skip if already processed
                    }
                    // store processed range
                    lineProcessed.push([lineStart, lineEnd]);
                    const startPos = params.editor.document.positionAt(lineStart);
                    const endPos = params.editor.document.positionAt(lineEnd);
                    const range = new vscode.Range(startPos, endPos);
                    const tagName = line.groups.TAG.toLowerCase();
                    const opt = params.tagRanges.get(tagName) || [];
                    opt.push(range);
                    params.tagRanges.set(tagName, opt);
                }
            }
        }
    }
    async pickDocCommentSlices(params) {
        this.verifyTaskID(params.taskID);
        const lang = definition.useLanguage(params.editor.document.languageId);
        if (!lang.isUseDocComment()) {
            return [];
        }
        // const comments = await lang.getComments();
        // if (comments?.blockComment?.length) {
        //   prefix = comments.blockComment[0].slice(-1);
        //   marks = [comments.blockComment[0] + prefix, comments.blockComment[1]];
        // }
        const marks = ['/**', '*/'];
        const prefix = '*';
        const slices = [];
        const markStart = (0, regex_1.escape)(marks[0]);
        const markEnd = (0, regex_1.escape)(marks[1]);
        const blockExp = new RegExp(`(?<PRE>(?:^|${regex_1.BR})${regex_1.SP}*)(?<START>${markStart})(?<CONTENT>${regex_1.SP_BR}${regex_1.ANY}*?)(?<END>${markEnd})`, 'g');
        let block;
        while ((block = blockExp.exec(params.text))) {
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
                marks,
                prefix,
                comment: block.groups.START + block.groups.CONTENT + block.groups.END,
                content: block.groups.CONTENT,
            });
        }
        return slices;
    }
    async pickDocCommentDecorationOptions(params) {
        const slices = await this.pickDocCommentSlices(params);
        const lineProcessed = [];
        const multilineTags = configuration.getMultilineTagsEscaped();
        const lineTags = configuration.getLineTagsEscaped();
        const { strict } = configuration.getConfigurationFlatten();
        for (const slice of slices) {
            this.verifyTaskID(params.taskID);
            const pre = (0, regex_1.escape)(slice.prefix);
            if (multilineTags.length) {
                const m1Exp = (() => {
                    const tag = multilineTags.join('|');
                    return strict
                        ? new RegExp(`(?<PRE>^${regex_1.SP}|${regex_1.SP}*${pre}${regex_1.SP})(?<TAG>${tag})(?<CONTENT>${regex_1.TAG_SUFFIX}${regex_1.ANY}*)`, 'gi')
                        : new RegExp(`(?<PRE>^${regex_1.SP}?|${regex_1.SP}*${pre}${regex_1.SP}?)(?<TAG>${tag})(?<CONTENT>${regex_1.ANY}*)`, 'gi');
                })();
                // Find the matched multiline
                let m1;
                while ((m1 = m1Exp.exec(slice.content))) {
                    this.verifyTaskID(params.taskID);
                    const m1Start = slice.start + slice.marks[0].length + m1.index;
                    const tagName = m1.groups.TAG.toLowerCase();
                    // exec with remember last reg index, reset m2Exp avoid reg cache
                    const m2Exp = new RegExp(`(?<PRE>${regex_1.SP}*${pre}|^)(?<SPACE>${regex_1.SP}*)(?<CONTENT>.*)`, 'gim');
                    // Find decoration range
                    let m2;
                    while ((m2 = m2Exp.exec(m1.groups.TAG + m1.groups.CONTENT))) {
                        this.verifyTaskID(params.taskID);
                        if (!m2.groups.CONTENT) {
                            if (m2.index >= m1[0].length) {
                                break; // index 已经移动到最后的位置，跳出循环
                            }
                            continue; // 空行
                        }
                        const m2Space = m2.groups.SPACE || '';
                        if (m2.index !== 0 && m2Space.length <= 1) { // 必须大于1个空格缩进
                            m1Exp.lastIndex = m1.index + m2.index - 1;
                            break;
                        }
                        const m2StartSince = m1Start + m1.groups.PRE.length + m2.index;
                        const m2Start = m2StartSince + m2.groups.PRE.length;
                        const m2End = m2StartSince + m2[0].length;
                        // store processed range
                        lineProcessed.push([m2Start, m2End]);
                        const startPos = params.editor.document.positionAt(m2Start);
                        const endPos = params.editor.document.positionAt(m2End);
                        const range = new vscode.Range(startPos, endPos);
                        const opt = params.tagRanges.get(tagName) || [];
                        opt.push(range);
                        params.tagRanges.set(tagName, opt);
                    }
                }
            }
            if (lineTags.length) {
                const tags = lineTags.join('|');
                const linePreTag = `(?:(?:${regex_1.SP}*${regex_1.BR}${regex_1.SP}*${pre})|(?:${regex_1.SP}*${pre}))`;
                const lineExp = strict
                    ? new RegExp(`(?<PRE>${linePreTag}${regex_1.SP})(?<TAG>${tags})(?<CONTENT>${regex_1.TAG_SUFFIX}.*)`, 'gim')
                    : new RegExp(`(?<PRE>${linePreTag}${regex_1.SP}?)(?<TAG>${tags})(?<CONTENT>.*)`, 'gim');
                // Find the matched line
                let line;
                while ((line = lineExp.exec(slice.content))) {
                    this.verifyTaskID(params.taskID);
                    const lineStartSince = slice.start + slice.marks[0].length + line.index;
                    const lineStart = lineStartSince + line.groups.PRE.length;
                    const lineEnd = lineStartSince + line[0].length;
                    if (lineProcessed.find(range => range[0] <= lineStart && lineEnd <= range[1])) {
                        // skip if already processed
                        continue;
                    }
                    // store processed range
                    lineProcessed.push([lineStart, lineEnd]);
                    const startPos = params.editor.document.positionAt(lineStart);
                    const endPos = params.editor.document.positionAt(lineEnd);
                    const range = new vscode.Range(startPos, endPos);
                    const tagName = line.groups.TAG.toLowerCase();
                    const opt = params.tagRanges.get(tagName) || [];
                    opt.push(range);
                    params.tagRanges.set(tagName, opt);
                }
            }
        }
    }
}
exports.CommonHandler = CommonHandler;
//# sourceMappingURL=common.js.map