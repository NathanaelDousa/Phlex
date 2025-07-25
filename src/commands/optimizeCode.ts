import * as vscode from 'vscode';
import { runOllama } from '../utils/aiUtils';

export function registerOptimizeCodeCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.optimizeCode', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showWarningMessage('Please open a PHP file to optimize.');
            return;
        }

        const code = editor.document.getText();
        const prompt = `Refactor the following PHP code for better performance, readability, and modern PHP best practices. Do not change its functionality.\n\n${code}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Optimizing PHP code...',
            cancellable: false
        }, async () => {
            try {
                const optimizedCode = await runOllama(prompt);

                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(code.length)
                );

                edit.replace(editor.document.uri, fullRange, optimizedCode);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Code optimized successfully!');
            } catch (e) {
                vscode.window.showErrorMessage(`Optimization failed: ${e instanceof Error ? e.message : e}`);
            }
        });
    });
}
