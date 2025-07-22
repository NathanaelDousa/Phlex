# 🧠 PHPlex - AI-Powered PHP Tools for VS Code

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

| Command Name                             | Description                                                   |
|------------------------------------------|---------------------------------------------------------------|
| `PHPlex: Scan file with AI`              | Analyzes the current file and provides smart AI suggestions   |
| `PHPlex: Add inline comments`            | Automatically adds meaningful comments to functions and classes |
| `PHPlex: Convert to OOP`                 | Refactors procedural code into object-oriented PHP            |
| `PHPlex: Generate file documentation`    | Creates clean Markdown docs based on the current PHP file     |

---

## 📄 Feature Breakdown

### ✅ `Scan file with AI`

Uses LLaMA 3 to analyze your code and suggest improvements, including:
- Code quality enhancements
- Architectural suggestions
- Security tips
- Best practices

Output is shown in the **AI PHP Scanner** output tab.

---

### 💬 `Add inline comments`

Adds descriptive inline comments to your PHP code using AI:
- Great for onboarding and team collaboration
- Helps document complex functions
- Promotes consistent commenting style

---

### 🧱 `Convert to OOP`

Transforms legacy or procedural PHP into modern, object-oriented code:
- Wraps logic into classes
- Converts functions to methods
- Automatically generates constructors, properties, and more

Perfect for modernization and refactoring efforts.

---

### 📘 `Generate file documentation`

Creates a detailed Markdown documentation file from your current PHP file:
- File summary
- Class descriptions
- Method breakdowns with parameters, return types
- Example usages

The documentation is saved to `/docs/[filename].md` and auto-opened.

---

## 📦 Requirements

- ✅ Supports `.php` files only
- ✅ Requires a local [Ollama](https://ollama.com) instance with the `llama3` model
- ✅ Must be run inside a VS Code **workspace**

---

## 🚀 Roadmap

- [ ] Analyze multiple files at once
- [ ] Choose from multiple AI models (Mistral, CodeLlama, etc.)
- [ ] Built-in chat assistant (sidebar UI)
- [ ] Right-click context menu support

---

## ❤️ Contribute

Contributions are welcome! Feel free to submit issues, ideas, or pull requests. This is an actively evolving project.

---

## 🧠 Powered By

- [Ollama](https://ollama.com)
- [Meta LLaMA 3](https://ai.meta.com/llama/)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**PHPlex – Building smarter PHP, one AI command at a time.**
