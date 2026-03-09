import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { IConfig, ICommand, CommandAction } from './app/model';
import { deepFind, VER } from './app/Utils';

export default class TaskBoardLoader {
  public static currentPanel: TaskBoardLoader | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  private _selectedFile: string = '';

  public static createOrShow(extensionPath: string, uri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (TaskBoardLoader.currentPanel) {
      TaskBoardLoader.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    TaskBoardLoader.currentPanel = new TaskBoardLoader(extensionPath, uri);
  }

  private constructor(extensionPath: string, uri: vscode.Uri) {
    this._extensionPath = extensionPath;

    const configuration = vscode.workspace.getConfiguration();
    const fileList: string = configuration.get('ak74.taskBoard.fileList') || 'TODO.md';
    const filesArr = fileList.split(',').map(str => str.trim());
    this._selectedFile = filesArr[0];

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    this._panel = vscode.window.createWebviewPanel('taskBoard', 'AK74 Task Board', column || vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'configViewer'))],
      retainContextWhenHidden: true
    });

    const rootPath = deepFind(vscode, 'workspace.workspaceFolders[0].uri.fsPath', '') + '/';
    let basePath = '';

    if (uri && uri.fsPath) {
      basePath = uri.fsPath.replace(rootPath, '');
    }

    const fullPath = path.join(rootPath, this._selectedFile);
    const todoStr = this.getFileContent(vscode.Uri.file(fullPath)) || '';

    this._panel.webview.html = this.getWebviewContent({
      basePath,
      templateString: todoStr.replace(/`/g, '\\`').replace(/\$/g, '\\$'),
      fileList,
      selectedFile: this._selectedFile,
      rootPath
    });

    vscode.workspace.onDidSaveTextDocument((e) => {
      const fullPath = path.join(rootPath, this._selectedFile);
      if (e.fileName.toLowerCase() === vscode.Uri.file(fullPath).fsPath.toLowerCase()) {
        const todoStr = this.getFileContent(vscode.Uri.file(fullPath));
        this._panel.webview.postMessage({
          action: 'updateData',
          dataString: todoStr || ''
        });
      }
    }, null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (command: ICommand) => {
        switch (command.action) {
          case CommandAction.ShowMessage:
            vscode.window.showInformationMessage(command.content.description);
            break;
          case CommandAction.OpenFile:
            const filePath2 = path.join(rootPath, this._selectedFile || 'TODO.md');
            vscode.window.showTextDocument(vscode.Uri.file(filePath2));
            break;
          case CommandAction.Save:
            this.saveFileContent(command.content);
            break;
          case CommandAction.Load:
            this._selectedFile = command.content.description || 'TODO.md';
            const filePath3 = path.join(rootPath, this._selectedFile);
            const todoStr = this.getFileContent(vscode.Uri.file(filePath3));
            this._panel.webview.postMessage({
              action: 'updateData',
              dataString: todoStr || '',
              selectedFile: this._selectedFile
            });
            break;
        }
      },
      undefined,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    TaskBoardLoader.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private getWebviewContent({ basePath, templateString, fileList, selectedFile, rootPath }): string {
    const reactAppPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'configViewer', 'configViewer.js'));
    const reactAppUri = reactAppPathOnDisk.with({ scheme: 'vscode-resource' });

    const initialData = {
      name: 'TaskBoard',
      path: basePath,
      dataString: templateString,
      fileList: fileList,
      selectedFile: selectedFile
    };

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Board</title>
        <meta http-equiv="Content-Security-Policy"
                    content="default-src 'none';
                             img-src https:;
                             script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
                             style-src vscode-resource: 'unsafe-inline' https://cdnjs.cloudflare.com;
                             font-src https://cdnjs.cloudflare.com;">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <script>
          window.acquireVsCodeApi = acquireVsCodeApi;
          window.initialData = ${JSON.stringify(initialData)};
        </script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
  }

  private getFileContent(fileUri: vscode.Uri) {
    if (fs.existsSync(fileUri.fsPath)) {
      return fs.readFileSync(fileUri.fsPath, 'utf8');
    }
    return undefined;
  }

  private saveFileContent(config: IConfig) {
    const content = config.description;
    const rootPath = deepFind(vscode, 'workspace.workspaceFolders[0].uri.fsPath', '') + '/';
    const filePath = path.join(rootPath, this._selectedFile || 'TODO.md');
    fs.writeFileSync(filePath, content);
  }
}

