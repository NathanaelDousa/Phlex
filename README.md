![Phplex](https://github.com/user-attachments/assets/96db791a-34a0-47a8-8ade-504cb1c9c02c)

**PHPlex** is a powerful Visual Studio Code extension that brings artificial intelligence into your PHP development workflow. Whether you're modernizing legacy code, generating documentation, or improving readability — PHPlex helps you code faster, cleaner, and smarter.

Powered by [Ollama](https://ollama.com) and LLaMA 3.

---

## ⚡ Quick Start

1. Install [Ollama](https://ollama.com) locally and verify `ollama run llama3` works in your terminal.
2. Open your PHP project in VS Code.
3. Install this extension.
4. Open any `.php` file.
5. Launch one of the smart commands from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).

---

## 🛠 Available Commands

| Command Name                 | Description                                                        |
|-----------------------------|--------------------------------------------------------------------|
| `phplex scan`               | Analyzes the current PHP file and provides insightful AI suggestions to improve your code. |
| `phplex comment code`       | Automatically inserts meaningful inline comments for functions and classes to improve code readability. |
| `phplex convert to oop`     | Refactors procedural PHP code into clean, maintainable object-oriented PHP classes and methods. |
| `phplex generate documentation` | Generates detailed Markdown documentation from the current PHP file, including summaries, method info, and examples. |
| `phplex create mvc`         | Generates a basic MVC (Model-View-Controller) structure tailored for your PHP project. |
| `phplex create service`     | Creates a service class template to help organize business logic cleanly and efficiently. |
| `phplex create singleton`   | Generates a singleton pattern class template to manage single-instance objects in your application. |
| `phplex create API endpoint`| Scaffolds a new PHP API endpoint with routing, request handling, and response formatting. |


---

## 📄 Command Details

### `phplex scan`  
This command analyzes your current PHP file using advanced AI models. It detects bugs, potential vulnerabilities, and code smells while suggesting precise improvements to optimize performance and code quality.

### `phplex comment code`  
Automatically generates inline comments for your PHP classes, methods, and functions. It explains the purpose, parameters, and expected output, making your code more understandable and maintainable without manual effort.

### `phplex convert to oop`  
Convert your legacy or procedural PHP scripts into a clean, modular object-oriented structure. This command helps organize your code into classes and objects following best practices and modern PHP standards.

### `phplex generate documentation`  
Produce clear, structured Markdown documentation based on your PHP source file. It includes a file overview, class and method summaries, detailed parameter lists, return types, and example code snippets for easy sharing and onboarding.

### `phplex create mvc`  
Quickly scaffold a ready-to-use MVC architecture foundation in your PHP project. This creates sample Model, View, and Controller files, enabling you to focus on building your application logic instead of boilerplate setup.

### `phplex create service`  
Generate a service class template designed to separate business logic from controllers and models. This promotes clean code organization, facilitates testing, and enhances application maintainability.

### `phplex create singleton`  
Generate a singleton design pattern template ensuring a class is instantiated only once throughout your application lifecycle. Ideal for managing shared resources like database connections or configurations globally.

### `phplex create API endpoint`  
Automatically scaffold a fully functional RESTful API endpoint. This command includes routing setup, input validation, and JSON response formatting, so you can quickly expose backend functionality to front-end or third-party applications.

---

## 📦 Requirements

- ✅ Supports `.php` files only
- ✅ Requires a local [Ollama](https://ollama.com) instance with the `llama3` model
- ✅ Must be run inside a VS Code **workspace**

---

## 🚀 Roadmap

- [x] Analyze multiple files at once
- [x] Add hotkeys for commands
- [ ] Built-in chat assistant (sidebar UI)
- [ ] Right-click context menu support

---

## ❤️ Contribute

Contributions are welcome! Feel free to submit issues, ideas, or pull requests. This is an actively evolving project.

---

## 🧠 Powered By

- [Ollama](https://ollama.com)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**PHPlex – Building smarter PHP, one AI command at a time.**
