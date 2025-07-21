import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

async function createSingleton() {
    const className = await vscode.window.showInputBox({
        prompt: 'Voer de naam van de Singleton-klasse in',
        placeHolder: 'Bijv. DatabaseConnection',
        validateInput: text => text.trim() === '' ? 'Klassenaam is vereist' : null
    });

    if (!className) {
        vscode.window.showWarningMessage('Aanmaak geannuleerd: geen klassenaam opgegeven.');
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
        vscode.window.showErrorMessage('Geen actieve workspacefolder gevonden.');
        return;
    }

    const folderPath = workspaceFolders[0].uri.fsPath;
    const fileName = `${className}.php`;
    const filePath = path.join(folderPath, fileName);

    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`Bestand ${fileName} bestaat al.`);
        return;
    }

    fs.writeFile(filePath, singletonTemplate, err => {
        if (err) {
            vscode.window.showErrorMessage(`Fout bij het aanmaken van bestand: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(`Singleton-klasse ${className} is aangemaakt.`);
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
