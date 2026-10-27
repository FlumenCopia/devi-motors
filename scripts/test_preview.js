const fs = require('fs');

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@devimotors.in', password: 'admin123' })
  }).then(r => r.json());

  const token = loginRes.token;
  const listRes = await fetch('http://localhost:5000/api/invoices', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());

  const inv = listRes.invoices[0];
  console.log('Testing Invoice:', inv.invoiceNumber, 'ID:', inv._id);

  // 1. Badge Only (Default)
  const htmlBadgeOnly = await fetch('http://localhost:5000/api/invoices/' + inv._id + '/preview').then(r => r.text());
  const hasBadgeOnlySig = htmlBadgeOnly.includes('alt="Authorized Signature"');
  const hasBadgeOnlyBadge = htmlBadgeOnly.includes('alt="Digital Stamp Badge"');
  console.log('Badge Only (Default) -> Has Badge:', hasBadgeOnlyBadge, '| Has Signature:', hasBadgeOnlySig);

  // 2. With Signature
  const htmlWithSig = await fetch('http://localhost:5000/api/invoices/' + inv._id + '/preview?withSignature=true').then(r => r.text());
  const hasWithSigSig = htmlWithSig.includes('alt="Authorized Signature"');
  const hasWithSigBadge = htmlWithSig.includes('alt="Digital Stamp Badge"');
  console.log('With Signature -> Has Badge:', hasWithSigBadge, '| Has Signature:', hasWithSigSig);

  // 3. Test Quotation Preview
  const quoListRes = await fetch('http://localhost:5000/api/quotations', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());
  const quo = quoListRes.quotations[0];
  console.log('Testing Quotation:', quo.quotationNumber, 'ID:', quo._id);

  const quoHtmlBadgeOnly = await fetch('http://localhost:5000/api/quotations/' + quo._id + '/preview').then(r => r.text());
  console.log('Quotation Badge Only -> Has Badge:', quoHtmlBadgeOnly.includes('alt="Digital Stamp Badge"'), '| Has Signature:', quoHtmlBadgeOnly.includes('alt="Authorized Signature"'));

  const quoHtmlWithSig = await fetch('http://localhost:5000/api/quotations/' + quo._id + '/preview?withSignature=true').then(r => r.text());
  console.log('Quotation With Signature -> Has Badge:', quoHtmlWithSig.includes('alt="Digital Stamp Badge"'), '| Has Signature:', quoHtmlWithSig.includes('alt="Authorized Signature"'));

  // Save sample HTML to scratch to view
  fs.writeFileSync('scripts/preview_badge_only.html', htmlBadgeOnly);
  fs.writeFileSync('scripts/preview_with_signature.html', htmlWithSig);
  console.log('Successfully saved test preview files.');
}

test().catch(console.error);
