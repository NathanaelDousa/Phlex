import * as vscode from 'vscode';
import * as path from 'path';
import { createFolderIfNotExists, createFile, getWorkspaceRoot } from '../utils/fileUtils';

export function createApiEndpointCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('phplex.createApiEndpoint', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;

        const endpointName = await vscode.window.showInputBox({
            prompt: 'Enter the name of the API endpoint (e.g. User, Product)',
            placeHolder: 'User',
            validateInput: value => value ? null : 'Name is required'
        });

        if (!endpointName) return;

        const name = endpointName.trim();
        const lcName = name.toLowerCase();

        const controllerPath = path.join(rootPath, `mvc/controllers/Api${name}Controller.php`);
        const modelPath = path.join(rootPath, `mvc/models/${name}Model.php`);

        const controllerContent = `<?php
require_once __DIR__ . '/../models/${name}Model.php';

class Api${name}Controller
{
    private \$model;

    public function __construct()
    {
        header('Content-Type: application/json');
        \$this->model = new ${name}Model();
    }

    public function index()
    {
        echo json_encode(\$this->model->getAll());
    }

    public function show()
    {
        \$id = \$_GET['id'] ?? null;
        echo json_encode(\$this->model->find(\$id));
    }

    public function store()
    {
        \$data = json_decode(file_get_contents('php://input'), true);
        \$this->model->create(\$data);
        echo json_encode(['success' => true]);
    }

    public function update()
    {
        \$id = \$_GET['id'] ?? null;
        \$data = json_decode(file_get_contents('php://input'), true);
        \$this->model->update(\$id, \$data);
        echo json_encode(['success' => true]);
    }

    public function destroy()
    {
        \$id = \$_GET['id'] ?? null;
        \$this->model->delete(\$id);
        echo json_encode(['success' => true]);
    }
}`;

        const modelContent = `<?php
class ${name}Model
{
    private \$data = [];

    public function getAll()
    {
        return \$this->data;
    }

    public function find(\$id)
    {
        return \$this->data[\$id] ?? null;
    }

    public function create(\$item)
    {
        \$this->data[] = \$item;
    }

    public function update(\$id, \$item)
    {
        \$this->data[\$id] = \$item;
    }

    public function delete(\$id)
    {
        unset(\$this->data[\$id]);
    }
}`;

    try {
        await createFolderIfNotExists(vscode.Uri.file(path.dirname(controllerPath)));
        await createFolderIfNotExists(vscode.Uri.file(path.dirname(modelPath)));

        await createFile(vscode.Uri.file(controllerPath), controllerContent);
        await createFile(vscode.Uri.file(modelPath), modelContent);

        vscode.window.showInformationMessage(`API endpoint "${name}" generated successfully!`);
    } catch (err) {
        vscode.window.showErrorMessage(`Error generating API endpoint: ${err}`);
    }
    });
}
