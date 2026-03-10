import { ICommand, CommandAction } from './model';

export const VER = '0.4.0'; // TODO: get this from package.json.

// const TelemetryReporter = require('vscode-extension-telemetry');
// const extensionId = 'coddx-alpha';
// const extensionVersion = '0.2.11';
// const key = '';
// export const telemetry = new TelemetryReporter(extensionId, extensionVersion, key); // TODO: this crashed!

export function jsonClone(obj: any) {
  if (!obj) {
    return obj; // null or undefined
  }
  return JSON.parse(JSON.stringify(obj));
}

export function deepFind(obj: any, path: string, defaultValue: any) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

export const sendCommand = (vscode: any, action: CommandAction, dataStr: string) => {
  let command: ICommand = {
    action: action,
    content: {
      name: '',
      description: dataStr
    }
  };
  if (vscode.postMessage) {
    vscode.postMessage(command);
  }
};

export function getVscodeHelper(vscode: any) {
  return {
    saveState: (state: any) => {
      if (vscode.postMessage) {
        vscode.postMessage({
          action: CommandAction.SaveState,
          content: {
            name: '',
            description: JSON.stringify(state)
          }
        });
      }
    },
    getState: () => (vscode.getState ? vscode.getState() : {}) || {},
    setState: (state: any) => {
      if (vscode.setState) {
        vscode.setState(state);
      }
      // Also send to extension for persistence
      if (vscode.postMessage) {
        vscode.postMessage({
          action: CommandAction.SaveState,
          content: {
            name: '',
            description: JSON.stringify(state)
          }
        });
      }
    },
    showMessage: (msg: string) =>
      vscode.postMessage({
        action: CommandAction.ShowMessage,
        content: {
          name: '',
          description: msg
        }
      }),
    saveList: (dataStr: string) => {
      let command: ICommand = {
        action: CommandAction.Save,
        content: {
          name: '',
          description: dataStr
        }
      };
      if (vscode.postMessage) {
        vscode.postMessage(command);
      }
    },
    aiRefine: (taskId: string, content: string) => {
      if (vscode.postMessage) {
        vscode.postMessage({
          action: CommandAction.AiRefine,
          content: { name: taskId, description: content }
        });
      }
    }
  };
}
