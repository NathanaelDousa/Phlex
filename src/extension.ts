import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Engine } from 'php-parser';

type PHPNode = {
    kind: string;
    loc?: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    };
    [key: string]: any;
};

type PHPProgram = PHPNode & {
    kind: 'program';
    children: PHPNode[];
};

type PHPFunction = PHPNode & {
    kind: 'function';
    name: string;
    arguments: any[];
};

type SymbolInfo = {
    name: string;
    kind: 'function' | 'variable' | 'parameter';
    loc: vscode.Range;
    scope?: string;
    docComment?: string;
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Phplex (PHP AI assistant) is now active!');

    const aiOutputChannel = vscode.window.createOutputChannel('Phplex AI Suggestions');
    context.subscriptions.push(aiOutputChannel);

    const symbolTables = new Map<string, SymbolInfo[]>();

    function sanitizeMarkdown(content: string): string {
        return content
            .replace(/```[\s\S]*?```/g, (match) => 
                match.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
            .replace(/`([^`]+)`/g, '`$1`')
            .replace(/\*\*([^*]+)\*\*/g, '**$1**')
            .replace(/\*([^*]+)\*/g, '*$1*')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }

    const aiCommand = vscode.commands.registerCommand('phplex.scan', async () => {
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
                aiOutputChannel.appendLine(sanitizeMarkdown(sanitized));
                aiOutputChannel.show(true);

   
            } catch (e) {
                vscode.window.showErrorMessage(`AI call failed: ${e instanceof Error ? e.message : e}`);
            }
        });
    });

    context.subscriptions.push(aiCommand);

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
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to create MVC structure: ${err}`);
    }
});

context.subscriptions.push(createMvcCommand);


    context.subscriptions.push(
        vscode.languages.registerHoverProvider('php', {
            async provideHover(document, position, token) {
                const wordRange = document.getWordRangeAtPosition(position);
                if (!wordRange) {
                    return;
                }
                const word = document.getText(wordRange);

                const symbols = symbolTables.get(document.uri.toString());
                if (!symbols) {
                    const lineText = document.lineAt(position.line).text;
                    const prompt = `PHP code context: "${lineText}". Explain: "${word}" in simple terms.`;
                    try {
                        const aiResponse = await runOllama(prompt);
                        const markdown = new vscode.MarkdownString();
                        markdown.appendMarkdown(`### Phplex\n`);
                        markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                        return new vscode.Hover(markdown);
                    } catch (e) {
                        return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                    }
                }

                const symbol = symbols.find(s => s.loc.contains(position) && s.name === word);

                if (!symbol) {
                    const lineText = document.lineAt(position.line).text;
                    const prompt = `PHP code context: "${lineText}". Explain: "${word}" in simple terms.`;
                    try {
                        const aiResponse = await runOllama(prompt);
                        const markdown = new vscode.MarkdownString();
                        markdown.appendMarkdown(`### Phplex\n`);
                        markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                        return new vscode.Hover(markdown);
                    } catch (e) {
                        return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                    }
                }

                let contextInfo = `Symbol: ${symbol.kind} '${symbol.name}'`;
                if (symbol.scope) {
                    contextInfo += ` in scope '${symbol.scope}'`;
                }
                if (symbol.docComment) {
                    contextInfo += `\nDoc: ${symbol.docComment}`;
                }

                const prompt = `PHP context: ${contextInfo}\nExplain "${word}" clearly. Focus on PHP-specific details.`;

                try {
                    const aiResponse = await runOllama(prompt);
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`### Phplex\n`);
                    markdown.appendMarkdown(sanitizeMarkdown(aiResponse));
                    return new vscode.Hover(markdown);
                } catch (e) {
                    return new vscode.Hover(`Could not load AI suggestion: ${e instanceof Error ? e.message : e}`);
                }
            }
        })
    );

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('php-analyzer');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'php') {
            analyzePHPCode(document.getText(), document.uri, diagnosticCollection, symbolTables);
        }
    });

    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'php') {
        analyzePHPCode(editor.document.getText(), editor.document.uri, diagnosticCollection, symbolTables);
    }
}

function analyzePHPCode(
    code: string,
    uri: vscode.Uri,
    diagnostics: vscode.DiagnosticCollection,
    symbolTables: Map<string, SymbolInfo[]>
) {
    try {
        const parser = new Engine({
            parser: {
                extractDoc: true,
                suppressErrors: true
            },
            ast: {
                withPositions: true,
                withSource: true
            }
        });

        let ast: PHPProgram;

        try {
            ast = parser.parseEval(code) as PHPProgram;
        } catch (parseError) {
            console.warn('PHP Parse Error caught:', parseError);
            diagnostics.set(uri, []);
            symbolTables.delete(uri.toString());
            return;
        }

        const issues: vscode.Diagnostic[] = [];
        const symbols: SymbolInfo[] = [];

        if (ast.kind === 'program') {
            ast.children.forEach((node: PHPNode) => {
                if (node.kind === 'function') {
                    const funcNode = node as PHPFunction;

                    if (funcNode.loc) {
                        const funcRange = new vscode.Range(
                            new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column),
                            new vscode.Position(funcNode.loc.end.line - 1, funcNode.loc.end.column)
                        );

                        symbols.push({
                            name: funcNode.name,
                            kind: 'function',
                            loc: funcRange,
                            docComment: funcNode.leadingComments ? extractDocFromComments(funcNode.leadingComments) : undefined
                        });

                        if (funcNode.arguments.length > 5) {
                            issues.push({
                                code: 'too-many-params',
                                message: `Function ${funcNode.name} has too many parameters (${funcNode.arguments.length}). Consider refactoring.`,
                                range: funcRange,
                                severity: vscode.DiagnosticSeverity.Warning,
                                source: 'PHlex'
                            });
                        }

                        funcNode.arguments.forEach((arg: any) => {
                            let argName = '';
                            if (typeof arg === 'string') {
                                argName = arg;
                            } else if (arg.name && typeof arg.name === 'string') {
                                argName = arg.name;
                            } else if (arg.name && arg.name.name) {
                                argName = arg.name.name;
                            }

                            if (argName && funcNode.loc) {
                                const startPos = new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column);
                                const endPos = new vscode.Position(funcNode.loc.start.line - 1, funcNode.loc.start.column + argName.length);
                                symbols.push({
                                    name: argName,
                                    kind: 'parameter',
                                    loc: new vscode.Range(startPos, endPos),
                                    scope: funcNode.name
                                });
                            }
                        });
                    }
                }
            });
        }

        diagnostics.set(uri, issues);
        symbolTables.set(uri.toString(), symbols);

    } catch (error) {
        console.error('Analyzer Outer Error:', error);
        vscode.window.showWarningMessage('PHlex could not analyze this PHP code.');
        symbolTables.delete(uri.toString());
    }
}

function extractDocFromComments(comments: any[]): string | undefined {
    if (!comments) return undefined;

    const docLines = comments
        .map(c => c.value)
        .filter((text: string) => text.startsWith('*') || text.startsWith('**'))
        .join('\n');

    return docLines || undefined;
}

async function runOllama(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const process = cp.spawn('ollama', ['run', 'llama3']);

        let data = '';
        let errorData = '';

        process.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        process.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve(data.trim());
            } else {
                reject(new Error(`Ollama process exited with code ${code}: ${errorData}`));
            }
        });

        // Schrijf prompt naar stdin van het proces
        process.stdin.write(prompt);
        process.stdin.end();
    });
}


export function deactivate() {}
 