"use client";
import React from "react";
import { X, CreditCard, ArrowRight } from "lucide-react";
import { track } from "@/lib/utils/analytics";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPaid: () => Promise<void> | void;
  priceEUR: number; // e.g., 3.99
  phase: "ppd_only" | "hybrid";
  subMonthlyEUR?: number;
  subAnnualEUR?: number;
};

export default function PaywallModal({ isOpen, onClose, onPaid, priceEUR, phase, subMonthlyEUR = 9.99, subAnnualEUR = 89 }: Props) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) track('paywall_opened', { phase, price: priceEUR });
  }, [isOpen, phase, priceEUR]);

  if (!isOpen) return null;

  const ppdCount = (() => {
    try { return parseInt(localStorage.getItem('ppd_count_total') || '0', 10) || 0; } catch { return 0; }
  })();
  const threshold = (() => { try { return parseInt(process.env.NEXT_PUBLIC_PPD_THRESHOLD_FOR_UPSELL || '2', 10); } catch { return 2; } })();
  const showUpsell = phase === 'hybrid' && ppdCount >= threshold;

  async function simulatePay() {
    setError("");
    const ok = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!ok) { setError("Vul een geldig e-mailadres in"); return; }
    setBusy(true);
    try {
      track('ppd_simulated', { email_domain: email.split('@')[1] || '' });
      try { localStorage.setItem('ppd_count_total', String(ppdCount + 1)); } catch {}
      await onPaid();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Download je document</h3>
              <p className="text-sm text-gray-600">Geen account nodig. Betaal per download.</p>
            </div>
            <button onClick={onClose} aria-label="Sluiten" className="p-2 rounded-md hover:bg-gray-100"><X size={18} /></button>
          </div>

          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Groepsplan (.docx)</span>
              <span className="font-semibold">€{priceEUR.toFixed(2)}</span>
            </div>
          </div>

          {showUpsell && (
            <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-gray-800">
              Je hebt al €{(ppdCount * priceEUR).toFixed(2)} uitgegeven. Overweeg een abonnement voor €{subMonthlyEUR.toFixed(2)}/maand of €{subAnnualEUR.toFixed(0)}/jaar.
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="ppd-email" className="block text-sm font-medium text-gray-700 mb-1">E-mailadres (voor bevestiging)</label>
              <input id="ppd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="jij@school.nl" required />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>

            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
              <form method="POST" action="/api/payments/checkout" onSubmit={() => track('ppd_checkout', { provider: 'stripe' })}>
                <input type="hidden" name="email" value={email} />
                <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-900 text-white rounded-lg px-4 py-2 font-semibold">
                  <CreditCard size={18} /> Betaal en download
                </button>
              </form>
            ) : (
              <button onClick={simulatePay} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-900 text-white rounded-lg px-4 py-2 font-semibold">
                <CreditCard size={18} /> Betaal en download (dev)
              </button>
            )}
            <button onClick={onClose} className="w-full inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-semibold">
              Annuleren
            </button>
          </div>

          {phase === 'hybrid' && (
            <div className="mt-4 text-xs text-gray-600">
              Tip: Maak onbeperkt groepsplannen met een abonnement. <a className="text-primary-700 hover:underline inline-flex items-center gap-1" href="/pricing">Meer info <ArrowRight size={12} /></a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

