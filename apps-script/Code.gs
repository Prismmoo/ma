const CONFIG = Object.freeze({
  OWNER_EMAIL: 'noureddinelmobaraki@gmail.com',
  DRIVE_FOLDER_ID: '1RManQKy-QLNKgsGHREf1P591zjs4ez3k',
  ORDERS_ROOT_NAME: 'PRISM_CUSTOMER_ORDERS',
  SHEET_ID: '1LW1q0bKS4G5y27j2eH6DI_7UxqUad3-6lGsYpr-eYT0',
  SHEET_NAME: 'Orders',
  TIME_ZONE: 'Africa/Casablanca',
  WHATSAPP_NUMBER: '212652297244',
  MAX_CUSTOM_IMAGE_BYTES: 20 * 1024 * 1024,
  MAX_SIGNATURE_BYTES: 5 * 1024 * 1024,
  MAX_PREVIEW_BYTES: 5 * 1024 * 1024,
  MAX_REMOTE_FETCHES_PER_ORDER: 60,
});

const ALLOWED_MIMES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

const HEADERS = Object.freeze([
  'Created At', 'Order ID', 'Status', 'Customer Name', 'WhatsApp',
  'Items', 'Quantity', 'Grand Total', 'Customer Uploads', 'Signatures',
  'Order Folder', 'Order JSON', 'Pack Components', 'Component Images',
  'White Glove', 'Client Request ID'
]);

function setup() {
  const parent = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  getOrCreateFolder_(parent, CONFIG.ORDERS_ROOT_NAME);
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS.slice());
  sheet.setFrozenRows(1);
  MailApp.getRemainingDailyQuota();
  return 'PRISM order receiver is ready.';
}

