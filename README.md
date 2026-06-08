# DevFlow

> **Streamline your development workflow**: Open, explore, and manage all files related to a feature in parallel with a single click.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.120+-informational?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-yasshhhraj%2Fdevflow-blue?logo=github)](https://github.com/yasshhhraj/devflow)

## ✨ Features

### 🗂️ **Open Imported Files**
Instantly open all files in the import chain of your active file side-by-side. Navigate through your entire feature stack without manual tab hunting.

### 📋 **Copy Feature Chain**
Duplicate an entire import chain with a new feature name in seconds. Perfect for scaffolding new features based on existing patterns.

### 🧹 **Close Related Files**
Eliminate tab clutter by closing all related files at once, keeping your workspace clean and organized.

### ⚙️ **Configure Directories**
Whitelist specific directories for intelligent import scanning, giving you fine-grained control over which files are considered part of your feature.

## 🚀 Quick Start

### Installation
1. Open **Extensions** in VS Code (`Ctrl+Shift+X`)
2. Search for "DevFlow"
3. Click **Install**

### Usage

1. **Open any file** in your feature chain (e.g., `user.controller.ts`)
2. Open the **Command Palette** (`Ctrl+Shift+P`)
3. Choose one of the DevFlow commands:
   - `DevFlow: Open Feature Files` — Opens all related files
   - `DevFlow: Open Imported Files` — Opens the full import chain
   - `DevFlow: Copy Feature Chain as New Feature` — Scaffolds a new feature
   - `DevFlow: Close Related Files` — Cleans up related tabs
   - `DevFlow: Configure Feature Directories` — Manages directory whitelisting

## 💡 Use Cases

### Backend Development
Perfect for **layered architecture projects** with controllers, services, and repositories:
```
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
└── user.model.ts
```
Open the entire stack with one command.

### Feature Scaffolding
Building a new feature similar to an existing one?
- Use **Copy Feature Chain** to duplicate the entire layer stack
- Rename all files automatically
- Start coding immediately

### Workspace Organization
Keep your editor uncluttered:
- Open related files when needed
- Close them all at once when done
- Focus on what matters

## ⚙️ Configuration

### Whitelisted Directories
Control which directories are scanned for imports:

```json
{
  "devflow.whitelistedDirectories": [
    "controllers",
    "services",
    "repositories"
  ]
}
```

**Scope:** Resource (per-workspace configuration)

This setting ensures that only imports from specified directories are considered part of your feature chain.

## 📋 Requirements

- **VS Code:** 1.120.0 or higher
- **Project Structure:** Works best with layered backend projects (MVC, Clean Architecture, etc.)

## 🎯 Best For

- 🏗️ Monolithic backend applications with layered architecture
- 📦 Feature-driven development
- 🔄 Service-oriented architectures
- 🛠️ Teams managing complex import chains

## 📝 How It Works

DevFlow intelligently scans the import chain of your active file and:
1. Identifies all related files by tracing dependencies
2. Opens them in a clean, organized layout
3. Allows you to duplicate entire chains for new features
4. Respects your whitelist configuration for surgical precision

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 [Report bugs](https://github.com/yasshhhraj/devflow/issues)
- 💡 [Suggest features](https://github.com/yasshhhraj/devflow/issues)
- 🔀 [Submit pull requests](https://github.com/yasshhhraj/devflow/pulls)

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for developers who value their time**