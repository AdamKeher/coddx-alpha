// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import { telemetry } from './view/app/Utils';

import TaskBoardLoader from './view/TaskBoardLoader';
import { TaskBoardSidebarProvider } from './view/TaskBoardSidebarProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new TaskBoardSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TaskBoardSidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Update badge on start
  sidebarProvider.updateBadge();

  // Update badge when TODO.md or related files change
  const configuration = vscode.workspace.getConfiguration();
  const fileList: string = configuration.get('ak74.taskBoard.fileList') || 'TODO.md';
  const filesArr = fileList.split(',').map(str => str.trim());

  filesArr.forEach(file => {
    const watcher = vscode.workspace.createFileSystemWatcher(`**/${file}`);
    watcher.onDidChange(() => sidebarProvider.updateBadge());
    watcher.onDidCreate(() => sidebarProvider.updateBadge());
    watcher.onDidDelete(() => sidebarProvider.updateBadge());
    context.subscriptions.push(watcher);
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let taskBoardCmd = vscode.commands.registerCommand('extension.taskboard', (uri: vscode.Uri) => {
    TaskBoardLoader.createOrShow(context, uri);
  });
  context.subscriptions.push(taskBoardCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // telemetry.dispose();
}