function doGet() {
  return json_({
    ok: true,
    service: 'PRISM Order Receiver',
    version: 5,
    acceptsSchemas: [1, 2, 3],
    packs: true,
    fileNaming: 'customer-name',
    componentArtwork: true
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    if (!e || !e.postData || !e.postData.contents) throw new Error('Empty request.');

    const order = JSON.parse(e.postData.contents);
    if (order.website) return json_({ ok: true }); // honeypot

    // Idempotency check
    if (order.clientRequestId) {
      const requestKey = 'completed:' + order.clientRequestId;
      const props = PropertiesService.getScriptProperties();
      const existing = props.getProperty(requestKey);
      if (existing) return json_(JSON.parse(existing));
    }

    validateOrder_(order);

    const orderId = createOrderId_();
    const parent = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const root = getOrCreateFolder_(parent, CONFIG.ORDERS_ROOT_NAME);
    const customerName = String(order.customer && order.customer.name || 'Customer').trim();
    const folderName = slugify_(customerName) + ' - ' + orderId;
    const folder = root.createFolder(folderName);

    let customerUploadCount = 0;
    let signatureCount = 0;
    const totals = {
      packComponents: 0,
      archivedComponentImages: 0,
      remoteFetches: 0,
      fetchFailures: []
    };
    const itemsWithFiles = [];
    const mailAttachments = [];

    order.items.forEach(function(item, index) {
      const number = String(index + 1).padStart(2, '0');
      const itemFiles = {
        originalUrl: '',
        signatureUrl: '',
        proofUrl: '',
        recipeUrl: '',
        printSpecUrl: '',
        packFolderUrl: '',
        packManifestUrl: '',
      };

      // 1. Original Artwork
      if (item.transport && item.transport.customerOriginalDataUrl) {
        const saved = saveDataUrl_(
          folder,
          item.transport.customerOriginalDataUrl,
          CONFIG.MAX_CUSTOM_IMAGE_BYTES,
          slugify_(customerName) + '-' + number + '-original-customer'
        );
        itemFiles.originalUrl = saved.file.getUrl();
        customerUploadCount += 1;
        delete item.transport.customerOriginalDataUrl;
      }

      // 2. Signature
      if (item.transport && item.transport.uploadedSignatureDataUrl) {
        const saved = saveDataUrl_(
          folder,
          item.transport.uploadedSignatureDataUrl,
          CONFIG.MAX_SIGNATURE_BYTES,
          slugify_(customerName) + '-' + number + '-signature'
        );
        itemFiles.signatureUrl = saved.file.getUrl();
        signatureCount += 1;
        delete item.transport.uploadedSignatureDataUrl;
      }

      // 3. Proof
      if (item.proof && item.proof.dataUrl) {
        const saved = saveDataUrl_(
          folder,
          item.proof.dataUrl,
          CONFIG.MAX_PREVIEW_BYTES,
          slugify_(customerName) + '-' + number + '-proof-final'
        );
        itemFiles.proofUrl = saved.file.getUrl();
        if (totalAttachmentsSize_(mailAttachments) + saved.bytes <= 9 * 1024 * 1024) {
          mailAttachments.push(saved.blob);
        }
        delete item.proof.dataUrl;
      }

      // 4. Recipe
      if (item.renderRecipe) {
        const recipeBlob = Utilities.newBlob(
          JSON.stringify(item.renderRecipe, null, 2),
          'application/json',
          slugify_(customerName) + '-' + number + '-recipe.json'
        );
        const recipeFile = folder.createFile(recipeBlob);
        itemFiles.recipeUrl = recipeFile.getUrl();
      }

      // 5. Print Spec
      if (item.renderRecipe && item.renderRecipe.output) {
        const spec = {
          orderId: orderId,
          itemId: item.id,
          dimensions: item.renderRecipe.output,
          quality: item.renderRecipe.quality,
          frame: item.renderRecipe.frame || null,
          shape: item.renderRecipe.shape || null,
          finish: item.renderRecipe.finish || null,
        };
        const specBlob = Utilities.newBlob(
          JSON.stringify(spec, null, 2),
          'application/json',
          slugify_(customerName) + '-' + number + '-print-spec.json'
        );
        const specFile = folder.createFile(specBlob);
        itemFiles.printSpecUrl = specFile.getUrl();
      }

      // 6. Process Pack (if item is a pack)
      if (item.pack) {
        const packResult = processPack_(item, number, folder, customerName, totals, mailAttachments);
        if (packResult) {
          itemFiles.packFolderUrl = packResult.packFolderUrl;
          itemFiles.packManifestUrl = packResult.manifestUrl;
          item.processedPack = packResult;
        }
      }

      item.files = itemFiles;
      itemsWithFiles.push(item);
    });

    const storedOrder = {
      schemaVersion: order.schemaVersion || 2,
      rendererVersion: order.items[0]?.renderRecipe?.rendererVersion || 'unknown',
      orderId: orderId,
      clientRequestId: order.clientRequestId,
      createdAt: new Date().toISOString(),
      customer: order.customer,
      whiteGloveService: !!order.whiteGloveService,
      grandTotal: Number(order.grandTotal),
      totals: totals,
      items: order.items,
    };

    const jsonFile = folder.createFile(
      Utilities.newBlob(
        JSON.stringify(storedOrder, null, 2),
        'application/json',
        slugify_(customerName) + '-' + orderId + '-order.json'
      )
    );

    appendSheet_(storedOrder, folder.getUrl(), jsonFile.getUrl(), customerUploadCount, signatureCount, totals);
    sendOwnerEmailV2_(storedOrder, folder.getUrl(), jsonFile.getUrl(), mailAttachments);

    const whatsappText = [
      'PRISM order ' + orderId,
      'Name: ' + storedOrder.customer.name,
      'Total: ' + storedOrder.grandTotal + ' dh',
      'Status: Files received and secured.',
    ].join('\n');
    const whatsappUrl = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER
      + '?text=' + encodeURIComponent(whatsappText);

    const result = { ok: true, orderId: orderId, folderUrl: folder.getUrl(), whatsappUrl: whatsappUrl };

    // Save for idempotency
    if (order.clientRequestId) {
      PropertiesService.getScriptProperties().setProperty('completed:' + order.clientRequestId, JSON.stringify(result));
    }

    return json_(result);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function validateOrder_(order) {
  if (!order || (order.schemaVersion !== 1 && order.schemaVersion !== 2 && order.schemaVersion !== 3)) {
    throw new Error('Unsupported order schema.');
  }
  const name = String(order.customer && order.customer.name || '').trim();
  const whatsapp = String(order.customer && order.customer.whatsapp || '').replace(/[^0-9+]/g, '');
  if (name.length < 2 || name.length > 120) throw new Error('Invalid customer name.');
  if (whatsapp.replace(/\D/g, '').length < 8 || whatsapp.length > 20) throw new Error('Invalid WhatsApp number.');
  if (!Array.isArray(order.items) || !order.items.length || order.items.length > 30) throw new Error('Invalid cart.');
  if (!Number.isFinite(Number(order.grandTotal)) || Number(order.grandTotal) < 0) throw new Error('Invalid total.');
  order.customer.name = name;
  order.customer.whatsapp = whatsapp;
}

function saveRemoteImage_(folder, url, baseName, totals) {
  if (!url || typeof url !== 'string') {
    if (totals) totals.fetchFailures.push(baseName + ': missing or empty URL');
    return null;
  }
  if (totals && totals.remoteFetches >= CONFIG.MAX_REMOTE_FETCHES_PER_ORDER) {
    if (totals) totals.fetchFailures.push(baseName + ': fetch limit exceeded (' + CONFIG.MAX_REMOTE_FETCHES_PER_ORDER + ')');
    return null;
  }
  try {
    if (totals) totals.remoteFetches += 1;
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'User-Agent': 'PRISM-Order-Receiver/5.0' }
    });
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      if (totals) totals.fetchFailures.push(baseName + ': HTTP ' + code + ' for ' + url);
      return null;
    }
    let blob = response.getBlob();
    let mime = blob.getContentType();

    if (!ALLOWED_MIMES[mime]) {
      const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
      if (cleanUrl.endsWith('.webp')) mime = 'image/webp';
      else if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (cleanUrl.endsWith('.png')) mime = 'image/png';
    }

    const ext = ALLOWED_MIMES[mime] || 'png';
    blob.setName(baseName + '.' + ext);
    if (ALLOWED_MIMES[mime]) {
      blob.setContentType(mime);
    }
    const file = folder.createFile(blob);
    return { file: file, blob: blob, bytes: blob.getBytes().length, ext: ext };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (totals) totals.fetchFailures.push(baseName + ': ' + msg);
    return null;
  }
}

