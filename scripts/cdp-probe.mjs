import { writeFileSync } from 'node:fs';
const targetURL = process.argv[2];
if (!targetURL) throw new Error('Usage: node scripts/cdp-probe.mjs URL');
const base = `http://127.0.0.1:${process.env.CDP_PORT || '9229'}`;
const target = await (await fetch(`${base}/json/new?${targetURL}`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let sequence = 0;
function command(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const handler = event => { const data = JSON.parse(event.data); if (data.id !== id) return; socket.removeEventListener('message', handler); data.error ? reject(data.error) : resolve(data.result); };
    socket.addEventListener('message', handler);
    socket.send(JSON.stringify({ id, method, params }));
  });
}
await command('Page.enable');
await new Promise(resolve => setTimeout(resolve, Number(process.env.CDP_WAIT_MS || 1500)));
const expression = process.argv[3] || `JSON.stringify({title:document.title,url:location.href,body:document.body?.innerText.slice(0,400),extensionId:typeof chrome!=='undefined'&&chrome.runtime?.id,gate:!!document.getElementById('intent-gate-root')})`;
const result = await command('Runtime.evaluate', { expression, returnByValue: true });
console.log(result.result.value ?? result.result.description);
if (process.env.SCREENSHOT_PATH) {
  const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(process.env.SCREENSHOT_PATH, Buffer.from(image.data, 'base64'));
  console.log(`Screenshot: ${process.env.SCREENSHOT_PATH}`);
}
socket.close();
