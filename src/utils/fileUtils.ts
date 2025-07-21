import * as vscode from 'vscode';

export async function createFolderIfNotExists(folderUri: vscode.Uri) {
    try {
        await vscode.workspace.fs.createDirectory(folderUri);
    } catch (err) {
        // Folder bestaat mogelijk al – geen probleem
    }
}

export async function createFile(fileUri: vscode.Uri, content: string) {
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(fileUri, encoder.encode(content));
}

export function getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders?.[0]?.uri.fsPath;
}
