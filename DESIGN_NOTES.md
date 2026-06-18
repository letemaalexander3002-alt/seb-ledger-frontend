# SEB-Ledger Design Plan

## Subject
The Pan-East African Informal Sector Economic Ledger — tracking unbanked/informal
merchant cash-flow (market vendors, boda riders, kiosks) across TZ/EA via mobile
money rails (M-Pesa, Tigo Pesa, Airtel Money). This is NOT a generic SaaS
dashboard — it's a sovereign financial instrument for a continent largely
ignored by formal banking ledgers. The product's job: make informal economic
activity LEGIBLE, auditable, and bankable.

## Color (token system)
- --seb-obsidian:   #0B0D0E  (base canvas — near-black, not pure black)
- --seb-ledger:     #12161A  (panel/surface, slightly warmer than obsidian)
- --seb-gold:       #C9A24B  (Imperial Gold — primary accent, sparingly)
- --seb-gold-dim:   #8A7233  (muted gold for borders/secondary)
- --seb-platinum:   #C7CDD1  (Platinum Grey — body text on dark)
- --seb-mist:       #6B7378  (tertiary text, captions)
- --seb-emerald:    #3FA973  (inflow / positive — East African savanna green, not generic SaaS green)
- --seb-rust:       #C1542E  (outflow / alert — terracotta/rust, ties to East African soil, not stock-red)

## Type
- Display: "Spectral" (serif, used ONLY for the wordmark "SEB" + page title) —
  ledger books and currency historically use serif for gravity & trust.
- Body/UI: "Inter" — neutral, legible at small sizes for dense tabular data.
- Data/mono: "IBM Plex Mono" — for amounts, TZS figures, phone numbers, IDs.
  Tabular numerals matter here — this is a LEDGER, numbers must align.

## Layout concept
Not a card-grid dashboard. A literal LEDGER METAPHOR:
- Left rail: thin vertical "spine" (ledger binding) — nav icons only, gold hairline.
- Top: a single running horizontal rule under the header, like a ledger page's
  top line — no big rounded hero card.
- Stat row: four entries separated by hairline dividers, NOT rounded cards with
  shadows. Numbers in Plex Mono, tabular-nums, right-aligned like a real ledger column.
- Chart panel: framed with a thin gold-dim border, square corners, like a
  bound ledger page — no soft shadow/glow.
- Merchant table: zebra-free, hairline row dividers, monospace amount column,
  status as a small colored glyph (●) not a pill badge.

ASCII wireframe:
```
+--+--------------------------------------------------------------+
|  | SEB  The Pan-East African Informal Sector Economic Ledger     |
|N |------------------------------------------------------------- |
|a | TOTAL VOLUME | ACTIVE MERCHANTS | PENDING TX | FAILED TX       |
|v | TZS 84,210,300| 1,204            | 12          | 3              |
|  |------------------------------------------------------------- |
|  | [ Real-Time Settlement Flow ............... chart ]           |
|  |------------------------------------------------------------- |
|  | Merchant Ledger                          [Register Merchant]  |
|  | ID  Name  Region  Channel  Volume   Status                    |
|  | ------------------------------------------------------------ |
|  | ...rows...                                                    |
+--+--------------------------------------------------------------+
```

## Signature element
The "Ledger Spine" — a 56px-wide left column styled as the leather/cloth
binding of a physical ledger book, with a subtle vertical gold hairline and
nav icons stacked on it. It's the one unmistakable, memorable device — every
other surface stays quiet and disciplined (flat, hairline-bordered, no shadows,
no gradients, no rounded-corner-card-grid).

## Self-critique
- Removed: drop shadows everywhere (default SaaS dashboard tell) → replaced
  with 1px hairline borders in gold-dim at low opacity.
- Removed: rounded-2xl cards → square/sharp corners (ledger page, not app card).
- Removed: generic green/red for in/out → emerald/rust tied to EA landscape.
- Kept risk: serif wordmark + mono data columns mixing with Inter UI text —
  justified because it mirrors real ledger typography (title page vs. entries).
