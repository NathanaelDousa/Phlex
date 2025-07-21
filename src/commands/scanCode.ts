import * as vscode from 'vscode';
import { runOllama, sanitizeMarkdown } from '../utils/aiUtils'; // <- zorg dat dit klopt met jouw structuur
const aiOutputChannel = vscode.window.createOutputChannel('AI PHP Scanner');

export function registerAiScanCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.scan', async () => {
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
                aiOutputChannel.appendLine(sanitized);
                aiOutputChannel.show(true);

            } catch (e) {
                vscode.window.showErrorMessage(`AI call failed: ${e instanceof Error ? e.message : e}`);
            }
        });
    });
}
