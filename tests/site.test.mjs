import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { createPreviewServer } from '../tools/preview.mjs';

const routes = ['/', '/servicos', '/metodologia', '/sobre', '/contato', '/404-inexistente'];
const normalRoutes = routes.slice(0, 5);
let server;
let browser;
let origin;

before(async () => {
  server = await createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function withPage(options, run) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  try { await run(page, context); }
  finally { await context.close(); }
}

test('a correção AP-003 preserva exatamente os destinatários e a proteção da nova aba', async () => {
  await withPage({}, async page => {
    await page.goto(origin + '/contato');
    const whatsapp = page.getByRole('link', { name: /Conversar pelo WhatsApp/ });
    const url = new URL(await whatsapp.getAttribute('href'));
    assert.equal(url.origin + url.pathname, 'https://wa.me/559281660856');
    assert.match(url.searchParams.get('text'), /avaliação de segurança autorizada/);
    assert.equal(await whatsapp.getAttribute('target'), '_blank');
    const rel = (await whatsapp.getAttribute('rel')).split(/\s+/);
    assert.ok(rel.includes('noopener') && rel.includes('noreferrer'));
    assert.equal(await page.getByRole('link', { name: /Enviar e-mail/ }).getAttribute('href'),
      'mailto:agstarker@gmail.com?subject=APOCALYPTIC%20-%20Solicita%C3%A7%C3%A3o%20comercial');
    assert.equal(await page.locator('form, input').count(), 0);
  });
});

test('a mensagem aprovada e o catálogo conservador são apresentados sem contratação automática', async () => {
  await withPage({}, async page => {
    await page.goto(origin);
    assert.equal(await page.locator('h1').innerText(),
      'Conheça suas defesas antes que um adversário as desafie.');
    assert.equal(await page.locator('#atuacao').count(), 1);
    await page.goto(origin + '/servicos');
    assert.equal(await page.locator('h1').innerText(), 'Avaliação Ofensiva Externa');
    const text = await page.locator('main').innerText();
    assert.match(text, /viabilidade técnica e operacional, escopo definido e autorização formal/);
    assert.doesNotMatch(text, /contrate agora|garantia de segurança|24\/7|clientes atendidos/i);
    assert.equal(await page.getByRole('link', { name: /Solicitar uma conversa/ }).getAttribute('href'), '/contato');
  });
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 340, height: 234 },
]) {
  test('reflow sem perda horizontal nas seis páginas em ' + viewport.width + '×' + viewport.height, async () => {
    await withPage({ viewport }, async page => {
      for (const route of routes) {
        await page.goto(origin + route);
        assert.equal(await page.locator('h1').count(), 1, route);
        const dimensions = await page.evaluate(() => ({
          content: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
        }));
        assert.ok(dimensions.content <= dimensions.viewport + 1,
          route + ': ' + JSON.stringify(dimensions));
        assert.ok(await page.locator('h1').isVisible(), route);
      }
    });
  });
}

for (const route of routes) {
  test('axe WCAG 2.2 AA e boas práticas: ' + route, async () => {
    await withPage({ viewport: { width: 1366, height: 768 } }, async page => {
      await page.goto(origin + route);
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      }));
      assert.deepEqual(result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })), []);
    });
  });
}

test('o menu curto permite alcançar e ver todos os links por teclado e Escape restaura o foco', async () => {
  await withPage({ viewport: { width: 340, height: 234 } }, async page => {
    await page.goto(origin + '/metodologia');
    const button = page.getByRole('button', { name: 'Menu principal', exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    const links = page.locator('.site-nav a');
    for (let index = 0; index < await links.count(); index++) {
      await page.keyboard.press('Tab');
      assert.equal(await links.nth(index).evaluate(el => el === document.activeElement), true);
      const visible = await links.nth(index).evaluate(el => {
        const r = el.getBoundingClientRect();
        const nav = el.closest('nav').getBoundingClientRect();
        return r.top >= nav.top - 1 && r.bottom <= Math.min(nav.bottom, innerHeight) + 1;
      });
      assert.equal(visible, true, 'Link fora da área visível: ' + index);
    }
    await page.keyboard.press('Escape');
    assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(await button.evaluate(el => el === document.activeElement), true);
    assert.equal(await links.first().isVisible(), false);
  });
});

test('Tab pode sair do menu sem aprisionamento de foco e o painel fecha', async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async page => {
    await page.goto(origin);
    const button = page.getByRole('button', { name: 'Menu principal', exact: true });
    await button.focus();
    await page.keyboard.press('Space');
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.querySelector('main').contains(document.activeElement)), true);
  });
});

test('o link de salto entrega o foco ao conteúdo e o próximo Tab alcança uma ação do conteúdo', async () => {
  await withPage({ viewport: { width: 1366, height: 768 } }, async page => {
    await page.goto(origin);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('main').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('main').contains(document.activeElement)), true);
  });
});

