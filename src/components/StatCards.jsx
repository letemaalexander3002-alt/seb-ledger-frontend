import React, { useEffect, useState } from "react";
import { Banknote, Users, Receipt, AlertTriangle } from "lucide-react";
import { fetchGovernanceDashboard, ApiError } from "../utils/api";

/**
 * Formats a raw number as a TZS currency string with thousand separators.
 * Kept local (no Intl locale surprises across environments).
 */
function formatTzs(value) {
  if (value === null || value === undefined) return "—";
  return "TZS " + Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatCount(value) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("en-US");
}

// Demonstration figures shaped exactly like GET /api/v1/governance/dashboard's
// real response, used only when the backend can't be reached.
const MOCK_DASHBOARD = {
  ledger_summary: {
    total_gross_revenue_tzs: 84210300,
    total_tax_collected_tzs: 84210,
    total_net_volume_tzs: 84126090,
    total_transactions: 842,
    completed_transactions: 829,
    failed_transactions: 13,
    last_24h_transactions: 47,
    last_24h_gross_tzs: 3920000,
  },
  merchant_stats: {
    total_registered: 1204,
    active_merchants: 1168,
    inactive_merchants: 36,
  },
};

/**
 * A single ledger entry — deliberately NOT a rounded shadowed "card".
 * Modeled as a column in a bound ledger book: label as a small caps
 * eyebrow, the figure in tabular monospace, and a delta line beneath.
 */
function LedgerEntry({ icon: Icon, label, value, delta, deltaTone, accent, isLoading }) {
  const deltaColor =
    deltaTone === "positive" ? "text-seb-emerald" : deltaTone === "negative" ? "text-seb-rust" : "text-seb-mist";

  return (
    <div className="flex-1 min-w-[200px] px-5 py-5 sm:px-6 sm:py-6 border-b sm:border-b-0 sm:border-r last:border-r-0 last:border-b-0 ledger-divider">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-ledger text-seb-mist font-medium">{label}</span>
        <Icon size={15} strokeWidth={1.75} className={accent} />
      </div>

      {isLoading ? (
        <div className="h-7 w-28 bg-seb-ledgerlight animate-pulse" aria-hidden="true" />
      ) : (
        <div className="font-mono text-2xl sm:text-[1.65rem] leading-none text-seb-platinum tabular-figures">
          {value}
        </div>
      )}

      <div className={`mt-2 flex items-center gap-1 text-xs font-mono ${deltaColor}`}>
        <span>{isLoading ? "Loading entry…" : delta}</span>
      </div>
    </div>
  );
}

/**
 * StatCards summarizes the ledger using GET /api/v1/governance/dashboard,
 * the only endpoint seb-ledger-core exposes for aggregate figures. There
 * is no historical timeseries on the backend, so period-over-period
 * deltas (e.g. "+6.4% past 24h") aren't computable from a single
 * snapshot — those have been replaced with the real fields the backend
 * does provide: a rolling last-24h transaction count and gross figure.
 */
export default function StatCards() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchGovernanceDashboard(controller.signal);
        if (data?.success && data.dashboard) {
          setDashboard(data.dashboard);
          setUsingMock(false);
        } else {
          throw new Error(data?.error || "Unexpected response shape from backend.");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        // Backend core not reachable (or admin key missing/invalid) —
        // fall back to mock ledger figures so the interface stays
        // demonstrable and never blank.
        setDashboard(MOCK_DASHBOARD);
        setUsingMock(true);
        if (!(err instanceof ApiError)) {
          console.error("StatCards: unexpected error loading dashboard", err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const summary = (dashboard || MOCK_DASHBOARD).ledger_summary;
  const merchants = (dashboard || MOCK_DASHBOARD).merchant_stats;

  return (
    <section aria-label="Ledger summary metrics" className="border-b ledger-divider">
      {usingMock && (
        <div className="px-5 sm:px-6 pt-3 text-[11px] font-mono text-seb-gold/80 flex items-center gap-1.5">
          <AlertTriangle size={12} strokeWidth={2} />
          <span>
            Backend core unreachable (or X-Admin-Key required) — showing demonstration ledger figures.
          </span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row">
        <LedgerEntry
          icon={Banknote}
          label="Total Settlement Volume"
          value={formatTzs(summary.total_gross_revenue_tzs)}
          delta={`${formatTzs(summary.last_24h_gross_tzs)} in last 24h`}
          deltaTone="neutral"
          accent="text-seb-gold"
          isLoading={isLoading && !dashboard}
        />
        <LedgerEntry
          icon={Users}
          label="Active Merchants"
          value={formatCount(merchants.active_merchants)}
          delta={`${formatCount(merchants.total_registered)} registered total`}
          deltaTone="neutral"
          accent="text-seb-emerald"
          isLoading={isLoading && !dashboard}
        />
        <LedgerEntry
          icon={Receipt}
          label="Transactions (24h)"
          value={formatCount(summary.last_24h_transactions)}
          delta={`${formatCount(summary.total_transactions)} all-time`}
          deltaTone="neutral"
          accent="text-seb-mist"
          isLoading={isLoading && !dashboard}
        />
        <LedgerEntry
          icon={AlertTriangle}
          label="Failed Transactions"
          value={formatCount(summary.failed_transactions)}
          delta="Requires reconciliation"
          deltaTone={summary.failed_transactions > 0 ? "negative" : "neutral"}
          accent="text-seb-rust"
          isLoading={isLoading && !dashboard}
        />
      </div>
    </section>
  );
}