function saveDataUrl_(folder, dataUrl, maxBytes, baseName) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl));
  if (!match || !ALLOWED_MIMES[match[1]]) throw new Error('Unsupported image payload.');
  const bytes = Utilities.base64Decode(match[2].replace(/[\r\n]/g, ''));
  if (!bytes.length || bytes.length > maxBytes) throw new Error(baseName + ' exceeds its size limit.');
  const extension = ALLOWED_MIMES[match[1]];
  const blob = Utilities.newBlob(bytes, match[1], baseName + '.' + extension);
  const file = folder.createFile(blob);
  return { file: file, blob: blob, bytes: bytes.length };
}

function processPack_(item, itemNumber, itemFolder, customerName, totals, mailAttachments) {
  if (!item.pack || !Array.isArray(item.pack.components)) return null;

  const packFolder = itemFolder.createFolder(itemNumber + '-pack-' + slugify_(item.pack.packType || 'bundle'));
  let archivedComponentImages = 0;
  const processedComponents = [];

  item.pack.components.forEach(function(comp) {
    const slotStr = 'C' + String(comp.slot || 1).padStart(2, '0');
    const compSlug = slugify_(comp.title || comp.sourceId || 'piece');
    const baseName = slugify_(customerName) + '-' + itemNumber + '-' + slotStr + '-' + compSlug;

    let artworkFile = null;
    let artworkSource = 'none';

    // 1. Upload bytes in transport.artworkDataUrl
    if (comp.transport && comp.transport.artworkDataUrl) {
      try {
        const saved = saveDataUrl_(packFolder, comp.transport.artworkDataUrl, CONFIG.MAX_CUSTOM_IMAGE_BYTES, baseName + '-artwork');
        artworkFile = saved;
        artworkSource = 'upload';
        archivedComponentImages += 1;
        if (mailAttachments && saved.bytes <= 2 * 1024 * 1024 && totalAttachmentsSize_(mailAttachments) + saved.bytes <= 9 * 1024 * 1024) {
          mailAttachments.push(saved.blob);
        }
      } catch (e) {
        totals.fetchFailures.push(baseName + ' (upload): ' + e.message);
      }
    }
    // 2. CDN URL in sourceImageUrl or imageUrl
    else if ((comp.sourceImageUrl || comp.imageUrl) && !String(comp.sourceImageUrl || comp.imageUrl).startsWith('data:')) {
      const url = comp.sourceImageUrl || comp.imageUrl;
      const fetched = saveRemoteImage_(packFolder, url, baseName + '-artwork', totals);
      if (fetched) {
        artworkFile = fetched;
        artworkSource = 'cdn';
        archivedComponentImages += 1;
        if (mailAttachments && fetched.bytes <= 2 * 1024 * 1024 && totalAttachmentsSize_(mailAttachments) + fetched.bytes <= 9 * 1024 * 1024) {
          mailAttachments.push(fetched.blob);
        }
      }
    }
    // 3. Fallback to customerOriginalDataUrl if present
    else if (comp.transport && comp.transport.customerOriginalDataUrl) {
      try {
        const saved = saveDataUrl_(packFolder, comp.transport.customerOriginalDataUrl, CONFIG.MAX_CUSTOM_IMAGE_BYTES, baseName + '-artwork');
        artworkFile = saved;
        artworkSource = 'original-transport';
        archivedComponentImages += 1;
        if (mailAttachments && saved.bytes <= 2 * 1024 * 1024 && totalAttachmentsSize_(mailAttachments) + saved.bytes <= 9 * 1024 * 1024) {
          mailAttachments.push(saved.blob);
        }
      } catch (e) {
        totals.fetchFailures.push(baseName + ' (original): ' + e.message);
      }
    }

    const compSpec = {
      slot: comp.slot,
      role: comp.role,
      sourceId: comp.sourceId,
      title: comp.title,
      artistId: comp.artistId,
      artistName: comp.artistName,
      style: comp.style,
      subCategory: comp.subCategory || null,
      year: comp.year,
      widthCm: comp.widthCm,
      heightCm: comp.heightCm,
      finish: comp.finish || null,
      catalogPrice: comp.catalogPrice,
      colorPalette: comp.colorPalette || [],
      paletteNames: comp.paletteNames || [],
      sourceImageUrl: comp.sourceImageUrl || comp.imageUrl || '',
      artworkSource: artworkSource,
      artworkFileUrl: artworkFile ? artworkFile.file.getUrl() : null,
      archivedAt: new Date().toISOString()
    };

    const specBlob = Utilities.newBlob(
      JSON.stringify(compSpec, null, 2),
      'application/json',
      baseName + '-component.json'
    );
    const specFile = packFolder.createFile(specBlob);

    processedComponents.push({
      spec: compSpec,
      specUrl: specFile.getUrl(),
      artworkUrl: artworkFile ? artworkFile.file.getUrl() : null
    });
  });

  const manifestData = {
    packType: item.pack.packType,
    packLabel: item.pack.packLabel,
    componentCount: item.pack.componentCount,
    packaging: item.pack.packaging,
    finish: item.pack.finish,
    pricing: item.pack.pricing,
    composedAt: item.pack.composedAt,
    archivedComponentImages: archivedComponentImages,
    components: processedComponents.map(function(pc) { return pc.spec; })
  };
  const manifestBlob = Utilities.newBlob(
    JSON.stringify(manifestData, null, 2),
    'application/json',
    slugify_(customerName) + '-' + itemNumber + '-pack-manifest.json'
  );
  const manifestFile = packFolder.createFile(manifestBlob);

  totals.packComponents += item.pack.components.length;
  totals.archivedComponentImages += archivedComponentImages;

  return {
    packFolderUrl: packFolder.getUrl(),
    manifestUrl: manifestFile.getUrl(),
    processedComponents: processedComponents,
    archivedComponentImages: archivedComponentImages,
    totalComponents: item.pack.components.length
  };
}

