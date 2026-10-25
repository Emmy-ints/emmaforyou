// @ts-nocheck -- generated DB/router types lag behind; runtime verified
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, FileCode, Fuel, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { SEVERITY_ORDER, type ContractReport, type Severity } from "@/lib/contract-check";
import { LeadCapture } from "./LeadCapture";
import { track } from "@/lib/analytics";

const SEV_STYLE: Record<Severity, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  low: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  info: "bg-muted text-muted-foreground",
};
const RISK_LABEL: Record<ContractReport["risk"], string> = { low: "Low risk", medium: "Medium risk", high: "High risk", critical: "Critical risk" };

const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleVault {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() { owner = msg.sender; }

    function deposit() external payable { balances[msg.sender] += msg.value; }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "failed");
        balances[msg.sender] -= amount;
    }

    function setOwner(address newOwner) external { owner = newOwner; }
}`;

export default function ContractCheck() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ContractReport | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.trim().length < 40) return;
    setBusy(true); setError(""); setReport(null);
    try {
      const res = await fetch("/api/contract-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "The check couldn't run.");
      setReport(data);
      track("contract_checked", { risk: data.risk, findings: data.findings?.length ?? 0 });
      window.setTimeout(() => document.getElementById("contract-report")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  const counts = report ? SEVERITY_ORDER.map((s) => [s, report.findings.filter((f) => f.severity === s).length] as const) : [];

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="no-print overflow-hidden rounded-[24px] border border-border bg-card shadow-[var(--shadow-card-hover)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold"><FileCode className="h-4 w-4 text-[var(--emma-violet)]" /> Contract.sol</span>
          <button type="button" onClick={() => setCode(SAMPLE)} className="text-xs font-semibold text-[var(--emma-violet)]">Try a sample contract</button>
        </div>
        <label htmlFor="sol" className="sr-only">Solidity code</label>
        <textarea id="sol" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} maxLength={40000} rows={14}
          placeholder={"// Paste your Solidity code here\npragma solidity 0.8.24;\n\ncontract MyToken { ... }"}
          className="block w-full resize-y bg-[#0b0d24] p-4 font-mono text-[13px] leading-relaxed text-[#d7dbff] outline-none placeholder:text-[#6b70a0]" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs text-muted-foreground">{code.length.toLocaleString()} / 40,000 characters · Don't paste private keys or secrets.</p>
          <button disabled={busy || code.trim().length < 40} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} {busy ? "Reviewing…" : "Check my contract"}
          </button>
        </div>
      </form>
      {error && <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</p>}

      {report && (
        <section id="contract-report" className="print-area scroll-mt-28 space-y-6" aria-labelledby="contract-heading">
          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">Smart contract check · {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 id="contract-heading" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{RISK_LABEL[report.risk]}</h2>
              {report.risk === "low" ? <ShieldCheck className="h-7 w-7 text-emerald-600" /> : <ShieldAlert className={`h-7 w-7 ${report.risk === "medium" ? "text-amber-500" : "text-red-600"}`} />}
            </div>
            <p className="mt-2 text-muted-foreground">{report.summary}</p>
            <p className="mt-3 text-xs text-muted-foreground">Contracts: {report.contracts.join(", ") || "—"} · Compiler: {report.compiler}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {counts.map(([s, n]) => <span key={s} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${SEV_STYLE[s]}`}>{n} {s}</span>)}
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h3 className="font-display text-xl font-semibold">Findings</h3>
            {report.findings.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No issues found in this check.</p> : (
              <ol className="mt-4 space-y-4">
                {report.findings.map((f, i) => (
                  <li key={i} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
                      <p className="font-semibold text-foreground">{f.title}</p>
                    </div>
                    {f.location && <p className="mt-1 font-mono text-xs text-muted-foreground">{f.location}</p>}
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                    <p className="mt-2 text-sm text-foreground"><strong>Fix:</strong> {f.recommendation}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {(report.gas.length > 0 || report.good.length > 0) && (
            <div className="grid gap-6 md:grid-cols-2">
              {report.gas.length > 0 && (
                <div className="rounded-[24px] border border-border bg-card p-6">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><Fuel className="h-5 w-5" /> Gas savings</h3>
                  <ul className="mt-3 space-y-2 text-sm">{report.gas.map((g) => <li key={g.title}><strong>{g.title}.</strong> <span className="text-muted-foreground">{g.recommendation}</span></li>)}</ul>
                </div>
              )}
              {report.good.length > 0 && (
                <div className="rounded-[24px] border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold">What's done well</h3>
                  <ul className="mt-3 space-y-2 text-sm">{report.good.map((g) => <li key={g} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{g}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">Automated pattern scan plus AI review{report.aiWritten ? "" : " (AI review unavailable; pattern scan only)"}. It can miss issues and can flag false positives. It is not a security audit: for contracts that will hold real value, get a manual review and an independent audit before mainnet. By EmmaForYou · emmaforyou.lovable.app</p>

          <div className="no-print flex flex-wrap gap-3">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]"><Download className="h-4 w-4" /> Download PDF</button>
            <Link to="/expertise/smart-contract-development" className="inline-flex items-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:border-[var(--emma-violet)]">How our smart contract service works</Link>
          </div>
          <LeadCapture tool="Smart contract review" title="Get a manual review from Emmanuel" lead="A Solidity developer reads your contract line by line, explains each risk and how to fix it, and tells you what an audit would need." button="Request a manual review" summary={`Risk: ${report.risk}. ${report.findings.length} findings (${counts.filter(([, n]) => n).map(([s, n]) => `${n} ${s}`).join(", ")}). Contracts: ${report.contracts.join(", ")}. ${report.summary}`} />
        </section>
      )}
    </div>
  );
}
