/* eslint-disable */
/* global WebImporter */

import tabsHeroParser from './parsers/tabs-hero.js';
import heroPromoParser from './parsers/hero-promo.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsIconParser from './parsers/cards-icon.js';
import columnsStatsParser from './parsers/columns-stats.js';
import cardsImageParser from './parsers/cards-image.js';
import cleanupTransformer from './transformers/jackson-cleanup.js';
import sectionsTransformer from './transformers/jackson-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.jackson.com/"
  ],
  "representativeUrl": "https://www.jackson.com/",
  "description": "Jackson homepage: tabbed hero, promo, media columns, icon cards, stats, image cards and disclosures",
  "blocks": [
    {
      "name": "tabs-hero",
      "instances": [
        "div.hero-space.v3"
      ]
    },
    {
      "name": "hero-promo",
      "instances": [
        "div.background-container div.contents:has(> div.spotlight)"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        "div.comparison-highlight-layout"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "div.cta-icon-card-wrapper"
      ]
    },
    {
      "name": "columns-stats",
      "instances": [
        "div.stat-spotlight"
      ]
    },
    {
      "name": "cards-image",
      "instances": [
        "div.promo-card-wrapper"
      ]
    }
  ],
  "urlPattern": "/",
  "sections": [
    {
      "id": "section-1",
      "name": "Tabbed hero",
      "selector": [
        "section > div.content-wrapper > div.hero-space.v3"
      ],
      "style": null,
      "blocks": [
        "tabs-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Financial professionals promo",
      "selector": [
        "section > div.content-wrapper > div.background-container:has(div.spotlight)",
        "section > div.content-wrapper > div.background-container:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "hero-promo"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Annuity goals",
      "selector": [
        "section > div.content-wrapper > div.background-container:has(div.comparison-highlight-layout)",
        "section > div.content-wrapper > div.background-container:nth-of-type(4)"
      ],
      "style": "light-beige",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "section-4",
      "name": "Annuity disclosure",
      "selector": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(5)"
      ],
      "style": "disclosure",
      "blocks": [],
      "defaultContent": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(5) div.content-area > *"
      ]
    },
    {
      "id": "section-5",
      "name": "Retirement planning resources",
      "selector": [
        "section > div.content-wrapper > div.layout-container:has(div.cta-icon-card-wrapper)",
        "section > div.content-wrapper > div.layout-container:nth-of-type(6)"
      ],
      "style": "centered",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "section > div.content-wrapper > div.layout-container:has(div.cta-icon-card-wrapper) div.content-area > h3"
      ]
    },
    {
      "id": "section-6",
      "name": "The Jackson difference",
      "selector": [
        "section > div.content-wrapper > div.background-container:has(div.stat-spotlight)",
        "section > div.content-wrapper > div.background-container:nth-of-type(7)"
      ],
      "style": "light-grey",
      "blocks": [
        "columns-stats"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Additional resources",
      "selector": [
        "section > div.content-wrapper > div.layout-container:has(div.promo-card-wrapper)",
        "section > div.content-wrapper > div.layout-container:nth-of-type(8)"
      ],
      "style": "centered",
      "blocks": [
        "cards-image"
      ],
      "defaultContent": [
        "section > div.content-wrapper > div.layout-container:has(div.promo-card-wrapper) div.content-area > h3"
      ]
    },
    {
      "id": "section-8",
      "name": "Footnotes",
      "selector": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(9)"
      ],
      "style": "disclosure",
      "blocks": [],
      "defaultContent": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(9) div.content-area > *"
      ]
    },
    {
      "id": "section-9",
      "name": "Investor disclosures",
      "selector": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(10)"
      ],
      "style": "disclosure, separator",
      "blocks": [],
      "defaultContent": [
        "section > div.content-wrapper > div.disclosure:nth-of-type(10) div.content-area > *"
      ]
    }
  ]
};

const parsers = {
  'tabs-hero': tabsHeroParser,
  'hero-promo': heroPromoParser,
  'columns-media': columnsMediaParser,
  'cards-icon': cardsIconParser,
  'columns-stats': columnsStatsParser,
  'cards-image': cardsImageParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
