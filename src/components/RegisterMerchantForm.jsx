import React, { useState } from "react";
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { registerMerchant, ApiError } from "../utils/api";

const REGIONS = [
  "Dodoma",
  "Mbeya",
  "Dar es Salaam",
  "Arusha",
  "Iringa",
  "Mwanza",
  "Tanga",
];

const BUSINESS_TYPES = [
  "Retail",
  "Food Vendor",
  "Salon",
  "Bodaboda",
  "Mobile Vendor",
  "Agriculture & Produce",
  "Stationery & Internet Services",
  "Construction & Hardware",
  "Textiles & Apparel",
  "Other Informal Trade",
];

const initialForm = {
  full_name: "",
  phone_number: "",
  nida_number: "",
  region: REGIONS[0],
  district: "",
  business_type: BUSINESS_TYPES[0],
};

function FieldLabel({ children, required }) {
  return (
    <label className="block text-[11px] uppercase tracking-ledger text-seb-mist mb-1.5">
      {children}
      {required && <span className="text-seb-rust ml-1">*</span>}
    </label>
  );
}

const inputClasses =
  "w-full bg-seb-obsidian border ledger-divider px-3 py-2.5 text-sm text-seb-platinum placeholder:text-seb-mist focus:outline-none focus:border-seb-gold transition-colors";

/**
 * Registration fields here mirror the real `merchants` table columns
 * (full_name, phone_number, nida_number, business_type, region,
 * district) and the validation rules enforced server-side in
 * POST /api/v1/merchants: phone numbers are normalized East African
 * MSISDNs, and NIDA numbers — when provided — must be the 19-digit
 * grouped format used throughout this codebase's seed data
 * (YYYYMMDD-XXXXX-XXXXX-X).
 */
export default function RegisterMerchantForm({ isOpen, onClose, onRegistered }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverMessage, setServerMessage] = useState("");

  if (!isOpen) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      next.full_name = "Full name is required (at least 2 characters).";
    }
    if (!/^(\+?255|0)\d{9}$/.test(form.phone_number.replace(/[\s-]/g, ""))) {
      next.phone_number = "Enter a valid East African mobile number (e.g. 0712345678).";
    }
    if (form.nida_number && form.nida_number.trim()) {
      const digitsOnly = form.nida_number.replace(/-/g, "").trim();
      if (!/^\d{19}$/.test(digitsOnly)) {
        next.nida_number = "NIDA number must be 19 digits (e.g. 19901205-00001-00001-1).";
      }
    }
    if (!form.region.trim()) next.region = "Region is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerMessage("");
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        business_type: form.business_type,
        region: form.region,
        district: form.district.trim() || undefined,
        nida_number: form.nida_number.trim() || undefined,
      };
      const response = await registerMerchant(payload);
      setStatus("success");
      setServerMessage(response?.message || "Merchant registered to the ledger.");
      onRegistered?.(response?.merchant);
      setTimeout(() => {
        setForm(initialForm);
        setStatus("idle");
        onClose();
      }, 1400);
    } catch (err) {
      setStatus("error");
      setServerMessage(
        err instanceof ApiError
          ? err.message
          : "Could not reach the backend core. The merchant has not been recorded."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md h-full bg-seb-ledger border-l ledger-divider overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b ledger-divider">
          <div className="flex items-center gap-2.5">
            <UserPlus size={16} strokeWidth={1.75} className="text-seb-gold" />
            <h2 className="text-sm font-medium text-seb-platinum tracking-wide">Register Merchant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-seb-mist hover:text-seb-platinum transition-colors"
            aria-label="Close registration form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <p className="text-xs text-seb-mist leading-relaxed">
            Onboard an informal-sector merchant onto the SEB-Ledger. Once recorded, this
            entry becomes eligible for mobile money settlement tracking and credit
            history accrual under the Sovereign Ecosystem Blueprint.
          </p>

          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="e.g. Halima Mwakipesile"
              className={inputClasses}
            />
            {errors.full_name && <p className="mt-1 text-xs text-seb-rust">{errors.full_name}</p>}
          </div>

          <div>
            <FieldLabel required>Mobile Number</FieldLabel>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              placeholder="0712 345 678"
              className={`${inputClasses} font-mono`}
            />
            {errors.phone_number && <p className="mt-1 text-xs text-seb-rust">{errors.phone_number}</p>}
          </div>

          <div>
            <FieldLabel>National ID (NIDA) — optional</FieldLabel>
            <input
              type="text"
              value={form.nida_number}
              onChange={(e) => update("nida_number", e.target.value)}
              placeholder="19901205-00001-00001-1"
              className={`${inputClasses} font-mono`}
            />
            {errors.nida_number && <p className="mt-1 text-xs text-seb-rust">{errors.nida_number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Region</FieldLabel>
              <select
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                className={inputClasses}
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>District — optional</FieldLabel>
              <input
                type="text"
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="e.g. Mbeya Urban"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <FieldLabel required>Business Type</FieldLabel>
            <select
              value={form.business_type}
              onChange={(e) => update("business_type", e.target.value)}
              className={inputClasses}
            >
              {BUSINESS_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && (
            <div className="flex items-start gap-2 border border-seb-rust/40 bg-seb-rust/10 px-3 py-2.5 text-xs text-seb-rust">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{serverMessage}</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-start gap-2 border border-seb-emerald/40 bg-seb-emerald/10 px-3 py-2.5 text-xs text-seb-emerald">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              <span>{serverMessage}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border ledger-divider px-4 py-2.5 text-xs font-mono tracking-wide text-seb-mist hover:text-seb-platinum hover:border-seb-gold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="flex-1 flex items-center justify-center gap-2 bg-seb-gold text-seb-obsidian px-4 py-2.5 text-xs font-mono tracking-wide font-medium hover:bg-seb-gold/90 disabled:opacity-60 transition-colors"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Recording…
                </>
              ) : (
                "Add to Ledger"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
