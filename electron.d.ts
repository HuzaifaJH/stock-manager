export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, data: any): Promise<any>;
      };
    };
  }
}
