export type ApiDocEndpoint = {
  id: string;
  title: string;
  action?: string;
  method: "POST" | "GET";
  path: string;
  summary: string;
  params: { name: string; required: boolean; description: string }[];
  responseExample: string;
  curlExample: string;
};

export const API_BASE_PATH = "/api/v2";
export const BANKER_INVOICE_PATH = "/api/banker/invoice";
export const BANKER_STATUS_PATH = "/api/banker/status";

export const apiDocEndpoints: ApiDocEndpoint[] = [
  {
    id: "services",
    title: "Service list",
    action: "services",
    method: "POST",
    path: API_BASE_PATH,
    summary: "Returns every active service with rate, min, max and category — same catalog as the public pricing page.",
    params: [
      { name: "key", required: true, description: "Your panel API key (Account → API)." },
      { name: "action", required: true, description: "Must be services." },
    ],
    responseExample: `[
  {
    "service": 101,
    "name": "Instagram Followers | HQ",
    "type": "Default",
    "category": "Instagram Followers",
    "rate": "1.25",
    "min": "100",
    "max": "50000",
    "refill": true,
    "cancel": true,
    "dripfeed": false,
    "description": "..."
  }
]`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/v2" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=services"`,
  },
  {
    id: "add",
    title: "Add order",
    action: "add",
    method: "POST",
    path: API_BASE_PATH,
    summary: "Place a new order. Balance is charged instantly when the order is accepted.",
    params: [
      { name: "key", required: true, description: "API key." },
      { name: "action", required: true, description: "Must be add." },
      { name: "service", required: true, description: "Service ID from the services list." },
      { name: "link", required: true, description: "Target URL or username." },
      { name: "quantity", required: true, description: "Order quantity (integer)." },
      { name: "runs", required: false, description: "Drip-feed runs (if enabled on service)." },
      { name: "interval", required: false, description: "Minutes between drip-feed runs." },
    ],
    responseExample: `{ "order": 900014 }`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/v2" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=add" \\
  -d "service=101" \\
  -d "link=https://instagram.com/username" \\
  -d "quantity=1000"`,
  },
  {
    id: "status",
    title: "Order status",
    action: "status",
    method: "POST",
    path: API_BASE_PATH,
    summary: "Check one order by ID.",
    params: [
      { name: "key", required: true, description: "API key." },
      { name: "action", required: true, description: "Must be status." },
      { name: "order", required: true, description: "Order ID returned from add." },
    ],
    responseExample: `{
  "charge": "1.2500",
  "start_count": "0",
  "status": "Processing",
  "remains": "1000",
  "currency": "USD"
}`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/v2" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=status" \\
  -d "order=900014"`,
  },
  {
    id: "multi_status",
    title: "Multiple order status",
    action: "multi_status",
    method: "POST",
    path: API_BASE_PATH,
    summary: "Check up to hundreds of orders in one call (comma-separated IDs).",
    params: [
      { name: "key", required: true, description: "API key." },
      { name: "action", required: true, description: "Must be multi_status." },
      { name: "orders", required: true, description: "Comma-separated order IDs, e.g. 90001,90002,90003." },
    ],
    responseExample: `{
  "900014": {
    "charge": "1.2500",
    "start_count": "0",
    "status": "Completed",
    "remains": "0",
    "currency": "USD"
  }
}`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/v2" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=multi_status" \\
  -d "orders=900014,900015"`,
  },
  {
    id: "balance",
    title: "Balance",
    action: "balance",
    method: "POST",
    path: API_BASE_PATH,
    summary: "Current account balance in USD.",
    params: [
      { name: "key", required: true, description: "API key." },
      { name: "action", required: true, description: "Must be balance." },
    ],
    responseExample: `{ "balance": "124.5000", "currency": "USD" }`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/v2" \\
  -d "key=YOUR_API_KEY" \\
  -d "action=balance"`,
  },
  {
    id: "banker",
    title: "Banker — create balance invoice",
    method: "POST",
    path: BANKER_INVOICE_PATH,
    summary:
      "Creates a crypto top-up invoice linked to your API key. After payment, our webhook credits balance automatically (NOWPayments or demo mode).",
    params: [
      { name: "key", required: true, description: "API key to credit (JSON field)." },
      { name: "amount", required: true, description: "USD amount (number, min $1)." },
    ],
    responseExample: `{
  "invoice_id": "TSM-A1B2C3D4E5F6",
  "amount": "50.00",
  "currency": "USD",
  "status": "pending",
  "payment_url": "https://trustifysmm.com/...",
  "pay_address": null,
  "provider": "demo"
}`,
    curlExample: `curl -X POST "https://trustifysmm.com/api/banker/invoice" \\
  -H "Content-Type: application/json" \\
  -d '{"key":"YOUR_API_KEY","amount":50}'`,
  },
  {
    id: "banker-status",
    title: "Banker — invoice status",
    method: "GET",
    path: BANKER_STATUS_PATH,
    summary: "Poll invoice until status becomes paid, then call balance.",
    params: [{ name: "id", required: true, description: "invoice_id from create invoice." }],
    responseExample: `{
  "invoice_id": "TSM-A1B2C3D4E5F6",
  "amount": "50.00",
  "currency": "USD",
  "status": "paid",
  "paid_at": "2026-11-17T12:00:00.000Z"
}`,
    curlExample: `curl "https://trustifysmm.com/api/banker/status?id=TSM-A1B2C3D4E5F6"`,
  },
];

export const apiErrorCodes = [
  { code: "Invalid API key", meaning: "Key missing, wrong, or revoked." },
  { code: "Not enough funds", meaning: "Top up via Banker or panel before placing orders." },
  { code: "Service not found", meaning: "Use services action and valid numeric service ID." },
  { code: "Incorrect order ID", meaning: "Order does not exist or belongs to another account." },
];