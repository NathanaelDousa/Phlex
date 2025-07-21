"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const createMvcCommand = vscode.commands.registerCommand('phplex.createMvc', async () => {
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
            const folderUri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), folder);
            await fs.createDirectory(folderUri);
        }
        // Files aanmaken
        for (const file of files) {
            const fileUri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), file.path);
            await fs.writeFile(fileUri, Buffer.from(file.content, 'utf8'));
        }
        vscode.window.showInformationMessage('MVC structure created successfully!');
    }
    catch (err) {
        vscode.window.showErrorMessage(`Failed to create MVC structure: ${err}`);
    }
});
context.subscriptions.push(createMvcCommand);
//# sourceMappingURL=createMvc.js.map