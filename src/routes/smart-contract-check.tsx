import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import ContractCheck from "../components/tools/ContractCheck";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What does the smart contract check look for?", a: "It scans Solidity for common red flags (old compilers without overflow protection, tx.origin authorisation, unprotected admin functions, low-level calls that enable reentrancy, weak on-chain randomness, delegatecall and selfdestruct), then an AI reviewer looks for logic, access-control, reentrancy, oracle and gas issues specific to your code." },
  { q: "Is this a smart contract audit?", a: "No. It's a fast first look that catches many common mistakes. Contracts that will hold real value need a careful manual review and an independent audit before mainnet; we can help with both." },
  { q: "Is my code stored?", a: "No. Your code is sent to our AI provider to produce the review and isn't saved by us. Don't paste private keys, seed phrases or secrets." },
];

export const Route = createFileRoute("/smart-contract-check")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Smart Contract Check — Solidity Security & Gas Review",
      description: "Paste Solidity code and get a free security and gas review in seconds: reentrancy, access control, randomness and more, ranked by severity with fixes.",
      path: "/smart-contract-check",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Smart contract check", path: "/smart-contract-check" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free tool · Web3 & Solidity"
      title="Free smart contract check"
      intro="Paste your Solidity contract and get a security and gas review in about 30 seconds. Issues are ranked from critical to informational, each with a concrete fix."
      answers={ANSWERS}
      width="max-w-5xl"
    >
      <ContractCheck />
    </ToolShell>
  );
}
