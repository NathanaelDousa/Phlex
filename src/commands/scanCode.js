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
const vscode = __importStar(require("vscode"));
const aiCommand = vscode.commands.registerCommand('phplex.scan', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'php') {
        vscode.window.showWarningMessage('Open a PHP file to run scan');
        return;
    }
    const prompt = editor.document.getText();
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning PHP with AI...',
        cancellable: false
    }, async () => {
        try {
            const start = Date.now();
            const response = await runOllama(prompt);
            const duration = (Date.now() - start) / 1000;
            aiOutputChannel.clear();
            aiOutputChannel.appendLine(`Scan duration: ${duration.toFixed(2)}s`);
            const sanitized = sanitizeMarkdown(response);
            aiOutputChannel.appendLine(sanitizeMarkdown(sanitized));
            aiOutputChannel.show(true);
        }
        catch (e) {
            vscode.window.showErrorMessage(`AI call failed: ${e instanceof Error ? e.message : e}`);
        }
    });
});
context.subscriptions.push(aiCommand);
//# sourceMappingURL=scanCode.js.map