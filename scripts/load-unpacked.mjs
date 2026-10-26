const base = `http://127.0.0.1:${process.env.CDP_PORT || '9230'}`;
const { webSocketDebuggerUrl } = await (await fetch(`${base}/json/version`)).json();
const socket = new WebSocket(webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
socket.onmessage = ({ data }) => { const result = JSON.parse(data); if (result.id === 1) { console.log(JSON.stringify(result)); socket.close(); } };
socket.send(JSON.stringify({ id: 1, method: 'Extensions.loadUnpacked', params: { path: process.argv[2] } }));
