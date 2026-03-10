export interface IConfig {
  name: string;
  description?: string;
  // TaskBoard fields
  path?: string;
  dataString?: string;
  fileList?: string;
  selectedFile?: string;
  savedState?: any;
}

export interface ICommand {
  action: CommandAction;
  content: IConfig;
}

export enum CommandAction {
  ShowMessage,
  Save,
  Load,
  OpenFile,
  SaveState,
  AiRefine
}
