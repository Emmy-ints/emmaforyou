/** Shared types and quick pattern checks for the free smart contract check. */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ContractFinding {
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
    add({ title: "Old compiler without overflow protection", severity: "high", location: `pragma solidity ${pragma}`, description: "Solidity versions before 0.8 don't check arithmetic overflow, and SafeMath isn't used.", recommendation: "Upgrade to a recent 0.8.x compiler, or use SafeMath for all arithmetic." });
  }
  if (/\^|>=/.test(pragma)) {
    add({ title: "Floating pragma", severity: "low", location: `pragma solidity ${pragma}`, description: "The contract can be compiled with different compiler versions than the one it was tested with.", recommendation: "Lock the pragma to the exact version you test and deploy with." });
  }
  if (/tx\.origin/.test(code)) {
    add({ title: "tx.origin used", severity: /require\s*\([^)]*tx\.origin|==\s*tx\.origin|tx\.origin\s*==/.test(code) ? "high" : "medium", location: "tx.origin", description: "Authorising with tx.origin lets a malicious contract act on behalf of a user who calls it.", recommendation: "Use msg.sender for authorisation." });
  }
  if (/\.delegatecall\s*\(/.test(code)) {
    add({ title: "delegatecall present", severity: "medium", location: "delegatecall", description: "delegatecall runs external code with this contract's storage and balance. If the target can be influenced, storage can be overwritten.", recommendation: "Only delegatecall to trusted, immutable implementations, and check storage layout compatibility." });
  }
  if (/selfdestruct\s*\(|suicide\s*\(/.test(code)) {
    add({ title: "selfdestruct present", severity: "medium", location: "selfdestruct", description: "selfdestruct is deprecated and, if reachable by the wrong caller, can disable the contract.", recommendation: "Remove it or restrict it tightly; prefer pausable patterns." });
  }
  if (/\.call\{?\s*value/.test(code) || /\.call\.value\(/.test(code)) {
    add({ title: "Low-level call sending ETH", severity: "medium", location: ".call{value: ...}", description: "External calls that send value are the classic reentrancy entry point if state is updated after the call, and their return value must be checked.", recommendation: "Update state before the call (checks-effects-interactions), check the return value, and add a reentrancy guard." });
  }
  if (/block\.timestamp|blockhash\s*\(|block\.prevrandao|block\.difficulty/.test(code) && /random|lottery|winner|rand/i.test(code)) {
    add({ title: "On-chain randomness", severity: "high", location: "block.timestamp / blockhash", description: "Block values are predictable or influenceable by validators, so randomness based on them can be gamed.", recommendation: "Use a verifiable randomness source such as Chainlink VRF." });
  }
  if (/\bunchecked\s*\{/.test(code)) {
    add({ title: "unchecked arithmetic blocks", severity: "info", location: "unchecked { ... }", description: "Overflow checks are disabled inside unchecked blocks.", recommendation: "Make sure each unchecked block can't overflow, and comment why." });
  }
  // Admin-type functions that are public/external but have no access-control modifier.
  const sensitive = /^(mint|_?setOwner|transferOwnership|upgradeTo\w*|setAdmin|setFee\w*|pause|unpause|setPrice|setBaseURI|withdrawAll|emergencyWithdraw|setTreasury)$/i;
  const unguarded = Array.from(code.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*([^{;]*)\{/g))
    .filter((m) => sensitive.test(m[1]) && /\b(public|external)\b/.test(m[2]) && !/\b(only\w*|auth\w*|requiresAuth|whenNotPaused)\b/.test(m[2]))
    .filter((m) => { const rest = code.slice(m.index! + m[0].length); const body = rest.slice(0, Math.min(400, rest.indexOf("}") < 0 ? 400 : rest.indexOf("}"))); return !/require\s*\(\s*(msg\.sender\s*==|hasRole|owner\s*==|_msgSender\(\)\s*==)|_checkOwner|_checkRole/.test(body); })
    .map((m) => m[1]);
  if (unguarded.length) {
    add({ title: "Admin functions without access control", severity: "critical", location: unguarded.slice(0, 4).join(", "), description: `Anyone can call ${unguarded.slice(0, 4).join(", ")}, which should be restricted to the owner or an admin role.`, recommendation: "Add onlyOwner/onlyRole modifiers (OpenZeppelin Ownable or AccessControl) and test that other accounts are rejected." });
  }
  return out;
}

export function compilerOf(code: string): string {
  return code.match(/pragma\s+solidity\s+([^;]+);/)?.[1]?.trim() || "not specified";
}

export function contractNames(code: string): string[] {
  return Array.from(new Set(Array.from(code.matchAll(/\b(?:abstract\s+)?(?:contract|library|interface)\s+([A-Za-z_]\w*)/g), (m) => m[1]))).slice(0, 12);
}
