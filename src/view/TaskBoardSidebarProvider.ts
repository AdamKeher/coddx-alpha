import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class TaskBoardSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ak74-taskboard-sidebar';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    const stats = await this._getCurrentStats();
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, stats);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'openTaskBoard':
          vscode.commands.executeCommand('extension.taskboard');
          break;
      }
    });

    if (stats) {
      this._updateBadgeFromStats(stats);
    }
  }

  private async _getCurrentStats() {
    const configuration = vscode.workspace.getConfiguration();
    const fileList: string = configuration.get('ak74.taskBoard.fileList') || 'TODO.md';
    const filesArr = fileList.split(',').map(str => str.trim());
    const selectedFile = filesArr[0];

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return null;

    let content = '';
    let found = false;
    for (const folder of workspaceFolders) {
      const fullPath = path.join(folder.uri.fsPath, selectedFile);
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf8');
        found = true;
        break;
      }
    }

    if (!found) {
      if (!selectedFile.includes('/') && !selectedFile.includes('\\')) {
        const files = await vscode.workspace.findFiles(`**/${selectedFile}`, null, 1);
        if (files.length > 0) {
          const fileData = await vscode.workspace.fs.readFile(files[0]);
          content = Buffer.from(fileData).toString('utf8');
          found = true;
        }
      }
    }

    if (!found) return null;
    return this._getStats(content);
  }

  public async updateBadge() {
    const stats = await this._getCurrentStats();
    if (!stats) return;

    this._updateBadgeFromStats(stats);

    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateStats',
        stats: stats
      });
    }
  }

  private _updateBadgeFromStats(stats: any) {
    let inProgressCount = 0;
    for (const colName in stats.columns) {
      if (this._isInProgressColumn(colName)) {
        inProgressCount += stats.columns[colName];
      }
    }

    if (this._view) {
      this._view.badge = {
        value: inProgressCount,
        tooltip: `${inProgressCount} tasks in progress`
      };
    }
  }

  private _getStats(md: string) {
    const columns: { [key: string]: number } = {};
    let total = 0;
    let lastColName = '';
    const lines = md.split('\n');
    let listFound = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('### ')) {
        listFound = true;
        lastColName = trimmedLine.replace('### ', '').trim();
        if (!columns[lastColName]) {
          columns[lastColName] = 0;
        }
        continue;
      }

      if (!listFound || !lastColName) continue;

      if (line.match(/^(\s*)[-*]\s*(?:\[[ xX]\]|\([ xX]\))\s/)) {
        columns[lastColName]++;
        total++;
      }
    }

    return {
      columns,
      total,
      columnOrder: Object.keys(columns)
    };
  }

  private _isTodoColumn(columnName: string) {
    return columnName.toLowerCase().startsWith('todo');
  }

  private _isDoneColumn(columnName: string) {
    const lowerColName = columnName.toLowerCase();
    return lowerColName.indexOf('[x]') >= 0 || lowerColName.indexOf('✓') >= 0 || lowerColName.indexOf('done') >= 0 || lowerColName.indexOf('completed') >= 0;
  }

  private _isArchivedColumn(columnName: string) {
    const lowerColName = columnName.toLowerCase();
    return lowerColName.indexOf('archive') >= 0 || lowerColName.indexOf('archived') >= 0;
  }

  private _isInProgressColumn(columnName: string) {
    if (!columnName) return false;
    return !this._isTodoColumn(columnName) && !this._isDoneColumn(columnName) && !this._isArchivedColumn(columnName);
  }

  private _getHtmlForWebview(webview: vscode.Webview, initialStats: any) {
    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					body {
						display: flex;
						flex-direction: column;
						min-height: 100vh;
						margin: 0;
						padding: 15px;
						color: var(--vscode-foreground);
						font-family: var(--vscode-font-family);
            box-sizing: border-box;
					}
					.stats-grid {
						width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
					}
          .stat-item {
            background-color: rgba(255, 255, 255, 0.05);
            padding: 12px 8px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .stat-value {
            font-size: 1.8em;
            font-weight: bold;
            display: block;
            line-height: 1.2;
          }
          .stat-label {
            font-size: 0.75em;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 4px;
          }
          .stat-item.in-progress {
            background-color: rgba(0, 122, 204, 0.1);
            border-color: rgba(0, 122, 204, 0.3);
          }
          .stat-item.in-progress .stat-value {
            color: var(--vscode-textLink-foreground);
          }
          .stat-item.total {
            grid-column: span 2;
            background-color: rgba(255, 255, 255, 0.1);
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 8px 15px;
          }
          .stat-item.total .stat-value {
            font-size: 1.2em;
          }
          .stat-item.total .stat-label {
            font-size: 0.9em;
            margin-top: 0;
          }
					button {
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 8px 12px;
						cursor: pointer;
						font-size: 1em;
            width: 100%;
            border-radius: 2px;
            margin-bottom: 15px;
					}
					button:hover {
						background-color: var(--vscode-button-hoverBackground);
					}
          .empty-state {
            text-align: center;
            opacity: 0.6;
            margin-top: 40px;
            font-style: italic;
          }
				</style>
			</head>
			<body>
				<div id="stats-grid" class="stats-grid">
          <!-- Dynamically populated -->
        </div>

				<button onclick="openBoard()">Open Full Task Board</button>

				<script>
					const vscode = acquireVsCodeApi();
					const gridEl = document.getElementById('stats-grid');
          
          // Use initial stats if provided
          const initialStats = ${JSON.stringify(initialStats)};
          if (initialStats) {
            renderStats(initialStats);
          }

					function openBoard() {
						vscode.postMessage({ type: 'openTaskBoard' });
					}

          function isTodo(name) {
            return name.toLowerCase().startsWith('todo');
          }

          function isDone(name) {
            const n = name.toLowerCase();
            return n.indexOf('[x]') >= 0 || n.indexOf('✓') >= 0 || n.indexOf('done') >= 0 || n.indexOf('completed') >= 0;
          }

          function isArchived(name) {
            const n = name.toLowerCase();
            return n.indexOf('archive') >= 0 || n.indexOf('archived') >= 0;
          }

          function isInProgress(name) {
            return !isTodo(name) && !isDone(name) && !isArchived(name);
          }

					window.addEventListener('message', event => {
						const message = event.data;
						switch (message.type) {
							case 'updateStats':
								renderStats(message.stats);
								break;
						}
					});

          function renderStats(stats) {
            if (!stats || !stats.columns || Object.keys(stats.columns).length === 0) {
              gridEl.innerHTML = '<div class="empty-state">No tasks found.</div>';
              return;
            }

            let html = '';
            for (const colName of stats.columnOrder) {
              const count = stats.columns[colName];
              const classes = ['stat-item'];
              if (isInProgress(colName)) classes.push('in-progress');
              
              html += \`
                <div class="\${classes.join(' ')}">
                  <span class="stat-value">\${count}</span>
                  <span class="stat-label">\${colName}</span>
                </div>
              \`;
            }

            html += \`
              <div class="stat-item total">
                <span class="stat-label">Total Tasks</span>
                <span class="stat-value">\${stats.total}</span>
              </div>
            \`;

            gridEl.innerHTML = html;
          }
				</script>
			</body>
			</html>`;
  }
}
