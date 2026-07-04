export const ARC_EXPLORER_TX_BASE = "https://testnet.arcscan.app/tx";
export const ARC_TESTNET_NETWORK = "eip155:5042002";
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";
export const ARC_TESTNET_GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

export const KLEOS_AGENT_WALLET =
  process.env.KLEOS_AGENT_WALLET ??
  process.env.OBOL_AGENT_WALLET ??
  "0x3a074d1050340eea8022df3359bc517431303e58";

export const KLEOS_SELLER_WALLET =
  process.env.KLEOS_SELLER_WALLET ?? process.env.OBOL_SELLER_WALLET ?? KLEOS_AGENT_WALLET;

export const GATEWAY_BALANCE_USDC = Number(
  process.env.KLEOS_GATEWAY_BALANCE_USDC ?? process.env.OBOL_GATEWAY_BALANCE_USDC ?? "0.5",
);

export const GATEWAY_APPROVAL_TX =
  process.env.KLEOS_GATEWAY_APPROVAL_TX ??
  process.env.OBOL_GATEWAY_APPROVAL_TX ??
  "0x9392311878c7cb59f46786a83497afc8d12518563c8d3f00dd2dea5c31035d63";

export const GATEWAY_DEPOSIT_TX =
  process.env.KLEOS_GATEWAY_DEPOSIT_TX ??
  process.env.OBOL_GATEWAY_DEPOSIT_TX ??
  "0x46340b714c1cd406db8dafede42f8c10de08b5532905e301bae1ea9d4e599f31";

export const LIVE_X402_RECEIPT_ID =
  process.env.KLEOS_LIVE_X402_RECEIPT_ID ?? "0b795e06-3f01-4eff-b4f2-7fa9240781b1";

export const LIVE_X402_PAYER =
  process.env.KLEOS_LIVE_X402_PAYER ?? "0x44557bc24c1c475b7b251c3fa8efae7527d96bf7";

export const LIVE_X402_AMOUNT_USDC = Number(process.env.KLEOS_LIVE_X402_AMOUNT_USDC ?? "0.004");

export function arcExplorerTxUrl(txHash: string) {
  return `${ARC_EXPLORER_TX_BASE}/${txHash}`;
}
