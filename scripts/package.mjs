import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const shared = join(root, 'extension-src');
const key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmTFs5AhNyNiNzSgD9MR0a2ZLe7hiexUBTKXvA2Fk1opdmPU+iqRsQPEFTk9g3hc+KFeXUgYVgBPL+chIc0haGG9xe36QY6Tu5w1705NFXEGqf4VGcd5tY/8pqm+jTmB4jWuY+eKHn9/IQ1vfVQ0/YCDVqx7NhKGTzsNT0EdEBGbmxz/uxVi7PdUpLDcQuMYkGIhayimQSAvZLzqPDCHieNK++iPhs3Tk96+l4eS6lwLBmqqvCvg/QvzjyNRXxPcT61ov3qyvUKc+PL/dG2RmCy26eEEKz2axVVFaYzbwPtmLo0CrHYvEz+YeUb2u7+EPrNErVyTAvJfxdFSzN8GoDwIDAQAB';
const manifest = {
  manifest_version: 3,
  name: 'YouTube Intent Gate',
  version: '0.1.0',
  description: 'Choose your intention before opening YouTube Home.',
  permissions: ['storage'],
  host_permissions: ['https://www.youtube.com/*'],
  icons: { '16': 'icons/doctor-doom-16.png', '32': 'icons/doctor-doom-32.png', '48': 'icons/doctor-doom-48.png', '128': 'icons/doctor-doom-128.png' },
  action: { default_title: 'Intent Gate', default_popup: 'popup/popup.html' },
  content_scripts: [{ matches: ['https://www.youtube.com/*'], run_at: 'document_start', css: ['content/early.css'], js: ['content/route.js', 'lib/storage.js', 'content/feed-suppress.js', 'content/watch-later-redirect.js', 'content/gate.js'] }],
  web_accessible_resources: [{ resources: ['content/overlay.html', 'content/overlay.css', 'icons/doctor-doom-48.png'], matches: ['https://www.youtube.com/*'] }]
};
for (const [name, target, chrome] of [['Chrome', join(root, 'chrome'), true], ['Safari', join(root, 'safari', 'staged'), false]]) {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(shared, target, { recursive: true });
  writeFileSync(join(target, 'manifest.json'), JSON.stringify({ ...manifest, ...(chrome ? { key } : {}) }, null, 2) + '\n');
  console.log(`${name} package: ${target}`);
}