function totalAttachmentsSize_(attachments) {
  return attachments.reduce(function(sum, blob) { return sum + blob.getBytes().length; }, 0);
}

function sendOwnerEmailV2_(order, folderUrl, jsonUrl, attachments) {
  const rows = order.items.map(function(item) {
    const f = item.files || {};
    const r = item.renderRecipe || {};
    const q = r.quality || {};

    let details = '';

    if (item.pack && item.processedPack) {
      const pack = item.processedPack;
      const compRows = pack.processedComponents.map(function(pc) {
        const spec = pc.spec;
        const swatches = (spec.colorPalette || []).map(function(c) {
          return '<span style="display:inline-block;width:10px;height:10px;background:' + escapeHtml_(c) + ';margin-right:2px;border-radius:2px"></span>';
        }).join('');

        const artworkLink = pc.artworkUrl
          ? '<a href="' + safeUrl_(pc.artworkUrl) + '">Artwork</a>'
          : '<span style="color:red;font-weight:bold">Fetch failed</span>';

        return '<tr>'
          + '<td style="padding:4px;border:1px solid #eee">C' + String(spec.slot).padStart(2, '0') + '</td>'
          + '<td style="padding:4px;border:1px solid #eee"><b>' + escapeHtml_(spec.title) + '</b><br>' + escapeHtml_(spec.artistName) + (spec.subCategory ? ' (' + escapeHtml_(spec.subCategory) + ')' : '') + '</td>'
          + '<td style="padding:4px;border:1px solid #eee">' + spec.widthCm + '×' + spec.heightCm + 'cm' + (spec.finish ? ' · ' + escapeHtml_(spec.finish) : '') + '</td>'
          + '<td style="padding:4px;border:1px solid #eee">' + artworkLink + ' · <a href="' + safeUrl_(pc.specUrl) + '">Spec</a></td>'
          + '<td style="padding:4px;border:1px solid #eee">' + escapeHtml_(spec.sourceId) + '<br>' + swatches + '</td>'
          + '</tr>';
      }).join('');

      details = '<b>Pack Details:</b> ' + escapeHtml_(item.pack.packLabel || 'Bundle') + '<br>'
        + '<b>Components Archived:</b> ' + pack.archivedComponentImages + '/' + pack.totalComponents + '<br>'
        + '• <a href="' + safeUrl_(f.packFolderUrl) + '">Pack Folder</a><br>'
        + '• <a href="' + safeUrl_(f.packManifestUrl) + '">Pack Manifest JSON</a>'
        + '<table style="border-collapse:collapse;width:100%;margin-top:6px;font-size:10px">'
        + '<thead><tr style="background:#f9f9f9"><th style="padding:4px;border:1px solid #eee">Slot</th><th style="padding:4px;border:1px solid #eee">Title</th><th style="padding:4px;border:1px solid #eee">Specs</th><th style="padding:4px;border:1px solid #eee">Links</th><th style="padding:4px;border:1px solid #eee">Source / Palette</th></tr></thead>'
        + '<tbody>' + compRows + '</tbody>'
        + '</table>';
    } else {
      details = [
        '<b>Quality:</b> ' + (q.effectiveDpiX || '?') + ' DPI ' + (q.warning ? '<span style="color:red">(' + q.warning + ')</span>' : ''),
        '<b>Print:</b> ' + r.output.widthCm + '×' + r.output.heightCm + ' cm',
        r.frame ? '<b>Frame:</b> ' + r.frame.name : '',
        r.shape ? '<b>Shape:</b> ' + r.shape.label : '',
        r.finish ? '<b>Finish:</b> ' + r.finish.name : '',
        '<b>Files:</b>',
        '• <a href="' + safeUrl_(f.proofUrl) + '">Final Proof</a>',
        f.originalUrl ? '• <a href="' + safeUrl_(f.originalUrl) + '">Original Customer Art</a>' : '',
        f.signatureUrl ? '• <a href="' + safeUrl_(f.signatureUrl) + '">Uploaded Signature</a>' : '',
        '• <a href="' + safeUrl_(f.recipeUrl) + '">Render Recipe (JSON)</a>'
      ].filter(Boolean).join('<br>');
    }

    return '<tr>'
      + '<td style="padding:8px;border:1px solid #ddd">' + escapeHtml_(item.type) + '</td>'
      + '<td style="padding:8px;border:1px solid #ddd"><b>' + escapeHtml_(item.title) + '</b><br>' + escapeHtml_(item.artistName) + '</td>'
      + '<td style="padding:8px;border:1px solid #ddd">' + escapeHtml_(String(item.quantity)) + '</td>'
      + '<td style="padding:8px;border:1px solid #ddd">' + escapeHtml_(String(item.lineTotal)) + ' dh</td>'
      + '<td style="padding:8px;border:1px solid #ddd;font-size:11px">' + details + '</td>'
      + '</tr>';
  }).join('');

  let warningsHtml = '';
  if (order.totals && order.totals.fetchFailures && order.totals.fetchFailures.length > 0) {
    warningsHtml = '<div style="background:#fee2e2;border:1px solid #ef4444;padding:10px;margin-bottom:15px;border-radius:4px;color:#991b1b;font-size:11px">'
      + '<b>Image Fetch Failures:</b><ul>'
      + order.totals.fetchFailures.map(function(msg) { return '<li>' + escapeHtml_(msg) + '</li>'; }).join('')
      + '</ul></div>';
  }

  const whatsappHref = 'https://wa.me/' + String(order.customer.whatsapp).replace(/\D/g, '');
  const html = '<div style="font-family:Arial,sans-serif;color:#17151f;max-width:1000px">'
    + '<h2>PRISM Order Received</h2>'
    + warningsHtml
    + '<p><b>Order ID:</b> ' + escapeHtml_(order.orderId) + '<br>'
    + '<b>Renderer:</b> ' + escapeHtml_(order.rendererVersion) + '</p>'
    + '<p><b>Customer:</b> ' + escapeHtml_(order.customer.name) + '<br>'
    + '<b>WhatsApp:</b> <a href="' + safeUrl_(whatsappHref) + '">' + escapeHtml_(order.customer.whatsapp) + '</a></p>'
    + '<table style="border-collapse:collapse;width:100%"><thead><tr style="background:#f4f4f4">'
    + '<th style="padding:8px;border:1px solid #ddd">Type</th>'
    + '<th style="padding:8px;border:1px solid #ddd">Product</th>'
    + '<th style="padding:8px;border:1px solid #ddd">Qty</th>'
    + '<th style="padding:8px;border:1px solid #ddd">Total</th>'
    + '<th style="padding:8px;border:1px solid #ddd">Production Specs & Files</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table>'
    + '<h3>Grand Total: ' + escapeHtml_(String(order.grandTotal)) + ' dh</h3>'
    + '<p><a href="' + safeUrl_(folderUrl) + '" style="display:inline-block;padding:10px 20px;background:#7952F3;color:white;text-decoration:none;border-radius:4px">Open Production Folder</a></p>'
    + '<p style="font-size:11px;color:#666">Full order data available at: <a href="' + safeUrl_(jsonUrl) + '">' + order.orderId + '-order.json</a></p></div>';

  GmailApp.sendEmail(
    CONFIG.OWNER_EMAIL,
    'PRISM ' + order.orderId + ' — ' + order.customer.name,
    'Open this message in HTML view.',
    { htmlBody: html, attachments: attachments, name: 'PRISM Production' },
  );
}

