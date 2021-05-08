import { IpcMain } from 'electron';
import { EventType } from './eventType';

export class Utils {
  static register<T>(
    window: any,
    ipcMain: IpcMain,
    eventName: T,
    func: (e: any, a: any) => Promise<any>
  ) {
    ipcMain.on(eventName + EventType.Request, async (e, a) =>
      window.webContents.send(eventName + EventType.Response, await func(e, a))
    );
  }
}
