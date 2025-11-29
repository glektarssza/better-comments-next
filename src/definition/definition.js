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
exports.useLanguage = useLanguage;
exports.refresh = refresh;
exports.getAvailableComments = getAvailableComments;
const vscode = __importStar(require("vscode"));
const extConfig = __importStar(require("../configuration"));
const langs = __importStar(require("./modules"));
const cached = new Map();
function useLanguage(langId) {
    let lang = cached.get(langId);
    if (!lang) {
        lang = langs.useLanguage(langId);
        cached.set(langId, lang);
    }
    return lang;
}
/**
 * Refresh the language cache
 */
function refresh() {
    cached.clear();
    for (const extension of vscode.extensions.all) {
        const packageJSON = extension.packageJSON;
        for (const language of packageJSON?.contributes?.languages || []) {
            // if language is not defined, skip it
            if (!language || !language.id) {
                continue;
            }
            const lang = useLanguage(language.id);
            const configUri = language.configuration
                ? vscode.Uri.joinPath(extension.extensionUri, language.configuration)
                : undefined;
            lang.setConfigurationUri(configUri);
            const embeddedLanguages = lang.getEmbeddedLanguages();
            if (embeddedLanguages.size > 0) {
                // If already set embedded languages, skip it
                continue;
            }
            for (const grammar of packageJSON.contributes?.grammars || []) {
                if (grammar.language !== language.id || !grammar.embeddedLanguages) {
                    continue;
                }
                for (const embeddedLanguageCode of Object.values(grammar.embeddedLanguages)) {
                    embeddedLanguages.add(embeddedLanguageCode);
                }
            }
            lang.setEmbeddedLanguages(embeddedLanguages);
        }
    }
    const extConf = extConfig.getConfigurationFlatten();
    for (const language of extConf.languages) {
        const lang = useLanguage(language.id);
        if (language?.comments?.lineComment || language?.comments?.blockComment?.length) {
            lang.setComments(language.comments);
        }
        if (language.embeddedLanguages) {
            for (const embeddedLanguageCode of language.embeddedLanguages) {
                lang.addEmbeddedLanguage(embeddedLanguageCode);
            }
        }
        lang.setUseDocComment(language.useDocComment);
    }
}
/**
 * Gets the configuration information for the specified language
 */
async function getAvailableComments(langId) {
    const language = useLanguage(langId);
    let availableComments = language.getAvailableComments();
    if (availableComments) {
        return availableComments;
    }
    const lineComments = new Set();
    const blockComments = new Map();
    async function addCommentByLang(lang) {
        if (!lang) {
            return;
        }
        const comments = await lang.getComments();
        if (comments?.lineComment) {
            lineComments.add(comments.lineComment);
        }
        if (comments?.blockComment) {
            const key = `${comments.blockComment[0]}${comments.blockComment[1]}`;
            blockComments.set(key, comments.blockComment);
        }
    }
    await addCommentByLang(language);
    const embeddedLanguages = language.getEmbeddedLanguages();
    for (const embeddedLanguageCode of embeddedLanguages) {
        const lang = useLanguage(embeddedLanguageCode);
        await addCommentByLang(lang);
    }
    availableComments = {
        lineComments: Array.from(lineComments),
        blockComments: [...blockComments.values()],
    };
    language.setAvailableComments(availableComments);
    return availableComments;
}
//# sourceMappingURL=definition.js.map