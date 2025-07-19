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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const php_parser_1 = require("php-parser");
function activate(context) {
    console.log('PHlex (PHP AI assistant) is now active!');
    const aiOutputChannel = vscode.window.createOutputChannel('PHlex AI Suggestions');
    context.subscriptions.push(aiOutputChannel);
    // Command voor AI suggesties (nu output naar panel)
    let aiCommand = vscode.commands.registerCommand('php-code-analyzer.askAI', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showWarningMessage('Open a PHP file to ask AI');
            return;
        }
        const prompt = editor.document.getText();
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Getting AI suggestions...',
            cancellable: false
        }, async () => {
            try {
                const response = await runOllama(prompt);
                aiOutputChannel.clear();
                aiOutputChannel.appendLine(response);
                aiOutputChannel.show(true);
            }
            catch (e) {
                vscode.window.showErrorMessage(`AI call failed: ${e instanceof Error ? e.message : e}`);
            }
        });
    });
    context.subscriptions.push(aiCommand);
    // Hover provider voor AI suggesties
    context.subscriptions.push(vscode.languages.registerHoverProvider('php', {
        async provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return;
            }
            const word = document.getText(wordRange);
            // Maak een korte prompt met de omringende regel voor context
            const lineText = document.lineAt(position.line).text;
            // Combineer woord en regel voor context
            const prompt = `PHP code context: "${lineText}". Geef suggesties of uitleg over: "${word}".`;
            try {
                const aiResponse = await runOllama(prompt);
                return new vscode.Hover({ language: 'plaintext', value: aiResponse });
            }
            catch (e) {
                return new vscode.Hover(`AI suggestie kon niet geladen worden: ${e instanceof Error ? e.message : e}`);
            }
        }
    }));
    // Diagnostic collection voor lint
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('php-analyzer');
    context.subscriptions.push(diagnosticCollection);
    // Analyse bij opslaan
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'php') {
            analyzePHPCode(document.getText(), document.uri, diagnosticCollection);
        }
    });
    // Analyse huidige open PHP file bij activatie
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'php') {
        analyzePHPCode(editor.document.getText(), editor.document.uri, diagnosticCollection);
    }
}
async function runOllama(prompt) {
    return new Promise((resolve, reject) => {
        const proc = cp.spawn('ollama', ['run', 'llama3'], { stdio: ['pipe', 'pipe', 'pipe'] });
        let output = '';
        let error = '';
        proc.stdout.on('data', data => {
            output += data.toString();
        });
        proc.stderr.on('data', data => {
            error += data.toString();
        });
        proc.on('close', code => {
            if (code === 0) {
                resolve(output.trim());
            }
            else {
                reject(new Error(`Ollama exited with code ${code}: ${error}`));
            }
        });
        proc.stdin.write(prompt);
        proc.stdin.end();
    });
}
function analyzePHPCode(code, uri, diagnostics) {
    try {
        const parser = new php_parser_1.Engine({
            parser: {
                extractDoc: true,
                suppressErrors: true
            },
            ast: {
                withPositions: true,
                withSource: true
            }
        });
        const ast = parser.parseEval(code);
        const issues = [];
        if (ast.kind === 'program') {
            ast.children.forEach((node) => {
                if (node.kind === 'function') {
                    const funcNode = node;
                    if (funcNode.arguments.length > 5 && funcNode.loc) {
                        const range = new vscode.Range(new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column), new vscode.Position(funcNode.loc.end.line - 1, funcNode.loc.end.column));
                        issues.push({
                            code: 'too-many-params',
                            message: `Function ${funcNode.name} has too many parameters (${funcNode.arguments.length}). Consider refactoring.`,
                            range: range,
                            severity: vscode.DiagnosticSeverity.Warning,
                            source: 'PHlex'
                        });
                    }
                }
            });
        }
        diagnostics.set(uri, issues);
    }
    catch (error) {
        vscode.window.showErrorMessage(`PHP analysis failed: ${error instanceof Error ? error.message : error}`);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map