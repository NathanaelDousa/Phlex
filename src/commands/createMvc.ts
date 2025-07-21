import * as vscode from 'vscode';
import * as path from 'path';
import { createFolderIfNotExists, createFile, getWorkspaceRoot } from '../utils/fileUtils';

export function createMvcCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.createMvc', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fs = vscode.workspace.fs;

        const folders = ['mvc/controllers', 'mvc/models', 'mvc/views'];
        const files = [
            {
                path: 'mvc/controllers/HomeController.php',
                content: `<?php
require_once __DIR__ . '/../models/HomeModel.php';

class HomeController
{
    private $model;

    public function __construct()
    {
        $this->model = new HomeModel();
    }

    public function index()
    {
        \$data = \$this->model->getWelcomeMessage();
        require __DIR__ . '/../views/home/index.php';
    }

    public function about()
    {
        \$info = \$this->model->getAboutInfo();
        require __DIR__ . '/../views/home/about.php';
    }
}`
            },
            {
                path: 'mvc/models/HomeModel.php',
                content: `<?php
class HomeModel
{
    public function getWelcomeMessage(): string
    {
        return 'Welkom bij Phplex MVC!';
    }

    public function getAboutInfo(): string
    {
        return 'Phplex MVC is een simpele PHP structuur.';
    }
}`
            },
            {
                path: 'mvc/views/home/index.php',
                content: `<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>
    <h1><?= htmlspecialchars(\$data) ?></h1>
</body>
</html>`
            },
            {
                path: 'mvc/views/home/about.php',
                content: `<!DOCTYPE html>
<html>
<head>
    <title>About</title>
</head>
<body>
    <h1><?= htmlspecialchars(\$info) ?></h1>
</body>
</html>`
            },
            {
                path: 'mvc/index.php',
                content: `<?php
\$path = \$_GET['route'] ?? 'home/index';
list(\$controllerName, \$method) = explode('/', \$path);

\$controllerFile = __DIR__ . '/controllers/' . ucfirst(\$controllerName) . 'Controller.php';

if (file_exists(\$controllerFile)) {
    require_once \$controllerFile;
    \$className = ucfirst(\$controllerName) . 'Controller';

    if (class_exists(\$className)) {
        \$controller = new \$className();

        if (method_exists(\$controller, \$method)) {
            \$controller->\$method();
            exit;
        }
    }
}

http_response_code(404);
echo 'Pagina niet gevonden.';`
            }
        ];

        try {
            // Folders aanmaken
            for (const folder of folders) {
                const folderPath = path.join(rootPath, folder);
                const folderUri = vscode.Uri.file(folderPath);
                await fs.createDirectory(folderUri);
            }

            // Files aanmaken
            for (const file of files) {
                const filePath = path.join(rootPath, file.path);
                const fileUri = vscode.Uri.file(filePath);
                await fs.writeFile(fileUri, Buffer.from(file.content, 'utf8'));
            }

            vscode.window.showInformationMessage('MVC structure created successfully!');
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to create MVC structure: ${err}`);
        }
    });
}