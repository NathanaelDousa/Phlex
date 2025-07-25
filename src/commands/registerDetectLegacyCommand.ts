import * as vscode from 'vscode';
import { runOllama } from '../utils/aiUtils';
import * as fs from 'fs';
import * as path from 'path';

export function registerDetectLegacyCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.detectLegacy', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showWarningMessage('Open a PHP file to detect legacy code');
            return;
        }

        const phpCode = editor.document.getText();
        const fileName = path.basename(editor.document.fileName); // e.g., index.php
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const prompt = `You are a senior PHP developer. Analyze the following PHP code and detect legacy patterns or bad practices. 
Return a list in Markdown with explanations, code line references (if possible), and suggest modern alternatives.
Look for deprecated functions (like mysql_*), procedural vs OOP style, missing namespaces, globals, etc.

Be thorough but clear.\n\n${phpCode}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Analyzing ${fileName} for legacy code...`,
            cancellable: false
        }, async () => {
            try {
                const markdown = await runOllama(prompt);

                const docsDir = path.join(workspaceFolder, 'docs');
                if (!fs.existsSync(docsDir)) {
                    fs.mkdirSync(docsDir);
                }

                const legacyFilePath = path.join(docsDir, `${fileName}.legacy.md`);
                fs.writeFileSync(legacyFilePath, markdown, 'utf-8');

                const legacyDocUri = vscode.Uri.file(legacyFilePath);
                await vscode.window.showTextDocument(legacyDocUri);
            } catch (e) {
                vscode.window.showErrorMessage(`Failed to detect legacy code: ${e instanceof Error ? e.message : e}`);
            }
        });
    });
}
