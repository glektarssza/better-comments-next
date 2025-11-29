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
exports.refresh = refresh;
exports.getConfigurationFlatten = getConfigurationFlatten;
exports.getTagDecorationTypes = getTagDecorationTypes;
exports.getMultilineTagsEscaped = getMultilineTagsEscaped;
exports.getLineTagsEscaped = getLineTagsEscaped;
exports.getAllTagsEscaped = getAllTagsEscaped;
const regex_1 = require("@/utils/regex");
const vscode = __importStar(require("vscode"));
let config;
let configFlatten;
let tagDecorationTypes;
let multilineTagsEscaped;
let lineTagsEscaped;
let allTagsEscaped;
function refresh() {
    // if already set tagDecorationTypes, clear decoration for visible editors
    if (tagDecorationTypes) {
        for (const editor of vscode.window.visibleTextEditors) {
            for (const [, decorationType] of tagDecorationTypes) {
                // clear decoration
                editor.setDecorations(decorationType, []);
            }
        }
    }
    config = undefined;
    configFlatten = undefined;
    tagDecorationTypes = undefined;
    multilineTagsEscaped = undefined;
    lineTagsEscaped = undefined;
    allTagsEscaped = undefined;
}
/**
 * Get better comments configuration
 */
function getConfiguration() {
    if (!config) {
        config = vscode.workspace.getConfiguration('better-comments');
    }
    return config;
}
/**
 * Get better comments configuration in flatten
 */
function getConfigurationFlatten() {
    if (configFlatten) {
        return configFlatten;
    }
    const orig = getConfiguration();
    configFlatten = {
        ...orig,
        tags: flattenTags(orig.tags),
        tagsLight: flattenTags(orig.tagsLight),
        tagsDark: flattenTags(orig.tagsDark),
    };
    return configFlatten;
}
/**
 * Flatten config tags
 */
function flattenTags(tags) {
    const flatTags = [];
    for (const tag of tags) {
        if (!Array.isArray(tag.tag)) {
            // ! add tag only tag name not empty
            if (tag.tag) {
                flatTags.push({ ...tag, tagEscaped: (0, regex_1.escape)(tag.tag) });
            }
            continue;
        }
        for (const tagName of tag.tag) {
            // ! add tag only tag name not empty
            if (!tagName) {
                continue;
            }
            flatTags.push({
                ...tag,
                tag: tagName,
                tagEscaped: (0, regex_1.escape)(tagName),
            });
        }
    }
    return flatTags;
}
function getTagDecorationTypes() {
    if (!tagDecorationTypes) {
        const configs = getConfigurationFlatten();
        tagDecorationTypes = new Map();
        for (const tag of configs.tags) {
            const opt = parseDecorationRenderOption(tag);
            const tagLight = configs.tagsLight.find(t => t.tag === tag.tag);
            if (tagLight) {
                opt.light = parseDecorationRenderOption(tagLight);
            }
            const tagDark = configs.tagsDark.find(t => t.tag === tag.tag);
            if (tagDark) {
                opt.dark = parseDecorationRenderOption(tagDark);
            }
            const tagName = tag.tag.toLowerCase();
            tagDecorationTypes.set(tagName, vscode.window.createTextEditorDecorationType(opt));
        }
    }
    return tagDecorationTypes;
}
/**
 * Parse decoration render option by tag configuration
 */
function parseDecorationRenderOption(tag) {
    const options = { color: tag.color, backgroundColor: tag.backgroundColor };
    const textDecorations = [];
    tag.strikethrough && textDecorations.push('line-through');
    tag.underline && textDecorations.push('underline');
    options.textDecoration = textDecorations.join(' ');
    if (tag.bold) {
        options.fontWeight = 'bold';
    }
    if (tag.italic) {
        options.fontStyle = 'italic';
    }
    return options;
}
function getMultilineTagsEscaped() {
    if (!multilineTagsEscaped) {
        multilineTagsEscaped = getConfigurationFlatten().tags.filter(t => t.multiline).map(tag => tag.tagEscaped);
    }
    return multilineTagsEscaped;
}
function getLineTagsEscaped() {
    if (!lineTagsEscaped) {
        lineTagsEscaped = getConfigurationFlatten().tags.filter(t => !t.multiline).map(tag => tag.tagEscaped);
    }
    return lineTagsEscaped;
}
function getAllTagsEscaped() {
    if (!allTagsEscaped) {
        allTagsEscaped = getConfigurationFlatten().tags.map(tag => tag.tagEscaped);
    }
    return allTagsEscaped;
}
//# sourceMappingURL=configuration.js.map