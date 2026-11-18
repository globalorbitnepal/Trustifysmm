export type DepositInvoiceInput = {
  id: string;
  amountUsd: number;
  payCurrency?: string | null;
  payAmount?: string | null;
  address?: string | null;
  network?: string | null;
  networkLabel?: string | null;
  status: string;
  nowPaymentId?: string | null;
  txHash?: string | null;
  createdAt: string;
  paidAt?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

/** Opens a printable A4 invoice. The sheet uses about 85% of the page. */
export function openDepositInvoice(input: DepositInvoiceInput) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=920,height=1200");
  if (!win) return false;
  const logo = `${window.location.origin}/brand/logo-clear.png`;
  const coin = (input.payCurrency || "").toUpperCase() || "—";
  const network = input.networkLabel || input.network || "—";
  const rows: Array<[string, string]> = [
    ["Invoice", input.id],
    ["Status", "Paid in full"],
    ["Customer", input.customerName?.trim() || "Customer"],
    ["Email", input.customerEmail?.trim() || "—"],
    ["Wallet credit", `$${input.amountUsd.toFixed(2)} USD`],
    ["Crypto sent", input.payAmount ? `${input.payAmount} ${coin}` : "—"],
    ["Network", network],
    ["Deposit address", input.address || "—"],
    ["Provider reference", input.nowPaymentId || "—"],
    ["Transaction hash", input.txHash || "—"],
    ["Created", when(input.createdAt)],
    ["Paid", when(input.paidAt)],
  ];
  const body = rows
    .map(
      ([label, value]) =>
        `<div class="row"><dt>${esc(label)}</dt><dd>${esc(String(value))}</dd></div>`,
    )
    .join("");
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>TrustifySMM invoice ${esc(input.id)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e8eaf3; color: #14182e; font: 15px/1.45 "Plus Jakarta Sans", "Segoe UI", sans-serif; }
  .sheet {
    width: 85%;
    min-height: 85vh;
    margin: 4vh auto;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 18px 50px rgba(20, 24, 46, 0.16);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 28px 36px;
    background: #070b18;
  }
  header img { height: 54px; width: auto; }
  header p { margin: 0; color: #c9d0ea; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
  main { padding: 32px 36px 40px; }
  h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.03em; }
  .lead { margin: 0 0 22px; color: #4b5168; }
  .rows { border-top: 1px solid #e4e7f2; }
  .row { display: grid; grid-template-columns: 180px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e4e7f2; }
  dt { color: #5c647c; font-weight: 700; }
  dd { margin: 0; font-weight: 750; word-break: break-word; }
  footer { margin-top: 28px; color: #5c647c; font-size: 12px; }
  .actions { width: 85%; margin: 0 auto 24px; text-align: right; }
  button { border: 0; border-radius: 999px; padding: 10px 18px; color: #fff; font: inherit; font-weight: 750; background: linear-gradient(145deg, #762cff, #287bff); cursor: pointer; }
  @media print {
    body { background: #fff; }
    .actions { display: none; }
    .sheet { width: 85%; min-height: 250mm; margin: 0 auto; box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="actions"><button type="button" onclick="window.print()">Download invoice</button></div>
  <article class="sheet">
    <header>
      <img src="${esc(logo)}" alt="TrustifySMM" />
      <p>Payment invoice</p>
    </header>
    <main>
      <h1>Wallet deposit</h1>
      <p class="lead">TrustifySMM · trustifysmm.com · This invoice is for a completed crypto top-up. The wallet was credited the USD amount below. The network fee was paid by the customer inside the crypto amount.</p>
      <dl class="rows">${body}</dl>
      <footer>TrustifySMM SMM Panel · Invoice ${esc(input.id)} · Paid deposits only</footer>
    </main>
  </article>
</body>
</html>`);
  win.document.close();
  return true;
}
