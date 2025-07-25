import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Engine } from 'php-parser';
import { runOllama, sanitizeMarkdown } from './utils/aiUtils';


import { createMvcCommand } from './commands/createMvc';
import { registerAiScanCommand } from './commands/scanCode';
import { createSingletonCommand } from './commands/createSingleton';
import { createServiceCommand } from './commands/createService';
import { createApiEndpointCommand } from './commands/createApiEndpoint';
import { convertToOOPCommand } from './commands/convertToOOP';
import { commentCodeCommand } from './commands/commentCode';
import { registerDocumentationCommand } from './commands/createDocumentation';
import { registerOptimizeCodeCommand } from './commands/optimizeCode';



type PHPNode = {
    kind: string;
    loc?: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    };
    [key: string]: any;
};

type PHPProgram = PHPNode & {
    kind: 'program';
    children: PHPNode[];
};

type PHPFunction = PHPNode & {
    kind: 'function';
    name: string;
    arguments: any[];
};

type SymbolInfo = {
    name: string;
    kind: 'function' | 'variable' | 'parameter';
    loc: vscode.Range;
    scope?: string;
    docComment?: string;
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Phplex (PHP AI assistant) is now active!');

    const aiOutputChannel = vscode.window.createOutputChannel('Phplex AI Suggestions');
    context.subscriptions.push(aiOutputChannel);

    const symbolTables = new Map<string, SymbolInfo[]>();



    context.subscriptions.push(registerAiScanCommand());
    context.subscriptions.push(createMvcCommand());
    context.subscriptions.push(createSingletonCommand());
    context.subscriptions.push(createServiceCommand());
    context.subscriptions.push(createApiEndpointCommand());
    context.subscriptions.push(convertToOOPCommand());
    context.subscriptions.push(commentCodeCommand());
    context.subscriptions.push(registerDocumentationCommand());
    context.subscriptions.push(registerOptimizeCodeCommand());



    context.subscriptions.push(
        vscode.languages.registerHoverProvider('php', {
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
                    } catch (e) {
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
                    } catch (e) {
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
                } catch (e) {
                    return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                }
            }
        })
    );

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

function analyzePHPCode(
    code: string,
    uri: vscode.Uri,
    diagnostics: vscode.DiagnosticCollection,
    symbolTables: Map<string, SymbolInfo[]>
) {
    try {
        const parser = new Engine({
            parser: {
                extractDoc: true,
                suppressErrors: true
            },
            ast: {
                withPositions: true,
                withSource: true
            }
        });

        let ast: PHPProgram;

        try {
            ast = parser.parseEval(code) as PHPProgram;
        } catch (parseError) {
            console.warn('PHP Parse Error caught:', parseError);
            diagnostics.set(uri, []);
            symbolTables.delete(uri.toString());
            return;
        }

        const issues: vscode.Diagnostic[] = [];
        const symbols: SymbolInfo[] = [];

        if (ast.kind === 'program') {
            ast.children.forEach((node: PHPNode) => {
                if (node.kind === 'function') {
                    const funcNode = node as PHPFunction;

                    if (funcNode.loc) {
                        const funcRange = new vscode.Range(
                            new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column),
                            new vscode.Position(funcNode.loc.end.line - 1, funcNode.loc.end.column)
                        );

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

                        funcNode.arguments.forEach((arg: any) => {
                            let argName = '';
                            if (typeof arg === 'string') {
                                argName = arg;
                            } else if (arg.name && typeof arg.name === 'string') {
                                argName = arg.name;
                            } else if (arg.name && arg.name.name) {
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

    } catch (error) {
        console.error('Analyzer Outer Error:', error);
        vscode.window.showWarningMessage('PHlex could not analyze this PHP code.');
        symbolTables.delete(uri.toString());
    }
}

function extractDocFromComments(comments: any[]): string | undefined {
    if (!comments) return undefined;

    const docLines = comments
        .map(c => c.value)
        .filter((text: string) => text.startsWith('*') || text.startsWith('**'))
        .join('\n');

    return docLines || undefined;
}



export function deactivate() {}
 