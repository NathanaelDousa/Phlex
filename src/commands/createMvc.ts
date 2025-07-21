import * as vscode from 'vscode';
import * as path from 'path';
import { createFolderIfNotExists, createFile, getWorkspaceRoot } from '../utils/fileUtils';

function generateFormFields(columnInput: string): string {
    const fields = columnInput.split(',').map(pair => {
        const [name, type] = pair.split(':');
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        let inputType = 'text';

        if (type === 'bool') inputType = 'checkbox';
        else if (type === 'email') inputType = 'email';

        if (inputType === 'checkbox') {
            return `
        <label>
            ${label}: <input type="checkbox" name="${name}" />
        </label><br/>`;
        }

        return `
        <label>
            ${label}: <input type="${inputType}" name="${name}" required />
        </label><br/>`;
    });

    return fields.join('\n');
}

export function createMvcCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.createMvc', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fs = vscode.workspace.fs;

        const includeCrud = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Do you want CRUD functionality to be generated as well?'
        });

        let columnInput = '';
        if (includeCrud === 'Yes') {
            columnInput = await vscode.window.showInputBox({
                prompt: 'Enter columns like: name:string,email:string,active:bool'
            }) || '';
        }

        const folders = ['mvc/controllers', 'mvc/models', 'mvc/views/home'];

        const formFields = includeCrud === 'Yes' ? generateFormFields(columnInput) : '';

        const files = [
            {
                path: 'mvc/controllers/HomeController.php',
                content: includeCrud === 'Yes' ? `<?php
require_once __DIR__ . '/../models/HomeModel.php';

class HomeController
{
    private \$model;

    public function __construct()
    {
        \$this->model = new HomeModel();
    }

    public function index()
    {
        \$items = \$this->model->getAll();
        require __DIR__ . '/../views/home/index.php';
    }

    public function create()
    {
        require __DIR__ . '/../views/home/create.php';
    }

    public function store()
    {
        \$data = \$_POST;
        \$this->model->create(\$data);
        header('Location: index.php?route=home/index');
    }

    public function edit()
    {
        \$id = \$_GET['id'] ?? null;
        \$item = \$this->model->find(\$id);
        require __DIR__ . '/../views/home/edit.php';
    }

    public function update()
    {
        \$id = \$_POST['id'] ?? null;
        \$data = \$_POST;
        \$this->model->update(\$id, \$data);
        header('Location: index.php?route=home/index');
    }

    public function destroy()
    {
        \$id = \$_GET['id'] ?? null;
        \$this->model->delete(\$id);
        header('Location: index.php?route=home/index');
    }
}` :
`<?php
require_once __DIR__ . '/../models/HomeModel.php';

class HomeController
{
    private \$model;

    public function __construct()
    {
        \$this->model = new HomeModel();
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
}`}
,
            {
                path: 'mvc/models/HomeModel.php',
                content: includeCrud === 'Yes' ? `<?php
class HomeModel
{
    private \$data = [];

    public function getAll()
    {
        return \$this->data;
    }

    public function create(\$item)
    {
        \$this->data[] = \$item;
    }

    public function find(\$id)
    {
        return \$this->data[\$id] ?? null;
    }

    public function update(\$id, \$item)
    {
        \$this->data[\$id] = \$item;
    }

    public function delete(\$id)
    {
        unset(\$this->data[\$id]);
    }
}` :
`<?php
class HomeModel
{
    public function getWelcomeMessage(): string
    {
        return 'Welcome to Phplex MVC!';
    }

    public function getAboutInfo(): string
    {
        return 'Phplex MVC is a simple PHP structure.';
    }
}`}
,
            {
                path: 'mvc/views/home/index.php',
                content: includeCrud === 'Yes' ? `<!DOCTYPE html>
<html>
<head>
    <title>CRUD Index</title>
</head>
<body>
    <h1>Items</h1>
    <a href="index.php?route=home/create">Nieuw item</a>
    <ul>
        <?php foreach (\$items as \$id => \$item): ?>
            <li>
                <?= htmlspecialchars(json_encode(\$item)) ?>
                <a href="index.php?route=home/edit&id=<?= \$id ?>">Bewerk</a>
                <a href="index.php?route=home/destroy&id=<?= \$id ?>">Verwijder</a>
            </li>
        <?php endforeach; ?>
    </ul>
</body>
</html>` :
`<!DOCTYPE html>
<html>
<head>
    <title>Home</title>
</head>
<body>
    <h1><?= htmlspecialchars(\$data) ?></h1>
</body>
</html>`},
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
</html>`},
            ...(includeCrud === 'Yes' ? [
                {
                    path: 'mvc/views/home/create.php',
                    content: `<!DOCTYPE html>
<html>
<head><title>Maak item</title></head>
<body>
    <form method="POST" action="index.php?route=home/store">
        ${formFields}
        <button type="submit">Opslaan</button>
    </form>
</body>
</html>`
                },
                {
                    path: 'mvc/views/home/edit.php',
                    content: `<!DOCTYPE html>
<html>
<head><title>Bewerk item</title></head>
<body>
    <form method="POST" action="index.php?route=home/update">
        <input type="hidden" name="id" value="<?= htmlspecialchars(\$id) ?>" />
        <input type="text" name="name" value="<?= htmlspecialchars(\$item['name'] ?? '') ?>" required />
        <button type="submit">Bijwerken</button>
    </form>
</body>
</html>`
                }
            ] : []),
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
            for (const folder of folders) {
                const folderPath = path.join(rootPath, folder);
                const folderUri = vscode.Uri.file(folderPath);
                await fs.createDirectory(folderUri);
            }

            for (const file of files) {
                const filePath = path.join(rootPath, file.path);
                const fileUri = vscode.Uri.file(filePath);
                await fs.writeFile(fileUri, Buffer.from(file.content, 'utf8'));
            }

            vscode.window.showInformationMessage(`MVC structure created${includeCrud === 'Yes' ? ' with dynamic CRUD!' : ''}`);
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to create MVC structure: ${err}`);
        }
    });
}
