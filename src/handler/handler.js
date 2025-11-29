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
exports.triggerUpdateDecorations = triggerUpdateDecorations;
const configuration = __importStar(require("../configuration"));
const common_1 = require("./modules/common");
const plaintext_1 = require("./modules/plaintext");
const react_1 = require("./modules/react");
const shellscript_1 = require("./modules/shellscript");
const cached = new Map();
function newHandler(languageId) {
    switch (languageId) {
        case 'javascriptreact':
        case 'typescriptreact':
            return new react_1.ReactHandler(languageId);
        case 'shellscript':
            return new shellscript_1.ShellscriptHandler(languageId);
        case 'plaintext':
            return new plaintext_1.PlainTextHandler(languageId);
        default:
            return new common_1.CommonHandler(languageId);
    }
}
function useHandler(languageId) {
    let handler = cached.get(languageId);
    if (!handler) {
        handler = newHandler(languageId);
        cached.set(languageId, handler);
    }
    return handler;
}
function triggerUpdateDecorations(params) {
    const configuratgion = configuration.getConfigurationFlatten();
    return useHandler(params.editor.document.languageId).triggerUpdateDecorations({ ...params, timeout: configuratgion.updateDelay });
}
//# sourceMappingURL=handler.js.map