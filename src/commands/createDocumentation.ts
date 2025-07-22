import * as vscode from 'vscode';
import { runOllama } from '../utils/aiUtils';
import * as path from 'path';
import * as fs from 'fs';

export function registerDocumentationCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.generateDocumentation', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'php') {
            vscode.window.showWarningMessage('Open a PHP file to generate documentation.');
            return;
        }

        const document = editor.document;
        const phpCode = document.getText();
        const filePath = document.uri.fsPath;
        const fileName = path.basename(filePath); // e.g., index.php

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }

        const docFileName = fileName.replace(/\.php$/, '.md'); // e.g., index.md
        const docsDir = path.join(workspaceFolder, 'docs');
        const docFilePath = path.join(docsDir, docFileName);

        const prompt = `Create a technical Markdown documentation for the following PHP file. Include a short file description, classes and their purposes, method summaries, parameters, return types, and example usage.\n\n${phpCode}`;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Generating documentation for ${fileName}...`,
            cancellable: false
        }, async () => {
            try {
                const markdown = await runOllama(prompt);

                fs.mkdirSync(path.dirname(docFilePath), { recursive: true });
                fs.writeFileSync(docFilePath, markdown, 'utf-8');

                const docUri = vscode.Uri.file(docFilePath);
                await vscode.window.showTextDocument(docUri);

                vscode.window.showInformationMessage(`📄 Documentation saved to: ${path.relative(workspaceFolder, docFilePath)}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to generate documentation: ${error.message || error}`);
            }
        });
    });
}
