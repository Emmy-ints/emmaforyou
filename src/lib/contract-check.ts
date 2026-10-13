/** Shared types and quick pattern checks for the free smart contract check. */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ContractFinding {
  /** Set on scanner findings: words that show an AI finding covers the same issue. */
  key?: string[];
  title: string;
  severity: Severity;
  location: string;
  description: string;
  recommendation: string;
}

export interface ContractReport {
  summary: string;
  risk: "low" | "medium" | "high" | "critical";
  contracts: string[];
  compiler: string;
  findings: ContractFinding[];
  gas: { title: string; recommendation: string }[];
  good: string[];
  aiWritten: boolean;
}

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

/** Deterministic red flags found by simple pattern matching (also given to the AI as hints). */
export function patternFindings(code: string): ContractFinding[] {
  const out: ContractFinding[] = [];
  const add = (f: ContractFinding) => out.push(f);
  const pragma = code.match(/pragma\s+solidity\s+([^;]+);/)?.[1]?.trim() || "";
  const minor = Number(pragma.match(/0\.(\d+)/)?.[1] ?? 99);
  if (pragma && minor < 8 && !/SafeMath/.test(code)) {
    add({ key: ["overflow", "safemath", "compiler"], title: "Old compiler without overflow protection", severity: "high", location: `pragma solidity ${pragma}`, description: "Solidity versions before 0.8 don't check arithmetic overflow, and SafeMath isn't used.", recommendation: "Upgrade to a recent 0.8.x compiler, or use SafeMath for all arithmetic." });
  }
  if (/\^|>=/.test(pragma)) {
    add({ key: ["pragma", "floating"], title: "Floating pragma", severity: "low", location: `pragma solidity ${pragma}`, description: "The contract can be compiled with different compiler versions than the one it was tested with.", recommendation: "Lock the pragma to the exact version you test and deploy with." });
  }
  if (/tx\.origin/.test(code)) {
    add({ key: ["tx.origin"], title: "tx.origin used", severity: /require\s*\([^)]*tx\.origin|==\s*tx\.origin|tx\.origin\s*==/.test(code) ? "high" : "medium", location: "tx.origin", description: "Authorising with tx.origin lets a malicious contract act on behalf of a user who calls it.", recommendation: "Use msg.sender for authorisation." });
  }
  if (/\.delegatecall\s*\(/.test(code)) {
    add({ key: ["delegatecall"], title: "delegatecall present", severity: "medium", location: "delegatecall", description: "delegatecall runs external code with this contract's storage and balance. If the target can be influenced, storage can be overwritten.", recommendation: "Only delegatecall to trusted, immutable implementations, and check storage layout compatibility." });
  }
  if (/selfdestruct\s*\(|suicide\s*\(/.test(code)) {
    add({ key: ["selfdestruct"], title: "selfdestruct present", severity: "medium", location: "selfdestruct", description: "selfdestruct is deprecated and, if reachable by the wrong caller, can disable the contract.", recommendation: "Remove it or restrict it tightly; prefer pausable patterns." });
  }
  if (/\.call\{?\s*value/.test(code) || /\.call\.value\(/.test(code)) {
    add({ key: ["reentr", "low-level call", ".call", "return value"], title: "Low-level call sending ETH", severity: "medium", location: ".call{value: ...}", description: "External calls that send value are the classic reentrancy entry point if state is updated after the call, and their return value must be checked.", recommendation: "Update state before the call (checks-effects-interactions), check the return value, and add a reentrancy guard." });
  }
  if (/block\.timestamp|blockhash\s*\(|block\.prevrandao|block\.difficulty/.test(code) && /random|lottery|winner|rand/i.test(code)) {
    add({ key: ["random", "timestamp", "blockhash"], title: "On-chain randomness", severity: "high", location: "block.timestamp / blockhash", description: "Block values are predictable or influenceable by validators, so randomness based on them can be gamed.", recommendation: "Use a verifiable randomness source such as Chainlink VRF." });
  }
  if (/\bunchecked\s*\{/.test(code)) {
    add({ key: ["unchecked"], title: "unchecked arithmetic blocks", severity: "info", location: "unchecked { ... }", description: "Overflow checks are disabled inside unchecked blocks.", recommendation: "Make sure each unchecked block can't overflow, and comment why." });
  }
  // Reentrancy: an external value call followed, in the same function, by a state write.
  const reentrant = Array.from(code.matchAll(/function\s+(\w+)\s*\([^)]*\)[^{;]*\{/g)).filter((m) => {
    const rest = code.slice(m.index! + m[0].length);
    let depth = 1, i = 0;
    for (; i < rest.length && depth > 0; i++) { if (rest[i] === "{") depth++; else if (rest[i] === "}") depth--; }
    const bodyText = rest.slice(0, i);
    const call = bodyText.search(/\.call\{\s*value|\.call\.value\(|\.transfer\(|\.send\(/);
    if (call < 0) return false;
    const after = bodyText.slice(call);
    return /\b\w+\s*\[[^\]]+\]\s*(-=|\+=|=(?!=))|\b\w+\s*(-=|\+=)/.test(after.slice(after.indexOf(";") + 1)) && !/nonReentrant/.test(m[0]);
  }).map((m) => m[1]);
  if (reentrant.length) {
    add({ key: ["reentr", "checks-effects", "effects-interactions"], title: "Reentrancy: state updated after an external call", severity: "critical", location: reentrant.slice(0, 4).join(", "), description: `In ${reentrant.slice(0, 4).join(", ")}, ETH is sent before balances or state are updated, so a malicious contract can call back in and repeat the withdrawal before its balance changes.`, recommendation: "Update state before the external call (checks-effects-interactions) and add OpenZeppelin's ReentrancyGuard (nonReentrant)." });
  }

  // Admin-type functions that are public/external but have no access-control modifier.
  const sensitive = /^(mint|_?setOwner|transferOwnership|upgradeTo\w*|setAdmin|setFee\w*|pause|unpause|setPrice|setBaseURI|withdrawAll|emergencyWithdraw|setTreasury)$/i;
  const unguarded = Array.from(code.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*([^{;]*)\{/g))
    .filter((m) => sensitive.test(m[1]) && /\b(public|external)\b/.test(m[2]) && !/\b(only\w*|auth\w*|requiresAuth|whenNotPaused)\b/.test(m[2]))
    .filter((m) => { const rest = code.slice(m.index! + m[0].length); const body = rest.slice(0, Math.min(400, rest.indexOf("}") < 0 ? 400 : rest.indexOf("}"))); return !/require\s*\(\s*(msg\.sender\s*==|hasRole|owner\s*==|_msgSender\(\)\s*==)|_checkOwner|_checkRole/.test(body); })
    .map((m) => m[1]);
  if (unguarded.length) {
    add({ key: ["access control", "access-control", "ownership", "onlyowner", "unrestricted", "anyone can", "unprotected"], title: "Admin functions without access control", severity: "critical", location: unguarded.slice(0, 4).join(", "), description: `Anyone can call ${unguarded.slice(0, 4).join(", ")}, which should be restricted to the owner or an admin role.`, recommendation: "Add onlyOwner/onlyRole modifiers (OpenZeppelin Ownable or AccessControl) and test that other accounts are rejected." });
  }
  return out;
}

export function compilerOf(code: string): string {
  return code.match(/pragma\s+solidity\s+([^;]+);/)?.[1]?.trim() || "not specified";
}

export function contractNames(code: string): string[] {
  return Array.from(new Set(Array.from(code.matchAll(/\b(?:abstract\s+)?(?:contract|library|interface)\s+([A-Za-z_]\w*)/g), (m) => m[1]))).slice(0, 12);
}

const RANK = (s: Severity) => SEVERITY_ORDER.indexOf(s);

/**
 * Combine AI findings with scanner findings: scanner issues are never dropped, and an AI finding
 * about the same issue is raised to at least the scanner's severity.
 */
export function mergeFindings(ai: ContractFinding[], scanned: ContractFinding[]): ContractFinding[] {
  const fromAi = ai.map((f) => ({ ...f }));
  const added: ContractFinding[] = [];
  for (const p of scanned) {
    const keys = (p.key || []).map((k) => k.toLowerCase());
    const match = fromAi.find((f) => keys.some((k) => `${f.title} ${f.description} ${f.location}`.toLowerCase().includes(k)));
    if (match) { if (RANK(p.severity) < RANK(match.severity)) match.severity = p.severity; }
    else added.push(p);
  }
  const merged = [...fromAi, ...added];
  return merged.map(({ key: _k, ...f }) => f).sort((a, b) => RANK(a.severity) - RANK(b.severity));
}

export function riskFrom(findings: ContractFinding[], claimed: ContractReport["risk"]): ContractReport["risk"] {
  const worst = findings.reduce((w, f) => Math.min(w, RANK(f.severity)), 4);
  const floor: ContractReport["risk"] = worst === 0 ? "critical" : worst === 1 ? "high" : worst === 2 ? "medium" : "low";
  const order: ContractReport["risk"][] = ["low", "medium", "high", "critical"];
  return order[Math.max(order.indexOf(floor), order.indexOf(claimed))];
}
