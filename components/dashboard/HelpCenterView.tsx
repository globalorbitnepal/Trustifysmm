import Link from "next/link";

const MAIL = "support@trustifysmm.com";

export function HelpCenterView() {
  return (
    <section className="cp-help">
      <p className="cp-kicker">Help Center</p>
      <h2>Get an answer on an order</h2>
      <p className="cp-help-lead">
        A ticket inside the panel is the fastest way. We can see the order, the charge and the wallet from the same screen.
        If a ticket sits without a reply, write to us by email and include the same order number.
      </p>

      <div className="cp-help-grid">
        <article className="cp-card cp-help-card">
          <p className="cp-kicker">Preferred</p>
          <h3>Open a support ticket</h3>
          <p>Use this for a new order question, a complaint, a refill or anything about a charge.</p>
          <ol>
            <li>Open Support Tickets and choose New ticket.</li>
            <li>Write the order number, the link you ordered, and what you expected.</li>
            <li>Send it. Replies stay on that ticket, next to the order.</li>
          </ol>
          <Link className="cp-btn" href="/dashboard/tickets">Go to Support Tickets</Link>
        </article>

        <article className="cp-card cp-help-card">
          <p className="cp-kicker">If the ticket is quiet</p>
          <h3>Email the same request</h3>
          <p>Email is the better path when a ticket has no reply. Send it from the address on your account so we can match the wallet.</p>
          <p className="cp-help-mail"><a href={`mailto:${MAIL}`}>{MAIL}</a></p>
          <ul>
            <li>Your account email</li>
            <li>Order number</li>
            <li>The link and the quantity</li>
            <li>What you already tried on the ticket</li>
          </ul>
          <a className="cp-btn cp-btn-ghost" href={`mailto:${MAIL}?subject=Order%20help`}>Email support</a>
        </article>
      </div>

      <article className="cp-card">
        <h3>What we can check from a ticket or an email</h3>
        <div className="cp-help-points">
          <div><strong>Order status</strong><span>Pending, in progress, completed, partial or cancelled.</span></div>
          <div><strong>The charge</strong><span>The amount left your wallet when the order was accepted. A cancel returns that amount.</span></div>
          <div><strong>A refill</strong><span>Ask on the order page when the service offers one, or mention it in the ticket.</span></div>
          <div><strong>Wallet credit</strong><span>A deposit appears only after the payment is confirmed. The network fee is not added to the wallet.</span></div>
        </div>
      </article>
    </section>
  );
}
