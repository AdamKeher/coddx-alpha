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

  public static createOrShow(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (TaskBoardLoader.currentPanel) {
      TaskBoardLoader.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    TaskBoardLoader.currentPanel = new TaskBoardLoader(context, uri);
  }

  private constructor(context: vscode.ExtensionContext, uri: vscode.Uri) {
    this._extensionPath = context.extensionPath;

    const configuration = vscode.workspace.getConfiguration();
    const fileList: string = configuration.get('ak74.taskBoard.fileList') || 'TODO.md';
    const filesArr = fileList.split(',').map(str => str.trim());
    this._selectedFile = filesArr[0];

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    this._panel = vscode.window.createWebviewPanel('taskBoard', 'AK74 Task Board', column || vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'configViewer'))],
      retainContextWhenHidden: true
    });

    const rootPath = deepFind(vscode, 'workspace.workspaceFolders[0].uri.fsPath', '') + '/';
    let basePath = '';

    if (uri && uri.fsPath) {
      basePath = uri.fsPath.replace(rootPath, '');
    }

    const fullPath = path.join(rootPath, this._selectedFile);
    const todoStr = this.getFileContent(vscode.Uri.file(fullPath)) || '';

    // Load persisted state
    const savedState = context.workspaceState.get('taskBoardState', {});

    this._panel.webview.html = this.getWebviewContent({
      basePath,
      templateString: todoStr,
      fileList,
      selectedFile: this._selectedFile,
      rootPath,
      savedState
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
          case CommandAction.SaveState:
            // Save state to workspaceState
            try {
              const state = JSON.parse(command.content.description);
              context.workspaceState.update('taskBoardState', state);
            } catch (e) {
              console.error('Failed to save task board state', e);
            }
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
          case CommandAction.AiRefine:
            const taskId = command.content.name;
            const taskContent = command.content.description || '';
            (async () => {
              try {
                const models = await vscode.lm.selectChatModels();
                if (!models || models.length === 0) {
                  this._panel.webview.postMessage({
                    action: 'aiRefineResponse',
                    taskId,
                    error: 'No AI models available. Please ensure GitHub Copilot or another VS Code AI extension is active.'
                  });
                  return;
                }
                const model = models[0];
                const prompt = `You are a professional task manager assistant. Rewrite the following task to be clear, concise, and actionable. Rules:\n- Keep the title on the first line\n- Add a brief description on subsequent lines only if it adds value\n- Preserve any checklist items using ( ) and (x) format\n- Do not use markdown headers or dashes for bullets\n- Output only the rewritten task content, nothing else\n\nTask:\n${taskContent}`;
                const messages = [vscode.LanguageModelChatMessage.User(prompt)];
                const cts = new vscode.CancellationTokenSource();
                const response = await model.sendRequest(messages, {}, cts.token);
                let result = '';
                for await (const chunk of response.text) {
                  result += chunk;
                }
                this._panel.webview.postMessage({
                    action: 'aiRefineResponse',
                    taskId,
                    result: result.trim()
                  });
                } catch (err: any) {
                  this._panel.webview.postMessage({
                    action: 'aiRefineResponse',
                    taskId,
                    error: (err as Error)?.message || 'AI refinement failed.'
                  });
                }            })();
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

  private getWebviewContent({ basePath, templateString, fileList, selectedFile, rootPath, savedState }): string {
    const reactAppPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'configViewer', 'configViewer.js'));
    const reactAppUri = this._panel.webview.asWebviewUri(reactAppPathOnDisk);
    const cspSource = this._panel.webview.cspSource;

    const initialData = {
      name: 'TaskBoard',
      path: basePath,
      dataString: templateString,
      fileList: fileList,
      selectedFile: selectedFile,
      savedState: savedState
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
                             script-src 'unsafe-eval' 'unsafe-inline' ${cspSource};
                             style-src ${cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com;
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

