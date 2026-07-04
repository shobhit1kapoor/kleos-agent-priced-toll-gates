#!/usr/bin/env node

const DEFAULT_ENDPOINT =
  process.env.KLEOS_MCP_ENDPOINT ??
  "https://kleos-agent-priced-toll-gates.vercel.app/api/mcp/rpc";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
}

const endpoint = argValue("--endpoint", DEFAULT_ENDPOINT);

async function postJsonRpc(payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "kleos-mcp-stdio/0.1.0",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Kleos MCP endpoint returned HTTP ${response.status}.`);
  }

  return response.json();
}

function frameMessage(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function writeFrame(message) {
  process.stdout.write(frameMessage(message));
}

function parseFramedMessages(buffer) {
  const messages = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    const headerEnd = buffer.indexOf("\r\n\r\n", cursor);
    if (headerEnd === -1) {
      break;
    }

    const header = buffer.slice(cursor, headerEnd).toString("utf8");
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) {
      break;
    }

    const contentLength = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    if (bodyEnd > buffer.length) {
      break;
    }

    const body = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    messages.push(JSON.parse(body));
    cursor = bodyEnd;
  }

  return messages;
}

function parseNdjsonMessages(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function handleMessage(message) {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.id === undefined && String(message.method ?? "").startsWith("notifications/")) {
    return;
  }

  const response = await postJsonRpc(message);
  writeFrame(response);
}

async function runStdioBridge() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return;
  }

  const buffer = Buffer.concat(chunks);
  const framed = parseFramedMessages(buffer);
  const messages = framed.length > 0 ? framed : parseNdjsonMessages(buffer.toString("utf8"));

  for (const message of messages) {
    await handleMessage(message);
  }
}

async function runListTools() {
  const response = await postJsonRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  });
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

async function runCallTool() {
  const toolName = argValue("--call", "");
  const args = argValue("--arguments", "{}");
  const response = await postJsonRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: parseToolArguments(args),
    },
  });
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

function parseToolArguments(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .reduce((record, pair) => {
        const separator = pair.indexOf("=");
        if (separator === -1) {
          throw new Error(`Could not parse --arguments. Use JSON or key=value pairs.`);
        }
        record[pair.slice(0, separator).trim()] = pair.slice(separator + 1).trim();
        return record;
      }, {});
  }
}

try {
  if (process.argv.includes("--help")) {
    process.stdout.write(`kleos-mcp\n\n`);
    process.stdout.write(`Usage:\n`);
    process.stdout.write(`  kleos-mcp                         Start MCP stdio bridge\n`);
    process.stdout.write(`  kleos-mcp --list-tools            Print remote Kleos MCP tools\n`);
    process.stdout.write(`  kleos-mcp --call quote_source --arguments itemId=ci_arc_gateway_notes\n\n`);
    process.stdout.write(`Options:\n`);
    process.stdout.write(`  --endpoint <url>                  Defaults to KLEOS_MCP_ENDPOINT or the public Kleos deployment\n`);
    process.exit(0);
  }

  if (process.argv.includes("--list-tools")) {
    await runListTools();
  } else if (process.argv.includes("--call")) {
    await runCallTool();
  } else {
    await runStdioBridge();
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "kleos-mcp failed"}\n`);
  process.exit(1);
}
