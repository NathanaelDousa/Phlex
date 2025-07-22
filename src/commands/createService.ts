import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

async function createService() {
    const serviceName = await vscode.window.showInputBox({
        prompt: 'Voer de naam in van de serviceklasse',
        placeHolder: 'Bijv. UserService',
        validateInput: text => text.trim() === '' ? 'Servicenaam is vereist' : null
    });

    if (!serviceName) {
        vscode.window.showWarningMessage('Aanmaak geannuleerd: geen servicenaam opgegeven.');
        return;
    }

    const wantsInterface = await vscode.window.showQuickPick(['Ja', 'Nee'], {
        placeHolder: 'Would you like a interface generated for this service?'
    });

    const dependency = await vscode.window.showInputBox({
        prompt: 'Optional: Which dependency would you like to inject in the constructor? (example: UserRepository)',
        placeHolder: "Leave it empty if you don't want a dependency"
    });

    const className = serviceName;
    const interfaceName = `I${serviceName}`;
    const dependencyParam = dependency ? `private $${dependency.charAt(0).toLowerCase() + dependency.slice(1)}` : '';
    const constructorCode = dependency ? `
    public function __construct(${dependency} $${dependency.charAt(0).toLowerCase() + dependency.slice(1)}) {
        $this->${dependency.charAt(0).toLowerCase() + dependency.slice(1)} = $${dependency.charAt(0).toLowerCase() + dependency.slice(1)};
    }
` : '';

    const serviceTemplate = `<?php

${wantsInterface === 'Ja' ? `require_once '${interfaceName}.php';` : ''}

class ${className} ${wantsInterface === 'Ja' ? `implements ${interfaceName} ` : ''}{
    ${dependencyParam ? `private $${dependencyParam};` : ''}

    ${constructorCode.trim()}
}
`;

    const interfaceTemplate = `<?php

interface ${interfaceName} {
    // Voeg hier interface-methodes toe
}
`;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('Geen actieve workspacefolder gevonden.');
        return;
    }

    const folderPath = workspaceFolders[0].uri.fsPath;

    const classFilePath = path.join(folderPath, `${className}.php`);
    if (fs.existsSync(classFilePath)) {
        vscode.window.showErrorMessage(`File ${className}.php already exists.`);
        return;
    }

    fs.writeFileSync(classFilePath, serviceTemplate);
    vscode.window.showInformationMessage(`Serviceclass ${className}.php is created.`);
    vscode.workspace.openTextDocument(classFilePath).then(doc => {
        vscode.window.showTextDocument(doc);
    });

    if (wantsInterface === 'Ja') {
        const interfaceFilePath = path.join(folderPath, `${interfaceName}.php`);
        if (!fs.existsSync(interfaceFilePath)) {
            fs.writeFileSync(interfaceFilePath, interfaceTemplate);
            vscode.window.showInformationMessage(`Interfacefile ${interfaceName}.php is created.`);
        }
    }
}

export function createServiceCommand() {
    return vscode.commands.registerCommand('phplex.createService', createService);
}
