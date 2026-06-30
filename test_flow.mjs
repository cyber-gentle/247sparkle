// End-to-end flow test for the migrated quotation + certificate routes.
const BASE = 'http://localhost:4028';

async function main() {
  // 1. Admin login
  const loginRes = await fetch(`${BASE}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@247sparkle.com', password: 'admin123' }),
  });
  const loginBody = await loginRes.json();
  // Pull the Set-Cookie header to use as a Cookie header
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const token = setCookie.split('auth_token=')[1]?.split(';')[0];
  console.log('[login] status:', loginRes.status, '| token set:', !!token);

  const authCookie = `auth_token=${token}`;

  // 2. Admin GET quotations
  const getRes = await fetch(`${BASE}/api/quotations`, {
    headers: { Cookie: authCookie },
  });
  const getBody = await getRes.json();
  console.log('[quotations GET admin] status:', getRes.status, '| count:', getBody.quotations?.length);

  // 3. Admin PUT quotation status
  const qid = getBody.quotations?.[0]?.id;
  if (qid) {
    const putRes = await fetch(`${BASE}/api/quotations/${qid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie },
      body: JSON.stringify({ status: 'responded' }),
    });
    const putBody = await putRes.json();
    console.log('[quotations PUT admin] status:', putRes.status, '| status:', putBody.quotation?.status, '| respondedAt set:', !!putBody.quotation?.respondedAt);
  }

  // 4. Public verify (no auth)
  const verifyRes = await fetch(`${BASE}/api/certificates/verify/SPKFUM-2026-00001`);
  const verifyBody = await verifyRes.json();
  console.log('[verify public] status:', verifyRes.status, '| valid:', verifyBody.valid, '| name:', verifyBody.certificate?.customerName);

  // 5. Public quotation POST (no auth)
  const postRes = await fetch(`${BASE}/api/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceType: 'office_fumigation', contactName: 'Flow Test', address: '2 Test Rd', phone: '08099999999', email: 'flow@test.com', message: 'msg' }),
  });
  console.log('[quotation POST public] status:', postRes.status);

  // 6. Protected route without token -> JSON 401
  const noAuthRes = await fetch(`${BASE}/api/quotations`);
  console.log('[quotations GET no-auth] status:', noAuthRes.status, '| body:', (await noAuthRes.text()).slice(0, 40));
}

main().catch((e) => { console.error('TEST ERROR:', e); process.exit(1); });
