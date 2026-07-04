import { createHash } from "crypto";
import { ARC_TESTNET_CHAIN_ID, KLEOS_SELLER_WALLET } from "./config";
import { getCatalogItems, getStore } from "./store";

const SOURCE_REGISTRY_CONTRACT = "SourceRegistry-ready-local-index";

function digest(seed: string) {
  return `0x${createHash("sha256").update(seed).digest("hex")}`;
}

function cid(seed: string) {
  return `ipfs://bafy${createHash("sha256").update(seed).digest("hex").slice(0, 46)}`;
}

export function buildSourceRegistry() {
  const store = getStore();
  const records = getCatalogItems().map((item) => {
    const splitDigest = digest(
      item.collaborators
        .map((creator) => `${creator.wallet}:${creator.splitBps}`)
        .sort()
        .join("|"),
    );
    const metadataCid = cid(`${item.id}:${item.title}:${item.sourceUrl}:${item.preview}`);
    const encryptedContentCid = cid(`${item.id}:${item.fullContent}`);
    const registryId = digest(`${KLEOS_SELLER_WALLET}:${item.id}:${metadataCid}`).slice(0, 42);
    const paidReads = store.payments.filter(
      (payment) => payment.itemId === item.id && payment.kind === "read",
    ).length;
    const citations = store.citationReceipts.filter((receipt) => receipt.itemId === item.id).length;

    return {
      registryId,
      itemId: item.id,
      title: item.title,
      sourceUrl: item.sourceUrl,
      owner: item.collaborators[0]?.wallet ?? KLEOS_SELLER_WALLET,
      creatorScopedId: digest(`${item.collaborators[0]?.id ?? "creator"}:${item.id}`).slice(0, 42),
      metadataCid,
      encryptedContentCid,
      splitDigest,
      splitBps: item.collaborators.map((creator) => ({
        creatorId: creator.id,
        displayName: creator.displayName,
        wallet: creator.wallet,
        splitBps: creator.splitBps,
      })),
      economics: {
        readTollUsdc: item.currentPriceUsdc,
        citationTollUsdc: item.citationPriceUsdc ?? Number((item.currentPriceUsdc * 0.35).toFixed(6)),
        paidReads,
        citations,
      },
      status: "indexed-arc-ready",
    };
  });

  return {
    name: "Kleos Source Registry",
    mode: "local-index-with-arc-contract-artifact",
    network: {
      name: "Arc Testnet",
      chainId: ARC_TESTNET_CHAIN_ID,
    },
    contract: {
      status: "artifact-ready",
      address: SOURCE_REGISTRY_CONTRACT,
      sourceFile: "contracts/SourceRegistry.sol",
      note:
        "Records are emitted by the local registry index today and match the deployable Arc SourceRegistry contract schema.",
    },
    records,
    totals: {
      sources: records.length,
      creatorWallets: new Set(records.flatMap((record) => record.splitBps.map((split) => split.wallet))).size,
      multiAuthorSources: records.filter((record) => record.splitBps.length > 1).length,
      paidReads: records.reduce((sum, record) => sum + record.economics.paidReads, 0),
      citations: records.reduce((sum, record) => sum + record.economics.citations, 0),
    },
  };
}

export function findSourceRegistryRecord(itemId: string) {
  return buildSourceRegistry().records.find((record) => record.itemId === itemId) ?? null;
}
