import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { runOllama } from '../utils/aiUtils';

export function convertToOOPCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.convertToOOP', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showErrorMessage('Open a PHP file to convert to OOP.');
            return;
        }

        const document = editor.document;
        const originalCode = document.getText();
        const filePath = document.uri.fsPath;

        // Backup maken (.bak.php)
        const backupPath = filePath.replace(/\.php$/, '.bak.php');
        fs.writeFileSync(backupPath, originalCode, 'utf8');

        const prompt = `Convert this procedural PHP code to object-oriented style (OOP). Only output the complete PHP code without any explanations. Use clean classes and methods, but maintain the functionality:\n\n${originalCode}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Phplex: Refactoring code to OOP...',
            cancellable: false
        }, async () => {
            try {
                const oopCode = await runOllama(prompt);

                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(originalCode.length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, oopCode);
                });

                vscode.window.showInformationMessage(`PHP conversion to OOP completed! Backup created: ${path.basename(backupPath)}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`AI refactor failed: ${error.message || error}`);
            }
        });
    });
}