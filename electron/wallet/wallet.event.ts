export enum WalletEvent {
  createBid = 'createBidRequest',
  getApiKey = 'getApiKeyRequest',
  setApiKey = 'setApiKeyRequest',
  setWalletId = 'setWalletIdRequest',
  getWallets = 'getWalletsRequest',
  decodeTx = 'decodeTxRequest',
  lockCoins = 'lockCoinsRequest',
  unlockCoins = 'unlockCoinsRequest',
  verifyApiKey = 'verifyApiKeyRequest',
  getNamesInfo = 'getNamesInfoRequest',
  getCoins = 'getCoinsRequest'
}
export enum WalletEventResponse {
  createBid = 'createBidResponse',
  getApiKey = 'getApiKeyResponse',
  setApiKey = 'setApiKeyResponse',
  setWalletId = 'setWalletIdResponse',
  getWallets = 'getWalletsResponse',
  decodeTx = 'decodeTxResponse',
  lockCoins = 'lockCoinsResponse',
  unlockCoins = 'unlockCoinsResponse',
  verifyApiKey = 'verifyApiKeyResponse',
  getNamesInfo = 'getNamesInfoResponse',
  getCoins = 'getCoinsResponse'
}
