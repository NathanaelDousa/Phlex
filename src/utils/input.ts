import * as vscode from 'vscode';

export async function askClassName(prompt = 'Voer een klassenaam in'): Promise<string | undefined> {
    return await vscode.window.showInputBox({
        prompt,
        ignoreFocusOut: true
    });
}

export async function askInterfaceName(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
        prompt: 'Voer de naam van de interface in',
        ignoreFocusOut: true
    });
}

export async function askFolderPath(): Promise<string | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return undefined;

    return folders[0].uri.fsPath;
}
