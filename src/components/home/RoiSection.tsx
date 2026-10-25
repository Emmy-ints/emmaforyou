import { Calculator } from "lucide-react";
import RoiCalculator from "../roi/RoiCalculator";
import SectionHead from "../future/SectionHead";

/** ROI calculator in a glass instrument panel over a faint measured grid; the maths stays fully visible. */
export default function RoiSection() {
  return (
    <section id="roi" className="roi-x section-padding" aria-labelledby="roi-h">
      <div className="roi-x-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <SectionHead id="roi-h" align="center" className="max-w-3xl" kicker={<><Calculator className="h-3.5 w-3.5" aria-hidden="true" /> ROI calculator</>}
          title="What faster replies and better marketing are worth to you"
          sub="Enter your own numbers. Every assumption is visible and editable, and the maths is shown underneath — no black box." />
        <div className="roi-x-panel lg-strong mt-12 rounded-[28px] p-2 md:p-3">
          <RoiCalculator compact />
        </div>
      </div>
    </section>
  );
}
