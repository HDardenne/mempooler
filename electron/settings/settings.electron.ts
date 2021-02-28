import fetch from 'node-fetch';
import { IpcMain, session } from 'electron';
import * as Store from 'electron-store';
import { SettingEvent, SettingEventResponse } from './settings.event';

let window: any;
let ipcMain: IpcMain;

function ret(eventName: SettingEventResponse, data: any) {
  window.webContents.send(eventName, data);
}

module.exports = function (w: any, ipcm: IpcMain, store: Store) {
  window = w;
  ipcMain = ipcm;

  ipcMain.on(SettingEvent.getSetting, async (event: any, key: string) => {
    const value = store.get(key);
    ret(SettingEventResponse.getSetting, value);
  });

  ipcMain.on(
    SettingEvent.setSetting,
    (event: any, data: { key: string; value: any }) => {
      store.set(data.key, data.value);
      ret(SettingEventResponse.setSetting, data);
    }
  );
};
