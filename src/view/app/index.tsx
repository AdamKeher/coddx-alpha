import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './index.css';
import { IConfig } from './model';
// import Config from "./config";

import TaskBoard from './components/TaskBoard/TaskBoard';

declare global {
  interface Window {
    acquireVsCodeApi(): any;
    initialData: IConfig;
  }
}

const vscode = window.acquireVsCodeApi();

// Sync persisted state to session state immediately if session state is empty
const sessionState = vscode.getState();
if ((!sessionState || Object.keys(sessionState).length === 0) && window.initialData.savedState) {
  vscode.setState(window.initialData.savedState);
}

ReactDOM.render(<TaskBoard vscode={vscode} initialData={window.initialData} />, document.getElementById('root'));