function appendSheet_(order, folderUrl, jsonUrl, uploads, signatures, totals) {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS.slice());
  const quantity = order.items.reduce(function(sum, item) { return sum + Number(item.quantity || 0); }, 0);
  const itemSummary = order.items.map(function(item) {
    return item.quantity + '× ' + item.type + ': ' + item.title;
  }).join(' | ');

  const packComponents = totals ? totals.packComponents : 0;
  const componentImages = totals ? totals.archivedComponentImages : 0;
  const whiteGlove = order.whiteGloveService ? 'Yes' : 'No';

  sheet.appendRow([
    Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, 'yyyy-MM-dd HH:mm:ss'),
    order.orderId,
    'New / جديد',
    safeCell_(order.customer.name),
    safeCell_(order.customer.whatsapp),
    safeCell_(itemSummary),
    quantity,
    order.grandTotal,
    uploads,
    signatures,
    folderUrl,
    jsonUrl,
    packComponents,
    componentImages,
    whiteGlove,
    safeCell_(order.clientRequestId || ''),
  ]);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  return sheet;
}

function getOrCreateFolder_(parent, name) {
  const iterator = parent.getFoldersByName(name);
  return iterator.hasNext() ? iterator.next() : parent.createFolder(name);
}

function createOrderId_() {
  const date = Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, 'yyyyMMdd');
  const suffix = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'PRZ-' + date + '-' + suffix;
}

function slugify_(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'item';
}

function safeCell_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl_(value) {
  return escapeHtml_(String(value || '').replace(/[^\x20-\x7E]/g, ''));
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
