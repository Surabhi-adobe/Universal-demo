/**
 * Fetches the footer fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchFooter() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  let url = '/content/footer.plain.html';
  if (!resp.ok) {
    resp = await fetch('/footer.plain.html');
    url = '/footer.plain.html';
  }
  if (!resp.ok) return null;
  return { html: await resp.text(), url: new URL(url, window.location.href).href };
}

/** Resolves relative image paths against the fragment URL so they work on every page. */
function fixImagePaths(root, baseUrl) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, baseUrl).href;
    img.loading = 'lazy';
  });
}

/** Opens links to other hosts in a new tab. */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    try {
      const url = new URL(a.href);
      if (/^https?:$/.test(url.protocol) && url.hostname !== window.location.hostname) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    } catch { /* ignore */ }
  });
}

/** Groups each heading with the list that follows it into a column. */
function buildColumns(section) {
  const wrap = document.createElement('div');
  wrap.className = 'footer-columns';
  let column = null;
  [...section.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-column';
      wrap.append(column);
    }
    if (/^H[1-6]$/.test(el.tagName)) el.classList.add('footer-column-title');
    if (el.tagName === 'UL') el.classList.add('footer-column-links');
    column.append(el);
  });
  section.textContent = '';
  section.append(wrap);
}

/** Turns icon images into colourable icons (CSS mask), keeping the alt text as the label. */
function buildSocial(list) {
  list.classList.add('footer-social');
  list.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (!img) return;
    a.setAttribute('aria-label', img.alt);
    const icon = document.createElement('span');
    icon.className = 'footer-social-icon';
    icon.style.setProperty('--icon', `url("${img.src}")`);
    icon.setAttribute('aria-hidden', 'true');
    img.replaceWith(icon);
  });
}

/** Copyright text, legal links and social icons. */
function buildLegalRow(section) {
  const copyright = section.querySelector(':scope > p');
  copyright?.classList.add('footer-copyright');
  const lists = [...section.querySelectorAll(':scope > ul')];
  lists.forEach((ul) => {
    if (ul.querySelector('img')) buildSocial(ul);
    else ul.classList.add('footer-legal');
  });
  const left = document.createElement('div');
  left.className = 'footer-legal-group';
  [copyright, ...lists.filter((ul) => ul.classList.contains('footer-legal'))]
    .filter(Boolean)
    .forEach((el) => left.append(el));
  section.prepend(left);
}

/** Disclosures: badge image, boxed notice, paragraphs. */
function buildDisclosures(section) {
  section.querySelectorAll(':scope > p').forEach((p) => {
    if (p.querySelector('img')) p.classList.add('footer-badge');
    else if (p.children.length === 1 && p.firstElementChild.tagName === 'STRONG'
      && p.textContent.trim() === p.firstElementChild.textContent.trim()) p.classList.add('footer-notice');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = fragment.html;
  fixImagePaths(tmp, fragment.url);
  decorateExternalLinks(tmp);

  const [sitemap, legal, disclosures] = [...tmp.children];
  const main = document.createElement('div');
  main.className = 'footer-main';
  if (sitemap) {
    sitemap.className = 'footer-sitemap';
    buildColumns(sitemap);
    main.append(sitemap);
  }
  if (legal) {
    legal.className = 'footer-bottom';
    buildLegalRow(legal);
    main.append(legal);
  }

  block.textContent = '';
  block.append(main);
  if (disclosures) {
    disclosures.className = 'footer-disclosures';
    buildDisclosures(disclosures);
    block.append(disclosures);
  }
}
