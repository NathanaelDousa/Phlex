import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

async function createSingleton() {
    const className = await vscode.window.showInputBox({
        prompt: 'Enter the name of the Singleton class',
        placeHolder: 'For example, DatabaseConnection',
        validateInput: text => text.trim() === '' ? 'Class name is required' : null
    });

    if (!className) {
        vscode.window.showWarningMessage('Creation canceled: no class name provided.');
        return;
    }

    const singletonTemplate = `<?php

class ${className} {
    private static $instance = null;

    private function __construct() {
        // Private constructor voorkomt directe instantiatie
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __clone() {}
    private function __wakeup() {}
}
`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No active workspace folder found.');
        return;
    }

    const folderPath = workspaceFolders[0].uri.fsPath;
    const fileName = `${className}.php`;
    const filePath = path.join(folderPath, fileName);

    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`File ${fileName} already exists.`);
        return;
    }

    fs.writeFile(filePath, singletonTemplate, err => {
        if (err) {
            vscode.window.showErrorMessage(`Error creating file: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(`Singleton class ${className} is created.`);
            vscode.workspace.openTextDocument(filePath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        }
    });
}

//  Zorg voor deze export
export function createSingletonCommand() {
    return vscode.commands.registerCommand('phplex.createSingleton', createSingleton);
}
