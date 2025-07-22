import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { runOllama } from '../utils/aiUtils';

export function commentCodeCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.commentCode', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showErrorMessage('Please open a PHP file to generate comments.');
            return;
        }

        const document = editor.document;
        const originalCode = document.getText();
        const filePath = document.uri.fsPath;

        // Create backup
        const backupPath = filePath.replace(/\.php$/, '.bak.php');
        fs.writeFileSync(backupPath, originalCode, 'utf8');

        const prompt = `Add clear and concise PHP comments above each function, class, and any complex logic in this code. Do not rewrite or alter the logic.\n\n${originalCode}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Phplex: Generating PHP comments...',
            cancellable: false
        }, async () => {
            try {
                const commentedCode = await runOllama(prompt);

                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(originalCode.length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, commentedCode);
                });

                vscode.window.showInformationMessage(`PHP comments added successfully! Backup created: ${path.basename(backupPath)}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to add comments: ${error.message || error}`);
            }
        });
    });
}
