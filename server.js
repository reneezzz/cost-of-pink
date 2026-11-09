import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep) || relative.split('/').some(p=>p.startsWith('.'))) {
      res.writeHead(403); res.end(); return;
    }
    const body = await readFile(filename);
    res.writeHead(200, {'Content-Type':types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control':'no-store'});res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
