import * as vscode from 'vscode';
import { Engine } from 'php-parser';

// Add type definitions for php-parser nodes
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

export function activate(context: vscode.ExtensionContext) {
    console.log('PHP Code Analyzer is now active!');

    let disposable = vscode.commands.registerCommand('php-code-analyzer.analyze', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showWarningMessage('Open a PHP file to analyze');
            return;
        }

        const text = editor.document.getText();
        analyzePHPCode(text);
    });

    context.subscriptions.push(disposable);

    // Analyze on save
    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'php') {
            analyzePHPCode(document.getText());
        }
    });
}

function analyzePHPCode(code: string) {
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

        const ast = parser.parseEval(code) as PHPProgram;
        
        // Basic analysis
        const issues: vscode.Diagnostic[] = [];
        
        // Example: Find functions with too many parameters
        if (ast.kind === 'program') {
            ast.children.forEach((node: PHPNode) => {
                if (node.kind === 'function') {
                    const funcNode = node as PHPFunction;
                    if (funcNode.arguments.length > 5 && funcNode.loc) {
                        const range = new vscode.Range(
                            new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column),
                            new vscode.Position(funcNode.loc.end.line - 1, funcNode.loc.end.column)
                        );
                        
                        issues.push({
                            code: 'too-many-params',
                            message: `Function ${funcNode.name} has too many parameters (${funcNode.arguments.length}). Consider refactoring.`,
                            range: range,
                            severity: vscode.DiagnosticSeverity.Warning,
                            source: 'php-code-analyzer'
                        });
                    }
                }
            });
        }

        const diagnosticCollection = vscode.languages.createDiagnosticCollection('php-analyzer');
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            diagnosticCollection.set(activeEditor.document.uri, issues);
        }

        vscode.window.showInformationMessage(`PHP analysis completed. Found ${issues.length} issues.`);

    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`PHP analysis failed: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('PHP analysis failed with an unknown error');
        }
    }
}

export function deactivate() {}