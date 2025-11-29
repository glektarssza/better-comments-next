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
exports.CommonLanguage = exports.Language = void 0;
const log = __importStar(require("@/log"));
const str_1 = require("@/utils/str");
const json5_1 = require("json5");
const vscode = __importStar(require("vscode"));
class Language {
    id;
    configurationUri;
    configuration;
    comments;
    embeddedLanguages;
    availableComments;
    useDocComment = true;
    constructor(id) {
        this.id = id;
        this.embeddedLanguages = new Set();
    }
    /**
     * Set configuration uri
     */
    setConfigurationUri(configurationUri) {
        this.configurationUri = configurationUri;
        return this;
    }
    /**
     * Check if config uri already setup
     */
    hasConfigurationUri() {
        return !!this.configurationUri;
    }
    /**
     * Get language configuration
     */
    async getConfiguration() {
        if (this.configuration) {
            return this.configuration;
        }
        if (!this.configurationUri) {
            return undefined;
        }
        try {
            // Read file
            const raw = await vscode.workspace.fs.readFile(this.configurationUri);
            const content = raw.toString();
            // use json5, because the config can contains comments
            this.configuration = (0, json5_1.parse)(content);
            return this.configuration;
        }
        catch (error) {
            log.error(`Parse configuration file ${this.configurationUri.toString()} failed: ${error.message}`);
            return undefined;
        }
    }
    setComments(comments) {
        this.comments = comments;
        return this;
    }
    /**
     * Get language comments rules
     */
    async getComments() {
        if (!this.comments) {
            const config = await this.getConfiguration();
            this.comments = {};
            if (config && config.comments) {
                const { lineComment, blockComment } = config.comments;
                if ((0, str_1.isString)(lineComment)) {
                    this.comments.lineComment = lineComment;
                }
                if (Array.isArray(blockComment) && blockComment.length === 2 && (0, str_1.isString)(blockComment[0]) && (0, str_1.isString)(blockComment[1])) {
                    this.comments.blockComment = blockComment;
                }
            }
            else {
                this.comments = getDefaultComments(this.id);
            }
        }
        return this.comments;
    }
    /**
     * Add embedded language id
     */
    addEmbeddedLanguage(langId) {
        this.embeddedLanguages.add(langId);
        return this;
    }
    /**
     * Get embedded language ids
     */
    getEmbeddedLanguages() {
        return this.embeddedLanguages;
    }
    /**
     * Replace embeddedLanguages
     */
    setEmbeddedLanguages(embeddedLanguages) {
        this.embeddedLanguages = new Set(embeddedLanguages);
        return this;
    }
    /**
     * Get avaiable comments
     */
    getAvailableComments() {
        return this.availableComments;
    }
    /**
     * Set avaiable comments
     */
    setAvailableComments(comments) {
        this.availableComments = comments;
        if (comments.lineComments.length) {
            log.info(`(${this.id}) LINE COMMENTS: ${comments.lineComments.join('、')}`);
        }
        if (comments.blockComments.length) {
            log.info(`(${this.id}) BLOCK COMMENTS: ${comments.blockComments.map(c => `${c[0]} ${c[1]}`).join('、')}`);
        }
        return this;
    }
    setUseDocComment(useDocComment) {
        this.useDocComment = useDocComment;
        return this;
    }
    isUseDocComment() {
        return this.useDocComment;
    }
}
exports.Language = Language;
class CommonLanguage extends Language {
}
exports.CommonLanguage = CommonLanguage;
function getDefaultComments(languageCode) {
    switch (languageCode) {
        case 'asciidoc':
            return { lineComment: '//', blockComment: ['////', '////'] };
        case 'apex':
        case 'javascript':
        case 'javascriptreact':
        case 'typescript':
        case 'typescriptreact':
        case 'al':
        case 'c':
        case 'cpp':
        case 'csharp':
        case 'dart':
        case 'flax':
        case 'fsharp':
        case 'go':
        case 'groovy':
        case 'haxe':
        case 'java':
        case 'jsonc':
        case 'kotlin':
        case 'less':
        case 'pascal':
        case 'objectpascal':
        case 'php':
        case 'rust':
        case 'scala':
        case 'sass':
        case 'scss':
        case 'stylus':
        case 'swift':
        case 'verilog':
            return { lineComment: '//', blockComment: ['/*', '*/'] };
        case 'css':
            return { blockComment: ['/*', '*/'] };
        case 'coffeescript':
        case 'dockerfile':
        case 'gdscript':
        case 'graphql':
        case 'julia':
        case 'makefile':
        case 'perl':
        case 'perl6':
        case 'puppet':
        case 'r':
        case 'ruby':
        case 'shellscript':
        case 'tcl':
        case 'yaml':
            return { lineComment: '#' };
        case 'elixir':
        case 'python':
            return { lineComment: '#', blockComment: ['"""', '"""'] };
        case 'nim':
            return { lineComment: '#', blockComment: ['#[', ']#'] };
        case 'powershell':
            return { lineComment: '#', blockComment: ['<#', '#>'] };
        case 'ada':
        case 'hive-sql':
        case 'pig':
        case 'plsql':
        case 'sql':
            return { lineComment: '--' };
        case 'lua':
            return { lineComment: '--', blockComment: ['--[[', ']]'] };
        case 'elm':
        case 'haskell':
            return { lineComment: '--', blockComment: ['{-', '-}'] };
        case 'vb':
        case 'asp':
        case 'diagram': // ? PlantUML is recognized as Diagram (diagram)
            return { lineComment: '\'' };
        case 'bibtex':
        case 'erlang':
        case 'latex':
        case 'matlab':
            return { lineComment: '%' };
        case 'clojure':
        case 'elps':
        case 'racket':
        case 'lisp':
            return { lineComment: ';' };
        case 'terraform':
            return { lineComment: '#', blockComment: ['/*', '*/'] };
        case 'COBOL':
            return { lineComment: '*>' };
        case 'fortran-modern':
            return { lineComment: 'c' };
        case 'SAS':
        case 'stata':
            return { lineComment: '*', blockComment: ['/*', '*/'] };
        case 'html':
        case 'xml':
        case 'markdown':
        case 'vue':
            return { blockComment: ['<!--', '-->'] };
        case 'twig':
            return { blockComment: ['{#', '#}'] };
        case 'genstat':
            return { lineComment: '\\', blockComment: ['"', '"'] };
        case 'cfml':
            return { blockComment: ['<!---', '--->'] };
        case 'shaderlab':
            return { lineComment: '//' };
        case 'razor':
            return { blockComment: ['@*', '*@'] };
        default:
            return undefined;
    }
}
//# sourceMappingURL=common.js.map