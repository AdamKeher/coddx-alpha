export interface IConfig {
  name: string;
  description?: string;
  users?: IUser[];
  // TaskBoard fields
  path?: string;
  dataString?: string;
  fileList?: string;
  selectedFile?: string;
  savedState?: any;
}
export interface IUser {
  name: string;
  active: boolean;
  roles: string[];
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
  GenerateFiles,
  SaveState
}
