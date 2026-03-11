# Deployment Guide: AK74 TODO.md Kanban Task Board

This guide explains how to package and deploy this VS Code extension to multiple machines.

## 1. Package the Extension (.vsix)

To create a distributable package, follow these steps on your development machine:

1.  **Install dependencies:**
    ```powershell
    npm install
    ```
2.  **Package the extension:**
    Using `vsce` (VS Code Extension Manager), run the following command to generate a `.vsix` file:
    ```powershell
    npx @vscode/vsce package --no-yarn
    ```
    *Note: The `--no-yarn` flag ensures `npm` is used for the build process.*

3.  **Result:**
    A file named `ak74-todo-kanban-0.4.1.vsix` (or similar, depending on the version in `package.json`) will be created in the root directory.

---

## 2. Install on Target Machines

Once you have the `.vsix` file, you can install it on any machine running VS Code using one of these methods:

### Method A: Using VS Code UI (Recommended)
1.  Open **VS Code**.
2.  Open the **Extensions** view (`Ctrl+Shift+X`).
3.  Click the **...** (Views and More Actions) menu in the top-right corner of the Extensions pane.
4.  Select **Install from VSIX...**.
5.  Locate and select the `.vsix` file.

### Method B: Using the Command Line
1.  Open a terminal or command prompt.
2.  Run the following command:
    ```powershell
    code --install-extension ak74-todo-kanban-0.4.1.vsix
    ```

---

## 3. (Optional) Publish to VS Code Marketplace

For public distribution, you can publish the extension to the official marketplace:

1.  Create a publisher profile at [marketplace.visualstudio.com](https://marketplace.visualstudio.com/manage).
2.  Get a Personal Access Token (PAT) from Azure DevOps with "Marketplace (Publish)" scope.
3.  Run the following commands:
    ```powershell
    npx @vscode/vsce login <your-publisher-id>
    npx @vscode/vsce publish --no-yarn
    ```
