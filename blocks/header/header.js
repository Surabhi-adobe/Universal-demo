// desktop layout starts at 1200px, matching the source site
const isDesktop = window.matchMedia('(width >= 1200px)');

const SECTION_NAMES = ['selector', 'brand', 'sections', 'tools', 'contact'];

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<{html: string, url: string}|null>}
 */
async function fetchNav() {
  // metadata-independent: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  let url = '/content/nav.plain.html';
  if (!resp.ok) {
    resp = await fetch('/nav.plain.html');
    url = '/nav.plain.html';
  }
  if (!resp.ok) return null;
  return { html: await resp.text(), url: new URL(url, window.location.href).href };
}

/** Resolves relative image paths against the fragment URL so they work on every page. */
function fixImagePaths(root, baseUrl) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:|data:|\/)/.test(src)) img.src = new URL(src, baseUrl).href;
    img.loading = 'eager';
  });
}

/** First text (or image alt) of a list item, ignoring nested lists. */
function itemLabel(li) {
  const text = [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .join(' ')
    .trim();
  return text || li.querySelector(':scope > img')?.alt || '';
}

function closeAll(nav, except) {
  nav.querySelectorAll('[aria-expanded="true"][data-panel]').forEach((btn) => {
    if (btn === except) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.closest('.nav-item, .nav-tool')?.classList.remove('is-open');
  });
  nav.classList.remove('nav-drilled');
}

/** Marks the nav as drilled into a section (mobile slide-in sub panel). */
function updateDrill(nav) {
  nav.classList.toggle('nav-drilled', !!nav.querySelector('.nav-item.is-open:not(.nav-item-icon)'));
}

function togglePanel(nav, btn, force) {
  const open = force ?? btn.getAttribute('aria-expanded') !== 'true';
  closeAll(nav, btn);
  btn.setAttribute('aria-expanded', String(open));
  btn.closest('.nav-item, .nav-tool')?.classList.toggle('is-open', open);
  updateDrill(nav);
  if (open) {
    const panel = nav.querySelector(`#${btn.dataset.panel}`);
    panel?.querySelector('input')?.focus();
  }
}

/** Builds dropdown triggers and panels from the nested lists of the sections section. */
function buildSections(section, nav) {
  const list = section.querySelector(':scope > ul');
  if (!list) return;
  list.classList.add('nav-list');
  [...list.children].forEach((li, i) => {
    const sub = li.querySelector(':scope > ul');
    li.classList.add('nav-item');
    if (!sub) return;
    const label = itemLabel(li);
    const icon = li.querySelector(':scope > img');
    const id = `nav-panel-${i}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-trigger';
    btn.dataset.panel = id;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    if (icon) {
      li.classList.add('nav-item-icon');
      btn.setAttribute('aria-label', icon.alt || label);
      btn.append(icon);
    } else {
      btn.textContent = label;
    }
    const panel = document.createElement('div');
    panel.className = 'nav-panel';
    panel.id = id;
    sub.classList.add('nav-panel-list');
    panel.append(sub);
    li.textContent = '';
    li.append(btn, panel);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(nav, btn);
    });
  });
}

/** Builds the search toggle + panel and the sign-in button from the tools section. */
function buildTools(section, nav) {
  const paras = [...section.querySelectorAll(':scope > p')];
  const searchP = paras.find((p) => p.querySelector('img') && !p.querySelector('strong'));
  const signIn = section.querySelector('strong > a, a > strong')?.closest('a');

  const tools = document.createElement('ul');
  tools.className = 'nav-tools-list';

  if (searchP) {
    const icon = searchP.querySelector('img');
    const link = searchP.querySelector('a');
    const searchUrl = link?.href || 'https://www.jackson.com/search.html';
    const labelText = searchP.textContent.trim() || 'Search';
    const li = document.createElement('li');
    li.className = 'nav-tool nav-tool-search';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-trigger';
    btn.dataset.panel = 'nav-panel-search';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'nav-panel-search');
    btn.setAttribute('aria-label', icon?.alt || labelText);
    if (icon) btn.append(icon);

    const panel = document.createElement('div');
    panel.className = 'nav-panel nav-search-panel';
    panel.id = 'nav-panel-search';
    const form = document.createElement('form');
    form.setAttribute('role', 'search');
    form.className = 'nav-search-form';
    const field = document.createElement('div');
    field.className = 'nav-search-field';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'nav-search-input';
    input.name = 'q';
    input.autocomplete = 'off';
    input.placeholder = ' ';
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = labelText;
    field.append(input, label);
    form.append(field);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) window.location.href = `${searchUrl}#?cludoquery=${encodeURIComponent(q)}&cludopage=1`;
    });
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nav-search-close';
    close.setAttribute('aria-label', 'Close search');
    close.addEventListener('click', () => togglePanel(nav, btn, false));
    panel.append(form, close);
    li.append(btn, panel);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(nav, btn);
    });
    tools.append(li);
  }

  if (signIn) {
    const li = document.createElement('li');
    li.className = 'nav-tool nav-tool-cta';
    signIn.className = 'nav-cta';
    signIn.textContent = signIn.textContent.trim();
    li.append(signIn);
    tools.append(li);
  }

  section.textContent = '';
  section.append(tools);
}

