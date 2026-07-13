import type { ProvenanceChain } from "@sigil/core";

export function exportDot(chain: ProvenanceChain): string {
  const lines: string[] = [
    "digraph Provenance {",
    '  rankdir="TB";',
    '  node [fontname="Helvetica", fontsize=11];',
    '  edge [fontname="Helvetica", fontsize=9];',
    "",
  ];

  const { asset, events, claims, attestations } = chain;

  const assetId = asset.id.replace(/[^a-zA-Z0-9_]/g, "_");

  lines.push(`  // Asset`);
  lines.push(
    `  ${assetId} [shape=box, style=rounded, fillcolor="#e8f4f8", style=filled,`,
    `    label="Asset\\n${escapeLabel(asset.type)}\\n${shortId(asset.id)}"];`,
  );
  lines.push("");

  lines.push(`  // Events`);
  for (const event of events) {
    const eid = event.id.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(
      `  ${eid} [shape=ellipse, fillcolor="#d4edda", style=filled,`,
      `    label="Event\\n${escapeLabel(event.type)}\\n${shortId(event.id)}"];`,
    );
    lines.push(`  ${assetId} -> ${eid} [label="event"];`);
  }
  lines.push("");

  lines.push(`  // Claims`);
  for (const claim of claims) {
    const cid = claim.id.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(
      `  ${cid} [shape=hexagon, fillcolor="#fff3cd", style=filled,`,
      `    label="Claim\\n${escapeLabel(claim.predicate)}\\n${escapeLabel(claim.object)}"];`,
    );
    lines.push(`  ${assetId} -> ${cid} [label="claim", style=dashed];`);
  }
  lines.push("");

  lines.push(`  // Attestations`);
  for (const att of attestations) {
    const aid = att.id.replace(/[^a-zA-Z0-9_]/g, "_");
    const claimId = att.claimId.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(
      `  ${aid} [shape=diamond, fillcolor="#f8d7da", style=filled,`,
      `    label="Attestation\\n${escapeLabel(att.status)}\\n${shortId(att.id)}"];`,
    );
    lines.push(`  ${claimId} -> ${aid} [label="attests", style=dotted];`);
  }

  lines.push("}");
  return lines.join("\n");
}

function escapeLabel(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) + "…" : id;
}
