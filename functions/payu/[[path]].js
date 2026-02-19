import { initDb, dbRun } from '../_db.js';
import { decodeBase64, htmlResponse, readBody } from '../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/payu/, '').split('/').filter(Boolean);
  const method = request.method.toUpperCase();

  try {
    await initDb(env);
  } catch (error) {
    return htmlResponse('Database not available', 500);
  }

  if (segments[0] === 'success' && method === 'POST') {
    try {
      const now = new Date().toISOString();
      try {
        await dbRun(
          env,
          `INSERT INTO system_logs (level, message, created_at)
           VALUES (?, ?, ?)`,
          ['info', 'payu_success', now]
        );
      } catch {
        // ignore logging errors
      }
      const payload = await readBody(request);
      const udf1Raw = payload.udf1 || '';
      let orderData = null;

      if (udf1Raw) {
        try {
          const normalized = decodeURIComponent(String(udf1Raw).replace(/ /g, '+'));
          const decoded = decodeBase64(normalized);
          orderData = decoded ? JSON.parse(decoded) : null;
        } catch {
          orderData = null;
        }
      }

      const customer_name = orderData?.customer_name || payload.firstname || 'Customer';
      const customer_email = orderData?.customer_email || payload.email || '';
      const customer_phone = orderData?.customer_phone || payload.phone || '';
      const shipping_address =
        orderData?.shipping_address ||
        payload.udf2 ||
        [payload.address1, payload.address2, payload.city, payload.state, payload.zipcode || payload.zip]
          .filter(Boolean)
          .join(', ') ||
        'Not provided';

      const status = 'paid';
      const payment_status = 'paid';
      const payment_gateway = 'payu';
      const payu_txn_id = payload.txnid || '';
      const existingOrderId = payload.udf3 || '';

      const orderResponse = await (async () => {
        if (existingOrderId) {
          await dbRun(
            env,
            `UPDATE orders
             SET customer_name = ?, customer_email = ?, customer_phone = ?, shipping_address = ?,
                 payment_status = ?, status = ?, payment_gateway = ?, payu_txn_id = ?
             WHERE id = ?`,
            [
              customer_name,
              customer_email,
              customer_phone,
              shipping_address,
              payment_status,
              status === 'paid' ? 'packed' : status,
              payment_gateway,
              payu_txn_id,
              existingOrderId,
            ]
          );
          return { id: existingOrderId };
        }

        const items = orderData?.items || [];
        if (items.length === 0) {
          return { id: '' };
        }

        const total = items.reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0
        );
        const orderId = `ORD-${Date.now()}`;
        const createdAt = new Date().toISOString();
        await dbRun(
          env,
          `INSERT INTO orders (id, customer_name, customer_email, customer_phone, total, status, payment_status, payment_gateway, payu_txn_id, shipping_id, shipping_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            customer_name,
            customer_email,
            customer_phone,
            total,
            status === 'paid' ? 'packed' : status,
            payment_status,
            payment_gateway,
            payu_txn_id,
            '',
            shipping_address,
            createdAt,
          ]
        );

        for (const item of items) {
          await dbRun(
            env,
            `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product_id,
              item.product_name,
              item.size || '',
              Number(item.quantity),
              Number(item.price),
            ]
          );
        }

        return { id: orderId };
      })();

      if (!orderResponse.id) {
        return htmlResponse('Missing order items.', 400);
      }

      return htmlResponse(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Payment Success</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
<h2>Payment successful</h2>
<p>Your Order ID: <strong>${orderResponse.id}</strong></p>
<a href="/track">Track your order</a>
</body></html>`);
    } catch {
      return htmlResponse('Payment success handling failed.', 500);
    }
  }

  if (segments[0] === 'failure' && method === 'POST') {
    const now = new Date().toISOString();
    try {
      await dbRun(
        env,
        `INSERT INTO system_logs (level, message, created_at)
         VALUES (?, ?, ?)`,
        ['warn', 'payu_failure', now]
      );
    } catch {
      // ignore logging errors
    }
    return htmlResponse(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Payment Failed</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
<h2>Payment failed</h2>
<p>Please try again.</p>
<a href="/checkout">Back to checkout</a>
</body></html>`);
  }

  return htmlResponse('Not found', 404);
}
