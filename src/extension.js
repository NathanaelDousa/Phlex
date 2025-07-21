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
    console.log('Phplex (PHP AI assistant) is now active!');
    const aiOutputChannel = vscode.window.createOutputChannel('Phplex AI Suggestions');
    context.subscriptions.push(aiOutputChannel);
    const symbolTables = new Map();
    function sanitizeMarkdown(content) {
        return content
            .replace(/```[\s\S]*?```/g, (match) => match.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
            .replace(/`([^`]+)`/g, '`$1`')
            .replace(/\*\*([^*]+)\*\*/g, '**$1**')
            .replace(/\*([^*]+)\*/g, '*$1*')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
    context.subscriptions.push(vscode.languages.registerHoverProvider('php', {
        async provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return;
            }
            const word = document.getText(wordRange);
            const symbols = symbolTables.get(document.uri.toString());
            if (!symbols) {
                const lineText = document.lineAt(position.line).text;
                const prompt = `PHP code context: "${lineText}". Explain: "${word}" in simple terms.`;
                try {
                    const aiResponse = await runOllama(prompt);
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`### Phplex\n`);
                    markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                    return new vscode.Hover(markdown);
                }
                catch (e) {
                    return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                }
            }
            const symbol = symbols.find(s => s.loc.contains(position) && s.name === word);
            if (!symbol) {
                const lineText = document.lineAt(position.line).text;
                const prompt = `PHP code context: "${lineText}". Explain: "${word}" in simple terms.`;
                try {
                    const aiResponse = await runOllama(prompt);
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`### Phplex\n`);
                    markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                    return new vscode.Hover(markdown);
                }
                catch (e) {
                    return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                }
            }
            let contextInfo = `Symbol: ${symbol.kind} '${symbol.name}'`;
            if (symbol.scope) {
                contextInfo += ` in scope '${symbol.scope}'`;
            }
            if (symbol.docComment) {
                contextInfo += `\nDoc: ${symbol.docComment}`;
            }
            const prompt = `PHP context: ${contextInfo}\nExplain "${word}" clearly. Focus on PHP-specific details.`;
            try {
                const aiResponse = await runOllama(prompt);
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`### Phplex\n`);
                markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                return new vscode.Hover(markdown);
            }
            catch (e) {
                return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
            }
        }
    }));
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('php-analyzer');
    context.subscriptions.push(diagnosticCollection);
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'php') {
            analyzePHPCode(document.getText(), document.uri, diagnosticCollection, symbolTables);
        }
    });
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'php') {
        analyzePHPCode(editor.document.getText(), editor.document.uri, diagnosticCollection, symbolTables);
    }
}
function analyzePHPCode(code, uri, diagnostics, symbolTables) {
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
        let ast;
        try {
            ast = parser.parseEval(code);
        }
        catch (parseError) {
            console.warn('PHP Parse Error caught:', parseError);
            diagnostics.set(uri, []);
            symbolTables.delete(uri.toString());
            return;
        }
        const issues = [];
        const symbols = [];
        if (ast.kind === 'program') {
            ast.children.forEach((node) => {
                if (node.kind === 'function') {
                    const funcNode = node;
                    if (funcNode.loc) {
                        const funcRange = new vscode.Range(new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column), new vscode.Position(funcNode.loc.end.line - 1, funcNode.loc.end.column));
                        symbols.push({
                            name: funcNode.name,
                            kind: 'function',
                            loc: funcRange,
                            docComment: funcNode.leadingComments ? extractDocFromComments(funcNode.leadingComments) : undefined
                        });
                        if (funcNode.arguments.length > 5) {
                            issues.push({
                                code: 'too-many-params',
                                message: `Function ${funcNode.name} has too many parameters (${funcNode.arguments.length}). Consider refactoring.`,
                                range: funcRange,
                                severity: vscode.DiagnosticSeverity.Warning,
                                source: 'PHlex'
                            });
                        }
                        funcNode.arguments.forEach((arg) => {
                            let argName = '';
                            if (typeof arg === 'string') {
                                argName = arg;
                            }
                            else if (arg.name && typeof arg.name === 'string') {
                                argName = arg.name;
                            }
                            else if (arg.name && arg.name.name) {
                                argName = arg.name.name;
                            }
                            if (argName && funcNode.loc) {
                                const startPos = new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column);
                                const endPos = new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column + argName.length);
                                symbols.push({
                                    name: argName,
                                    kind: 'parameter',
                                    loc: new vscode.Range(startPos, endPos),
                                    scope: funcNode.name
                                });
                            }
                        });
                    }
                }
            });
        }
        diagnostics.set(uri, issues);
        symbolTables.set(uri.toString(), symbols);
    }
    catch (error) {
        console.error('Analyzer Outer Error:', error);
        vscode.window.showWarningMessage('PHlex could not analyze this PHP code.');
        symbolTables.delete(uri.toString());
    }
}
function extractDocFromComments(comments) {
    if (!comments)
        return undefined;
    const docLines = comments
        .map(c => c.value)
        .filter((text) => text.startsWith('*') || text.startsWith('**'))
        .join('\n');
    return docLines || undefined;
}
async function runOllama(prompt) {
    return new Promise((resolve, reject) => {
        const process = cp.spawn('ollama', ['run', 'llama3']);
        let data = '';
        let errorData = '';
        process.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        process.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve(data.trim());
            }
            else {
                reject(new Error(`Ollama process exited with code ${code}: ${errorData}`));
            }
        });
        // Schrijf prompt naar stdin van het proces
        process.stdin.write(prompt);
        process.stdin.end();
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map