test('os destinos internos, identificadores e títulos são consistentes nas seis páginas', async () => {
  await withPage({}, async page => {
    const titles = new Set();
    const headerSignatures = new Set();
    for (const route of routes) {
      await page.goto(origin + route);
      titles.add(await page.title());
      const links = await page.locator('a').evaluateAll(elements => elements.map(a => a.getAttribute('href')));
      for (const href of new Set(links)) {
        if (href.startsWith('#')) {
          assert.equal(await page.locator(href).count(), 1, route + ': ' + href);
        } else if (href.startsWith('/')) {
          assert.equal((await page.request.get(origin + href)).status(), 200, href);
        }
      }
      const headingLevels = await page.locator('main h1, main h2, main h3').evaluateAll(
        elements => elements.map(h => Number(h.tagName.slice(1))));
      for (let i = 1; i < headingLevels.length; i++) {
        assert.ok(headingLevels[i] <= headingLevels[i - 1] + 1, route);
      }
      headerSignatures.add(await page.locator('.site-nav a').evaluateAll(
        elements => JSON.stringify(elements.map(a => [a.getAttribute('href'), a.innerText]))));
      const current = page.locator('.site-nav a[aria-current="page"]');
      assert.equal(await current.count(), normalRoutes.includes(route) ? 1 : 0);
      assert.equal(await page.locator('html').getAttribute('lang'), 'pt-BR');
      assert.ok((await page.locator('meta[name="description"]').getAttribute('content')).length > 20);
    }
    assert.equal(titles.size, routes.length);
    assert.equal(headerSignatures.size, 1);
  });
});

test('o site e todos os links de navegação continuam disponíveis sem JavaScript em 320px', async () => {
  await withPage({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } }, async page => {
    for (const route of routes) {
      await page.goto(origin + route);
      assert.equal(await page.locator('.site-nav a').count(), 5);
      for (const link of await page.locator('.site-nav a').all()) assert.equal(await link.isVisible(), true);
      assert.equal(await page.locator('.menu-toggle').isVisible(), false);
      const d = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1] + 1, route);
      await page.locator('.site-nav a[href="/contato"]').click();
      await page.waitForURL(origin + '/contato');
    }
  });
});

test('preferência por movimento reduzido elimina animações, transições e rolagem suave', async () => {
  await withPage({ reducedMotion: 'reduce' }, async page => {
    await page.goto(origin);
    const values = await page.evaluate(() => ({
      behavior: getComputedStyle(document.documentElement).scrollBehavior,
      moving: [...document.querySelectorAll('body *')].filter(el => {
        const s = getComputedStyle(el);
        return s.animationName !== 'none' || s.transitionDuration.split(',').some(d => parseFloat(d) > 0);
      }).length,
    }));
    assert.equal(values.behavior, 'auto');
    assert.equal(values.moving, 0);
  });
});

test('o menu sincroniza corretamente as mudanças entre celular e computador', async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async page => {
    await page.goto(origin);
    const button = page.getByRole('button', { name: 'Menu principal', exact: true });
    await button.click();
    await page.setViewportSize({ width: 1366, height: 768 });
    // A mudança de media query é entregue de forma assíncrona pelo navegador.
    // Esperar o estado observável evita coalescer duas mudanças na mesma frame.
    await page.waitForFunction(() =>
      document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false');
    assert.equal(await page.locator('.site-nav').isVisible(), true);
    assert.equal(await page.locator('.menu-toggle').isVisible(), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() =>
      getComputedStyle(document.querySelector('.site-nav')).display === 'none');
    assert.equal(await button.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('.site-nav').isVisible(), false);
  });
});

test('o menu aberto em celular também não apresenta violações automáticas de acessibilidade', async () => {
  await withPage({ viewport: { width: 390, height: 844 } }, async page => {
    await page.goto(origin);
    await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
    await page.evaluate(axe.source);
    const result = await page.evaluate(async () => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    }));
    assert.deepEqual(result.violations.map(v => v.id), []);
  });
});

test('a FAQ nativa abre e fecha com teclado sem depender do script do menu', async () => {
  await withPage({ javaScriptEnabled: false }, async page => {
    await page.goto(origin + '/servicos');
    const first = page.locator('details').first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await first.getAttribute('open'), '');
    assert.equal(await first.locator('p').isVisible(), true);
    await page.keyboard.press('Space');
    assert.equal(await first.getAttribute('open'), null);
  });
});

test('404 real, sitemap XML, redirecionamento e cabeçalhos originais são servidos localmente', async () => {
  const missing = await fetch(origin + '/pagina-ausente');
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Página não encontrada/);
  const sitemap = await fetch(origin + '/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type'), /xml/);
  const xml = await sitemap.text();
  assert.equal((xml.match(/<loc>/g) || []).length, 5);
  for (const route of normalRoutes) assert.ok(xml.includes('https://apocalyptic.pages.dev' + route));
  const redirect = await fetch(origin + '/servicos.html', { redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), '/servicos');
  const home = await fetch(origin);
  assert.equal(home.headers.get('x-frame-options'), 'DENY');
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('content-security-policy'),
    "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'");
});

test('nenhum erro da página, recurso quebrado ou violação de CSP ocorre na navegação local', async () => {
  await withPage({}, async page => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(request.url() + ': ' + request.failure().errorText));
    for (const route of normalRoutes) {
      const response = await page.goto(origin + route);
      assert.equal(response.status(), 200);
      const invalidImages = await page.locator('img').evaluateAll(imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).length);
      assert.equal(invalidImages, 0);
    }
    assert.deepEqual(errors, []);
  });
});

test('os SVGs A/4 são os mesmos da base AP-003', async () => {
  for (const path of ['assets/logo.svg', 'assets/favicon.svg']) {
    const bytes = await readFile(new URL('../' + path, import.meta.url));
    const hash = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    assert.equal(hash, '790e86c51cdd37d5cc6890511c17ab28475e96b0');
  }
});
