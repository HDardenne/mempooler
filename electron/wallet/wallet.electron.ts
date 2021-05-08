import fetch from 'node-fetch';
import { IpcMain, session } from 'electron';
import * as Store from 'electron-store';
import { WalletEvent } from '../wallet/wallet.event';
import { Utils } from '../utils';

let window: any;
let ipcMain: IpcMain;
let apiKey = '';
let walletId = '';

function register(
  eventName: WalletEvent,
  func: (e: any, a: any) => Promise<any>
) {
  Utils.register(window, ipcMain, eventName, func);
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
  return json;
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
  return json;
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
  return result;
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
  return result;
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
  return result;
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
  return result;
}

async function getCoins() {
  const request = await fetch(
    `http://x:${apiKey}@127.0.0.1:12039/wallet/${walletId}/coin`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const json = await request.json();
  return json;
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

  return valid;
}

module.exports = function (w: any, ipcm: IpcMain, store: Store) {
  window = w;
  ipcMain = ipcm;

  register(WalletEvent.setApiKey, async (e, a) => (apiKey = a));
  register(WalletEvent.getApiKey, async () => apiKey);
  register(WalletEvent.setWalletId, async (e, a) => (walletId = a));
  register(WalletEvent.getWallets, () => getWallets());
  register(WalletEvent.createBid, (e, a) => createBid(a));
  register(WalletEvent.decodeTx, (e, a) => decodeTx(a));
  register(WalletEvent.lockCoins, (e, a) => lockCoins(a));
  register(WalletEvent.unlockCoins, (e, a) => unlockCoins(a));
  register(WalletEvent.getCoins, () => getCoins());
  register(WalletEvent.verifyApiKey, (e, a) => verifyApiKey(a));
  register(WalletEvent.getNamesInfo, (e, a) => getNamesInfo(a));
};
