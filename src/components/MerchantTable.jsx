import React, { useEffect, useState } from "react";
import { Search, Phone, ChevronLeft, ChevronRight, MapPin, Circle } from "lucide-react";
import { fetchMerchants } from "../utils/api";

const MOCK_MERCHANTS = [
  { id: "mock-1", full_name: "Halima Mwakipesile", business_type: "Restaurant", region: "Mbeya", district: "Mbeya Urban", phone_number: "0712000001", is_active: true, created_at: "2026-05-02T09:15:00Z" },
  { id: "mock-2", full_name: "Bahati Chidama", business_type: "Retail", region: "Mbeya", district: "Mbeya Urban", phone_number: "0713000002", is_active: true, created_at: "2026-05-04T11:42:00Z" },
  { id: "mock-3", full_name: "Juma Sangiwa", business_type: "Transport", region: "Dodoma", district: "Dodoma Urban", phone_number: "0714000003", is_active: false, created_at: "2026-05-06T08:05:00Z" },
  { id: "mock-4", full_name: "Fauster Udoba", business_type: "Hardware", region: "Dodoma", district: "Dodoma Urban", phone_number: "0715000004", is_active: true, created_at: "2026-05-10T14:30:00Z" },
  { id: "mock-5", full_name: "Asha Ramadhani", business_type: "Textiles", region: "Dar es Salaam", district: "Ilala", phone_number: "0716000005", is_active: false, created_at: "2026-05-12T16:00:00Z" },
  { id: "mock-6", full_name: "Method Nzowa", business_type: "Agriculture", region: "Iringa", district: "Iringa Urban", phone_number: "0717000006", is_active: true, created_at: "2026-05-15T07:50:00Z" },
];

const PAGE_SIZE = 6;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * MerchantTable renders the live `merchants` table from seb-ledger-core
 * (GET /api/v1/merchants). The backend has no concept of "channel" or
 * transaction "volume" per merchant — those belong to the transactions
 * table and the governance dashboard's aggregates — so this view only
 * shows fields that actually exist on a merchant row: name, business
 * type, region/district, phone, and active/inactive status.
 *
 * `refreshToken` lets a parent (e.g. after a successful registration)
 * force an immediate refetch without waiting for the debounce/poll cycle.
 */
export default function MerchantTable({ refreshToken = 0 }) {
  const [merchants, setMerchants] = useState(MOCK_MERCHANTS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(MOCK_MERCHANTS.length);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await fetchMerchants(
          { search, page, pageSize: PAGE_SIZE },
          controller.signal
        );
        if (data?.success && Array.isArray(data.merchants)) {
          setMerchants(data.merchants);
          setTotalPages(data.total_pages || 1);
          setTotal(data.total ?? data.merchants.length);
          setUsingMock(false);
          setErrorMessage(null);
        } else {
          throw new Error(data?.error || "Unexpected response shape from backend.");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setUsingMock(true);
        setErrorMessage(err.message || "Could not reach the backend.");
        const filtered = MOCK_MERCHANTS.filter((m) =>
          search ? m.full_name.toLowerCase().includes(search.toLowerCase()) : true
        );
        setMerchants(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [search, page, refreshToken]);

  return (
    <section id="merchant-ledger" className="border-b ledger-divider">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b ledger-divider">
        <div>
          <h2 className="text-sm font-medium text-seb-platinum tracking-wide">Merchant Ledger</h2>
          <p className="text-[11px] text-seb-mist font-mono mt-0.5">
            {total} {total === 1 ? "entry" : "entries"} on record
            {usingMock ? " · demonstration data (backend unreachable)" : ""}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-seb-mist" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or phone…"
            className="w-full bg-seb-ledger border ledger-divider pl-8 pr-3 py-2 text-xs font-mono text-seb-platinum placeholder:text-seb-mist focus:outline-none focus:border-seb-gold"
          />
        </div>
      </div>

      {usingMock && errorMessage && (
        <div className="px-5 sm:px-6 py-2 text-[11px] font-mono text-seb-rust border-b ledger-divider">
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-ledger text-seb-mist border-b ledger-divider">
              <th className="px-5 sm:px-6 py-3 font-medium">Merchant</th>
              <th className="px-3 py-3 font-medium">Business Type</th>
              <th className="px-3 py-3 font-medium">Region</th>
              <th className="px-3 py-3 font-medium">Phone</th>
              <th className="px-3 py-3 font-medium">Registered</th>
              <th className="px-5 sm:px-6 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && merchants.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b ledger-divider">
                  <td colSpan={6} className="px-5 sm:px-6 py-4">
                    <div className="h-4 w-full bg-seb-ledgerlight animate-pulse" />
                  </td>
                </tr>
              ))
            ) : merchants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 sm:px-6 py-10 text-center text-seb-mist text-sm">
                  No merchants match that search. Try a different name or phone number.
                </td>
              </tr>
            ) : (
              merchants.map((m) => (
                <tr key={m.id} className="border-b ledger-divider hover:bg-seb-ledgerlight/60 transition-colors">
                  <td className="px-5 sm:px-6 py-3.5">
                    <div className="text-sm text-seb-platinum">{m.full_name}</div>
                    <div className="text-[11px] text-seb-mist font-mono">{m.id?.slice(0, 8)}</div>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-seb-platinum">{m.business_type}</td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-seb-platinum">
                      <MapPin size={12} className="text-seb-mist" />
                      {m.region}
                      {m.district ? `, ${m.district}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-mono text-seb-platinum">
                      <Phone size={12} className="text-seb-gold" />
                      {m.phone_number}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs font-mono text-seb-mist">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-5 sm:px-6 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-mono ${
                        m.is_active ? "text-seb-emerald" : "text-seb-rust"
                      }`}
                    >
                      <Circle size={10} fill="currentColor" />
                      {m.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t ledger-divider text-xs font-mono text-seb-mist">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 border ledger-divider disabled:opacity-30 hover:border-seb-gold transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 border ledger-divider disabled:opacity-30 hover:border-seb-gold transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