/** Groups the contact row and fills share links with the current page URL. */
function buildContact(section) {
  const [text, phone, share] = section.querySelectorAll(':scope > p');
  text?.classList.add('nav-contact-text');
  phone?.classList.add('nav-contact-phone');
  share?.classList.add('nav-contact-share');
  const social = section.querySelector(':scope > ul');
  if (social) {
    social.classList.add('nav-social');
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    social.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href.startsWith('mailto:')) a.href = `mailto:?subject=${title}&body=${pageUrl}`;
      else if (href.endsWith('=')) a.href = `${href}${pageUrl}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', a.querySelector('img')?.alt || 'Share');
    });
  }
  if (phone || share) {
    const divider = document.createElement('span');
    divider.className = 'nav-contact-divider';
    divider.setAttribute('aria-hidden', 'true');
    phone?.after(divider);
  }
}

/** Mobile/tablet hamburger that opens the whole menu below the bar. */
function buildHamburger(nav) {
  const wrap = document.createElement('div');
  wrap.className = 'nav-hamburger';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-controls', 'nav');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open navigation');
  btn.innerHTML = '<span class="nav-hamburger-icon"></span><span class="nav-hamburger-label">Menu</span>';
  btn.addEventListener('click', () => {
    const open = !nav.classList.contains('nav-open');
    closeAll(nav);
    nav.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  });
  wrap.append(btn);
  return wrap;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = fragment.html;
  fixImagePaths(tmp, fragment.url);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  const sections = {};
  [...tmp.children].forEach((section, i) => {
    const name = SECTION_NAMES[i] || `extra-${i}`;
    section.className = `nav-${name}`;
    sections[name] = section;
  });

  if (sections.selector) sections.selector.querySelector('ul')?.classList.add('nav-selector-list');
  if (sections.sections) buildSections(sections.sections, nav);
  if (sections.tools) buildTools(sections.tools, nav);
  if (sections.contact) buildContact(sections.contact);

  // bar order: brand, hamburger (below desktop), sections, tools
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  [sections.brand, buildHamburger(nav), sections.sections, sections.tools]
    .filter(Boolean)
    .forEach((s) => bar.append(s));

  [sections.selector, bar, sections.contact].filter(Boolean).forEach((s) => nav.append(s));

  // close panels on outside click and Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) || !e.target.closest('.nav-panel')) {
      if (!e.target.closest('.nav-trigger')) closeAll(nav);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-trigger[aria-expanded="true"]');
    if (open) {
      closeAll(nav);
      open.focus();
    }
  });

  // reset menus when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    nav.classList.remove('nav-open');
    const ham = nav.querySelector('.nav-hamburger button');
    ham?.setAttribute('aria-expanded', 'false');
    ham?.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
  });

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
