/* eslint-disable */
/* global WebImporter */

/**
 * Jackson (www.jackson.com) cleanup transformer.
 * Removes non-authorable site chrome, consent/feedback widgets, tracking
 * artifacts and duplicated responsive markup.
 */
function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

/**
 * Spotlight bands set their photo as a CSS background in an inline <style> rule keyed by a
 * generated class (".bg-image-<uuid> { background-image: url(...) }"). Turn each into a real
 * <img> as the band's first child before <style> elements are removed, so parsers can author it.
 */
function backgroundsToImages(root) {
  const doc = root.ownerDocument;
  const urls = {};
  root.querySelectorAll('style').forEach((style) => {
    const re = /\.(bg-image-[\w-]+)[^{]*\{[^}]*background(?:-image)?\s*:[^;}]*url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    let m = re.exec(style.textContent);
    while (m) {
      if (!urls[m[1]]) urls[m[1]] = m[2];
      m = re.exec(style.textContent);
    }
  });
  root.querySelectorAll('[class*="bg-image-"]').forEach((el) => {
    if (el.querySelector(':scope > img')) return;
    const cls = [...el.classList].find((c) => c.startsWith('bg-image-'));
    let url = cls && urls[cls];
    if (!url) {
      try {
        const bg = doc.defaultView.getComputedStyle(el).backgroundImage || '';
        const m = bg.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
        if (m) [, url] = m;
      } catch (e) {
        // computed styles unavailable in this environment
      }
    }
    if (!url) return;
    const img = doc.createElement('img');
    img.src = url;
    img.alt = '';
    el.prepend(img);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    backgroundsToImages(element.ownerDocument.documentElement || element);

    // Global header: masthead lives in its own experience fragment grid column
    element.querySelectorAll('div.masthead').forEach((masthead) => {
      const xf = masthead.closest('div.experiencefragment');
      (xf || masthead).remove();
    });

    // Global footer: also wrapped in an experience fragment grid column
    element.querySelectorAll('footer.global-footer-wrapper').forEach((footer) => {
      const xf = footer.closest('div.experiencefragment');
      const col = footer.closest('div.global-footer');
      (xf || col || footer).remove();
    });

    removeAll(element, [
      // header / footer fallbacks
      'div.masthead__primary.l-grid',
      'div.global-footer',
      'footer.global-footer-wrapper',
      'div.fragment-navigation',
      // welcome / profile toggle
      'div.toggle-container',
      'div.toggle-container__wrapper',
      // session timeout panel and its mask
      'div.session-timeout-panel',
      '#background-mask',
      // OneTrust cookie consent
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      // Qualtrics feedback widget
      '[id^="ZN_"]',
      'div.QSIFeedbackButton',
      // tracking pixels / sync iframes
      '[id^="batBeacon"]',
      'img[src*="bat.bing.com"]',
      'iframe',
      // non-content
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // Hero tabs: each panel has a desktop "wide" and mobile "narrow" copy of
    // the same content. Keep only the narrow copy so content is not duplicated.
    element.querySelectorAll('div.hero-space div.tab-content').forEach((panel) => {
      if (panel.querySelector(':scope > div.narrow')) {
        panel.querySelectorAll(':scope > div.wide').forEach((wide) => wide.remove());
      }
    });
  }

  if (hookName === 'afterTransform') {
    // Removed here (not before) because section selectors rely on
    // div:nth-of-type() positions that include this empty sibling.
    removeAll(element, [
      'div.promo-area',
      'div.accessibility-helper',
      'div.toggle-container',
      'div.session-timeout-panel',
      '#onetrust-consent-sdk',
      'iframe',
      'script',
      'noscript',
      'link',
    ]);

    // Strip tracking / framework attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (
          n.startsWith('data-track')
          || n.startsWith('data-analytics')
          || n.startsWith('data-cmp')
          || n === 'onclick'
          || n === 'data-sly-test'
        ) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
