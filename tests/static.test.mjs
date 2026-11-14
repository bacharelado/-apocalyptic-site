import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createPreviewServer } from '../tools/preview.mjs';

const files = ['index.html', 'servicos.html', 'metodologia.html', 'sobre.html', 'contato.html', '404.html'];
const documents = await Promise.all(files.map(path => readFile(new URL('../' + path, import.meta.url), 'utf8')));
let server;
let origin;

before(async () => {
  server = await createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

test('todos os documentos têm idioma, título único, descrição, um H1 e destino de salto focável', () => {
  const titles = new Set();
  for (const [index, html] of documents.entries()) {
    assert.match(html, /<html lang="pt-BR"/, files[index]);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, files[index]);
    titles.add(title);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, files[index]);
    assert.match(html, /<meta name="description" content="[^"]{20,}">/);
    assert.match(html, /<main id="conteudo" tabindex="-1">/);
    assert.match(html, /class="skip-link" href="#conteudo"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, files[index]);
  }
  assert.equal(titles.size, files.length);
});

test('a hierarquia de títulos não pula níveis em nenhum HTML', () => {
  for (const [index, html] of documents.entries()) {
    const headings = [...html.matchAll(/<h([1-6])\b/g)].map(m => Number(m[1]));
    for (let i = 1; i < headings.length; i++) {
      assert.ok(headings[i] <= headings[i - 1] + 1, files[index]);
    }
  }
});

test('o cabeçalho tem os mesmos destinos nas seis páginas e a página atual é identificada', () => {
  const signatures = new Set();
  for (const [index, html] of documents.entries()) {
    const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, files[index]);
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(hrefs, ['/', '/servicos', '/metodologia', '/sobre', '/contato']);
    signatures.add(JSON.stringify(hrefs));
    assert.equal((nav.match(/aria-current="page"/g) || []).length, index < 5 ? 1 : 0);
  }
  assert.equal(signatures.size, 1);
});

test('todos os links e recursos locais têm resposta válida e as âncoras existem', async () => {
  for (const [index, html] of documents.entries()) {
    const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m => m[1]);
    for (const href of new Set(urls)) {
      if (href.startsWith('#')) assert.ok(html.includes('id="' + href.slice(1) + '"'), files[index] + href);
      else if (href.startsWith('/')) {
        assert.equal((await fetch(origin + href)).status, 200, files[index] + href);
      }
    }
  }
});

test('os canais comerciais da AP-003 são preservados sem alterar o número informado', () => {
  const html = documents[4];
  const href = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)[1];
  const wa = new URL(href);
  assert.equal(wa.pathname, '/559281660856');
  assert.match(wa.searchParams.get('text'), /avaliação de segurança autorizada/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /\+55 92 8166-0856/);
  assert.match(html, /href="mailto:agstarker@gmail.com\?subject=APOCALYPTIC%20-%20Solicita%C3%A7%C3%A3o%20comercial"/);
});

test('o catálogo e a mensagem principal correspondem às decisões aprovadas', () => {
  assert.match(documents[0], /<h1[^>]*>Conheça suas defesas antes que um adversário as desafie\.<\/h1>/);
  assert.match(documents[1], /<h1[^>]*>Avaliação Ofensiva Externa<\/h1>/);
  assert.match(documents[1], /contratação depende de análise de viabilidade técnica e operacional, escopo definido e autorização formal/);
  for (const html of documents) assert.doesNotMatch(html, /contrate agora|24\/7|clientes atendidos|certificada pela/i);
});

test('não há scripts ou estilos inline, manipuladores de evento ou recursos de terceiros nas páginas', () => {
  for (const html of documents) {
    assert.doesNotMatch(html, /<style\b|\bstyle=|\son[a-z]+=/i);
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1);
    assert.match(scripts[0][1], /src="\/js\/main.js"/);
    assert.equal(scripts[0][2].trim(), '');
    for (const src of html.matchAll(/\bsrc="([^"]+)"/g)) assert.ok(src[1].startsWith('/'));
  }
});

function luminance(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map(x => parseInt(x, 16) / 255);
  const linear = rgb.map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return linear.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(first, second) {
  const [dark, light] = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (light + 0.05) / (dark + 0.05);
}
test('as combinações de texto e foco do tema atingem os contrastes de referência', async () => {
  const css = await readFile(new URL('../css/styles.css', import.meta.url), 'utf8');
  const tokens = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(m => [m[1], m[2]]));
  for (const foreground of ['silver', 'muted', 'accent', 'white']) {
    for (const background of ['bg', 'surface', 'surface-raised']) {
      assert.ok(contrast(tokens[foreground], tokens[background]) >= 4.5, foreground + '/' + background);
    }
  }
  for (const background of ['crimson', 'crimson-hover']) assert.ok(contrast(tokens.white, tokens[background]) >= 4.5);
  for (const background of ['bg', 'surface', 'crimson']) assert.ok(contrast(tokens.focus, tokens[background]) >= 3);
  assert.ok(contrast(tokens['control-line'], tokens.bg) >= 3);
});

test('SVGs A/4 e favicon mantêm o hash original da AP-003', async () => {
  for (const filename of ['logo.svg', 'favicon.svg']) {
    const bytes = await readFile(new URL('../assets/' + filename, import.meta.url));
    const sha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    assert.equal(sha, '790e86c51cdd37d5cc6890511c17ab28475e96b0');
  }
});

test('a prévia local serve 404 real, sitemap e redirecionamentos corretos', async () => {
  const response = await fetch(origin + '/pagina-ausente');
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Página não encontrada/);
  const xml = await fetch(origin + '/sitemap.xml');
  assert.match(xml.headers.get('content-type'), /application\/xml/);
  assert.equal(((await xml.text()).match(/<loc>/g) || []).length, 5);
  const redirect = await fetch(origin + '/index.html', { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/');
  assert.equal((await fetch(origin + '/.git/config')).status, 404);
});

test('os cabeçalhos de segurança são aplicados na prévia sem flexibilizar a CSP original', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('content-security-policy'),
    "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'");
});
