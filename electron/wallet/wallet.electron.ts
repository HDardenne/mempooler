import fetch from 'node-fetch';
import { IpcMain, session } from 'electron';
import * as Store from 'electron-store';
import { WalletEvent, WalletEventResponse } from '../wallet/wallet.event';

let window: any;
let ipcMain: IpcMain;
let apiKey = '';
let walletId = '';

function ret(eventName: WalletEventResponse, data: any) {
  window.webContents.send(eventName, data);
}

async function getWallets() {
  if (!apiKey) {
    throw new Error('No api key');
  }

  const bidRequest = await fetch(`http://x:${apiKey}@127.0.0.1:12039/wallet`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const json = await bidRequest.json();
  ret(WalletEventResponse.getWallets, json);
}

async function createBid(d: any) {
  const bidRequest = await fetch(
    `http://x:${apiKey}@127.0.0.1:12039/wallet/${walletId}/bid`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        passphrase: d.passphrase,
        name: d.name,
        broadcast: false,
        sign: true,
        bid: d.bid * 1000000,
        lockup: (d.bid + d.blind) * 1000000
      })
    }
  );

  const json = await bidRequest.json();
  ret(WalletEventResponse.createBid, json);
}

async function decodeTx(hexes: string[]) {
  const result = [];
  for (const hex of hexes) {
    const request = await fetch(`http://x:${apiKey}@127.0.0.1:12037`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'decoderawtransaction',
        params: [hex]
      })
    });

    const json = await request.json();
    result.push(json);
  }
  ret(WalletEventResponse.decodeTx, result);
}

async function getNamesInfo(names: string[]) {
  const result = [];
  for (const hex of names) {
    const request = await fetch(`http://x:${apiKey}@127.0.0.1:12037`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'getnameinfo',
        params: [hex]
      })
    });

    const json = await request.json();
    result.push(json);
  }
  ret(WalletEventResponse.getNamesInfo, result);
}

async function lockCoins(txs: { txid: any; index: any }[]) {
  const result = [];
  for (const t of txs) {
    const request = await fetch(
      `http://x:${apiKey}@127.0.0.1:12039/wallet/${walletId}/locked/${t.txid}/${t.index}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const json = await request.json();
    result.push(json);
  }
  ret(WalletEventResponse.lockCoins, result);
}

async function unlockCoins(txs: { txid: any; index: any }[]) {
  const result = [];
  for (const t of txs) {
    const request = await fetch(
      `http://x:${apiKey}@127.0.0.1:12039/wallet/${walletId}/locked/${t.txid}/${t.index}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const json = await request.json();
    result.push(json);
  }
  ret(WalletEventResponse.unlockCoins, result);
}

async function verifyApiKey(apiKey: string) {
  const valid = await fetch(`http://x:${apiKey}@127.0.0.1:12039/wallet`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
    .then(a => {
      return a.ok;
    })
    .catch(a => false);

  ret(WalletEventResponse.verifyApiKey, valid);
}

module.exports = function (w: any, ipcm: IpcMain, store: Store) {
  window = w;
  ipcMain = ipcm;

  ipcMain.on(WalletEvent.setApiKey, async (event: any, newApiKey: any) => {
    apiKey = newApiKey;
    ret(WalletEventResponse.setApiKey, newApiKey);
  });

  ipcMain.on(WalletEvent.getApiKey, (event: any) => {
    ret(WalletEventResponse.getApiKey, apiKey);
  });

  ipcMain.on(WalletEvent.setWalletId, (event: any, newWalletId: any) => {
    walletId = newWalletId;
    ret(WalletEventResponse.setWalletId, newWalletId);
  });
  ipcMain.on(WalletEvent.getWallets, () => getWallets());
  ipcMain.on(WalletEvent.createBid, (e, a) => createBid(a));
  ipcMain.on(WalletEvent.decodeTx, (e, a) => decodeTx(a));
  ipcMain.on(WalletEvent.lockCoins, (e, a) => lockCoins(a));
  ipcMain.on(WalletEvent.unlockCoins, (e, a) => unlockCoins(a));
  ipcMain.on(WalletEvent.verifyApiKey, (e, a) => verifyApiKey(a));
  ipcMain.on(WalletEvent.getNamesInfo, (e, a) => getNamesInfo(a));
};
