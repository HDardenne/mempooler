export interface TransactionInfo {
  id: string;
  isSent: boolean;
  heightToSend: number;
  actions: { action: string; name: string }[];
}
