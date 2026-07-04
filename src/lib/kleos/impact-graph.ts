import { makeHash } from "./charon";
import { getLedgerSnapshot } from "./ledger";

type ImpactNodeType =
  | "source"
  | "creator"
  | "read_payment"
  | "citation_receipt"
  | "answer_settlement"
  | "claim_trace"
  | "payout_split"
  | "impact_grant"
  | "cashout";

type ImpactEdgeType =
  | "unlocked_by"
  | "cited_by"
  | "supports_claim"
  | "settles_answer"
  | "split_to"
  | "impact_rewarded"
  | "cashout_aggregates";

export type ImpactGraphNode = {
  id: string;
  type: ImpactNodeType;
  label: string;
  amountUsdc?: number;
  score?: number;
  proofHash: string;
};

export type ImpactGraphEdge = {
  id: string;
  type: ImpactEdgeType;
  from: string;
  to: string;
  amountUsdc?: number;
  proofHash: string;
};

function addNode(nodes: Map<string, ImpactGraphNode>, node: Omit<ImpactGraphNode, "proofHash">) {
  if (nodes.has(node.id)) {
    return;
  }

  nodes.set(node.id, {
    ...node,
    proofHash: makeHash(`kleos-impact-node-v1:${node.id}:${node.type}:${node.label}:${node.amountUsdc ?? ""}`),
  });
}

function edge(input: Omit<ImpactGraphEdge, "id" | "proofHash">): ImpactGraphEdge {
  const id = `edge_${makeHash(`${input.type}:${input.from}:${input.to}:${input.amountUsdc ?? ""}`).slice(-12)}`;
  return {
    id,
    ...input,
    proofHash: makeHash(`kleos-impact-edge-v1:${input.type}:${input.from}:${input.to}:${input.amountUsdc ?? ""}`),
  };
}

