import React, { useState } from "react";
import { Webhook, Send, Loader2, Terminal, Trash2 } from "lucide-react";
import { sendMobileMoneyWebhook, ApiError } from "../utils/api";

// Matches the VALID_CHANNELS allowlist enforced server-side in
// POST /api/v1/webhooks/mobile-money.
const CHANNELS = [
  { value: "MPESA", label: "M-Pesa (Vodacom)" },
  { value: "TIGOPESA", label: "Tigo Pesa" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "AZAMPAY", label: "AzamPay" },
  { value: "HALOPESA", label: "Halo Pesa" },
  { value: "MOBILE_MONEY", label: "Generic Mobile Money" },
];

const CURRENCIES = ["TZS", "KES", "UGX", "USD"];

function generateMockMsisdn() {
  const prefixes = ["071", "075", "076", "068", "069", "065"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const rest = Math.floor(1000000 + Math.random() * 8999999);
  return `${prefix}${rest}`;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

/**
 * WebhookSimulator dispatches REAL events to the live
 * POST /api/v1/webhooks/mobile-money endpoint — this is not a sandboxed
 * "simulate" route (the backend has no such thing), so each dispatch
 * here actually creates a transaction row if the phone_number matches
 * a registered, active merchant. The form is keyed by phone_number
 * (not a merchant ID) because that's how the backend looks the
 * merchant up.
 */
export default function WebhookSimulator() {
  const [channel, setChannel] = useState(CHANNELS[0].value);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("0712000001");
  const [amount, setAmount] = useState("50000");
  const [isSending, setIsSending] = useState(false);
  const [log, setLog] = useState([
    {
      id: "init",
      time: timestamp(),
      level: "info",
      message: "Webhook dispatcher ready. Events post to POST /api/v1/webhooks/mobile-money against the live backend.",
    },
  ]);

  function appendLog(entry) {
    setLog((prev) => [{ id: `${Date.now()}-${Math.random()}`, time: timestamp(), ...entry }, ...prev].slice(0, 30));
  }

  async function handleSend(e) {
    e.preventDefault();
    setIsSending(true);

    const payload = {
      phone_number: phoneNumber.trim(),
      reference_id: `SIM-${Date.now().toString(36).toUpperCase()}`,
      gross_amount: Number(amount) || 0,
      currency,
      channel,
    };

    appendLog({ level: "request", message: `POST /api/v1/webhooks/mobile-money → ${JSON.stringify(payload)}` });

    try {
      const response = await sendMobileMoneyWebhook(payload);
      const entry = response?.ledger_entry;
      appendLog({
        level: "success",
        message: entry
          ? `Recorded. tx=${entry.transaction_id} merchant=${entry.merchant_name} net=${entry.net_amount} ${entry.currency}`
          : response?.message || "Webhook processed successfully.",
      });
    } catch (err) {
      const isNetwork = err instanceof ApiError && err.code === "NETWORK_ERROR";
      appendLog({
        level: isNetwork ? "warn" : "error",
        message: isNetwork
          ? "Backend core unreachable — event was constructed but not delivered. Start seb-ledger-core to test live."
          : `Backend rejected event (${err.status}): ${err.message}`,
      });
    } finally {
      setIsSending(false);
    }
  }

  function clearLog() {
    setLog([]);
  }

  const levelColor = {
    info: "text-seb-mist",
    request: "text-seb-platinum",
    success: "text-seb-emerald",
    warn: "text-seb-gold",
    error: "text-seb-rust",
  };

  return (
    <section className="border-b ledger-divider">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b ledger-divider">
        <div className="flex items-center gap-2.5">
          <Webhook size={16} strokeWidth={1.75} className="text-seb-gold" />
          <h2 className="text-sm font-medium text-seb-platinum tracking-wide">Webhook Dispatcher</h2>
        </div>
        <span className="text-[11px] font-mono text-seb-mist">
          Live calls — creates real transaction rows
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <form onSubmit={handleSend} className="px-5 sm:px-6 py-5 space-y-4 border-b lg:border-b-0 lg:border-r ledger-divider">
          <p className="text-xs text-seb-mist leading-relaxed">
            The phone number must belong to an existing, active merchant —
            register one first if you haven't. The backend looks the
            merchant up by phone number, not by an ID.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-ledger text-seb-mist mb-1.5">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-seb-obsidian border ledger-divider px-3 py-2.5 text-sm text-seb-platinum focus:outline-none focus:border-seb-gold"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-ledger text-seb-mist mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-seb-obsidian border ledger-divider px-3 py-2.5 text-sm text-seb-platinum focus:outline-none focus:border-seb-gold"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-ledger text-seb-mist mb-1.5">
              Payer Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712000001"
              className="w-full bg-seb-obsidian border ledger-divider px-3 py-2.5 text-sm font-mono text-seb-platinum focus:outline-none focus:border-seb-gold"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-ledger text-seb-mist mb-1.5">
              Gross Amount
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-seb-obsidian border ledger-divider px-3 py-2.5 text-sm font-mono text-seb-platinum focus:outline-none focus:border-seb-gold"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 bg-seb-gold text-seb-obsidian px-4 py-2.5 text-xs font-mono tracking-wide font-medium hover:bg-seb-gold/90 disabled:opacity-60 transition-colors"
          >
            {isSending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Dispatching…
              </>
            ) : (
              <>
                <Send size={14} /> Dispatch Webhook Event
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPhoneNumber(generateMockMsisdn())}
            className="w-full text-[11px] font-mono text-seb-mist hover:text-seb-platinum transition-colors"
          >
            Generate random MSISDN (won't match a real merchant)
          </button>
        </form>

        <div className="px-5 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-ledger text-seb-mist">
              <Terminal size={12} /> Event Log
            </span>
            <button
              onClick={clearLog}
              className="flex items-center gap-1 text-[11px] text-seb-mist hover:text-seb-rust transition-colors"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <div className="bg-seb-obsidian border ledger-divider h-64 overflow-y-auto p-3 space-y-2 font-mono text-[11px]">
            {log.length === 0 ? (
              <p className="text-seb-mist">No events yet. Dispatch a webhook to see backend responses here.</p>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className="flex gap-2 leading-relaxed">
                  <span className="text-seb-mist shrink-0">{entry.time}</span>
                  <span className={`${levelColor[entry.level] || "text-seb-platinum"} break-all`}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
