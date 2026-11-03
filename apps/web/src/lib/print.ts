/**
 * Triggers a silent in-page print / Save-as-PDF dialog directly in the browser.
 * 
 * Features:
 * 1. ZERO extra tabs opened (user stays on port 3000 / vercel.app).
 * 2. Suppresses browser headers & footers (removes 'localhost:3000/invoices' and '1/1').
 * 3. Sets the default downloaded PDF filename to the actual Invoice / Quotation Number.
 */
export async function printDocument(url: string, targetIframeId?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Fetch the HTML template from the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Extract document title (e.g. "Invoice DM/01/26-27") to set clean PDF file name
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const invoiceTitle = titleMatch ? titleMatch[1].trim() : '';
    const originalTitle = document.title;
    if (invoiceTitle) {
      document.title = invoiceTitle;
    }

    // 3. Get or create a hidden, same-origin iframe attached to the document body
    let printFrame = document.getElementById('dm-silent-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'dm-silent-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '1px';
      printFrame.style.height = '1px';
      printFrame.style.opacity = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);
    }

    // 4. Inject HTML into the same-origin frame
    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) {
      throw new Error('Unable to access silent print frame document');
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    // 5. Trigger the browser print/save-as-pdf dialog seamlessly
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (printErr) {
        console.error('Silent in-page print failed, falling back:', printErr);
        const printUrl = url.includes('?') ? `${url}&autoPrint=true` : `${url}?autoPrint=true`;
        window.open(printUrl, '_blank');
      } finally {
        // Restore page title after print dialog closes
        setTimeout(() => {
          document.title = originalTitle;
        }, 1500);
      }
    }, 300);
  } catch (error) {
    console.error('Print document error:', error);
    const printUrl = url.includes('?') ? `${url}&autoPrint=true` : `${url}?autoPrint=true`;
    window.open(printUrl, '_blank');
  }
}
