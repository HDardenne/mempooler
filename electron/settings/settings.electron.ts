import fetch from 'node-fetch';
import { IpcMain, session } from 'electron';
import * as Store from 'electron-store';
import { SettingEvent } from './settings.event';
import { Utils } from '../utils';

let window: any;
let ipcMain: IpcMain;

function register(
  eventName: SettingEvent,
  func: (e: any, a: any) => Promise<any>
) {
  Utils.register(window, ipcMain, eventName, func);
}

module.exports = function (w: any, ipcm: IpcMain, store: Store) {
  window = w;
  ipcMain = ipcm;

  register(SettingEvent.getSetting, async (e, key: string) => store.get(key));
  register(
    SettingEvent.setSetting,
    async (e, data: { key: string; value: any }) => {
      store.set(data.key, data.value);
      return data;
    }
  );
};