export function buildImpactGraph() {
  const ledger = getLedgerSnapshot();
  const nodes = new Map<string, ImpactGraphNode>();
  const edges: ImpactGraphEdge[] = [];

  for (const item of ledger.catalog) {
    addNode(nodes, {
      id: `source:${item.id}`,
      type: "source",
      label: item.title,
      score: Math.round((item.credibilityScore + item.freshnessScore) / 2),
    });
  }

  for (const creator of ledger.creators) {
    addNode(nodes, {
      id: `creator:${creator.id}`,
      type: "creator",
      label: creator.displayName,
      score: creator.reputation,
    });
  }

  for (const payment of ledger.payments) {
    if (payment.kind !== "read") {
      continue;
    }

    addNode(nodes, {
      id: `payment:${payment.id}`,
      type: "read_payment",
      label: `${payment.amountUsdc.toFixed(4)} USDC read toll`,
      amountUsdc: payment.amountUsdc,
    });
    edges.push(
      edge({
        type: "unlocked_by",
        from: `source:${payment.itemId}`,
        to: `payment:${payment.id}`,
        amountUsdc: payment.amountUsdc,
      }),
    );
  }

  for (const receipt of ledger.citationReceipts) {
    addNode(nodes, {
      id: `receipt:${receipt.id}`,
      type: "citation_receipt",
      label: receipt.claim,
      amountUsdc: receipt.citationTollUsdc,
      score: receipt.confidence,
    });
    edges.push(
      edge({
        type: "cited_by",
        from: `source:${receipt.itemId}`,
        to: `receipt:${receipt.id}`,
        amountUsdc: receipt.citationTollUsdc,
      }),
    );
    edges.push(
      edge({
        type: "cited_by",
        from: `payment:${receipt.readPaymentId}`,
        to: `receipt:${receipt.id}`,
        amountUsdc: receipt.citationTollUsdc,
      }),
    );
  }

  for (const settlement of ledger.answerSettlements) {
    addNode(nodes, {
      id: `answer:${settlement.id}`,
      type: "answer_settlement",
      label: `Answer ${settlement.answerHash.slice(0, 10)}`,
      amountUsdc: Number((settlement.readTollUsdc + settlement.citationTollUsdc).toFixed(6)),
    });

    for (const itemId of settlement.citedItemIds) {
      edges.push(
        edge({
          type: "settles_answer",
          from: `source:${itemId}`,
          to: `answer:${settlement.id}`,
        }),
      );
    }

    for (const receipt of ledger.citationReceipts.filter((entry) => entry.sessionId === settlement.sessionId)) {
      edges.push(
        edge({
          type: "settles_answer",
          from: `receipt:${receipt.id}`,
          to: `answer:${settlement.id}`,
          amountUsdc: receipt.citationTollUsdc,
        }),
      );
    }
  }

  for (const trace of ledger.claimTraces) {
    addNode(nodes, {
      id: `claim:${trace.id}`,
      type: "claim_trace",
      label: trace.claim,
      score: trace.coveragePct,
    });

    for (const receiptId of trace.citationReceiptIds) {
      edges.push(
        edge({
          type: "supports_claim",
          from: `receipt:${receiptId}`,
          to: `claim:${trace.id}`,
        }),
      );
    }
  }

  for (const split of ledger.payoutSplits) {
    addNode(nodes, {
      id: `split:${split.id}`,
      type: "payout_split",
      label: `${split.splitBps / 100}% collaborator split`,
      amountUsdc: split.amountUsdc,
    });
    edges.push(
      edge({
        type: "split_to",
        from: `payment:${split.paymentId}`,
        to: `split:${split.id}`,
        amountUsdc: split.amountUsdc,
      }),
    );
    edges.push(
      edge({
        type: "split_to",
        from: `split:${split.id}`,
        to: `creator:${split.creatorId}`,
        amountUsdc: split.amountUsdc,
      }),
    );
  }

  for (const grant of ledger.impactGrants) {
    addNode(nodes, {
      id: `impact:${grant.id}`,
      type: "impact_grant",
      label: grant.reason,
      amountUsdc: grant.amountUsdc,
      score: grant.impactScore,
    });
    edges.push(
      edge({
        type: "impact_rewarded",
        from: `receipt:${grant.receiptId}`,
        to: `impact:${grant.id}`,
        amountUsdc: grant.amountUsdc,
      }),
    );
    edges.push(
      edge({
        type: "impact_rewarded",
        from: `impact:${grant.id}`,
        to: `creator:${grant.creatorId}`,
        amountUsdc: grant.amountUsdc,
      }),
    );
  }

  for (const cashout of ledger.creatorCashouts) {
    addNode(nodes, {
      id: `cashout:${cashout.id}`,
      type: "cashout",
      label: cashout.status,
      amountUsdc: cashout.amountUsdc,
    });
    edges.push(
      edge({
        type: "cashout_aggregates",
        from: `creator:${cashout.creatorId}`,
        to: `cashout:${cashout.id}`,
        amountUsdc: cashout.amountUsdc,
      }),
    );
  }

  const nodeList = Array.from(nodes.values());
  const usedNodeIds = new Set(edges.flatMap((item) => [item.from, item.to]));
  const connectedNodes = nodeList.filter((node) => usedNodeIds.has(node.id));
  const graphHash = makeHash(
    JSON.stringify({
      nodes: connectedNodes.map((node) => node.proofHash).sort(),
      edges: edges.map((item) => item.proofHash).sort(),
    }),
  );
  const valueFlowUsdc = Number(
    edges.reduce((sum, item) => sum + (item.amountUsdc ?? 0), 0).toFixed(6),
  );

  return {
    schema: "kleos.impact-graph.v1",
    generatedAt: new Date().toISOString(),
    graphHash,
    summary: {
      nodes: connectedNodes.length,
      edges: edges.length,
      sources: connectedNodes.filter((node) => node.type === "source").length,
      creators: connectedNodes.filter((node) => node.type === "creator").length,
      citationReceipts: connectedNodes.filter((node) => node.type === "citation_receipt").length,
      claimTraces: connectedNodes.filter((node) => node.type === "claim_trace").length,
      valueFlowUsdc,
    },
    nodes: connectedNodes,
    edges,
  };
}
