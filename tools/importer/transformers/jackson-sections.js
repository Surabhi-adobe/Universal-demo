/* eslint-disable */
/* global WebImporter */

/**
 * Jackson section transformer.
 * beforeTransform: inserts <hr> section breaks (and markers for styled sections)
 * while the original section elements still exist.
 * afterTransform: appends Section Metadata blocks for styled sections.
 */
const MARKER_ATTR = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this environment; try the next one
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    // Resolve all elements first so inserted <hr>s cannot shift nth-of-type matches
    const resolved = sections.map((section) => findSectionElement(element, section));

    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = resolved[i];
      if (!el) continue;
      const isFirst = i === 0;
      if (isFirst && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      if (isFirst) hr.setAttribute('data-excat-first-section', 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);

      if (section.style) {
        // Find the end of this section: the next <hr> after the marker, or end of parent
        let anchor = null;
        if (marker) {
          let node = marker.nextElementSibling;
          while (node && node.tagName !== 'HR') {
            anchor = node;
            node = node.nextElementSibling;
          }
        } else {
          anchor = findSectionElement(element, section);
        }

        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        if (anchor && anchor.parentNode) {
          anchor.after(meta);
        } else if (marker && marker.parentNode) {
          marker.after(meta);
        }
      }

      if (marker) {
        if (marker.hasAttribute('data-excat-first-section')) {
          marker.remove();
        } else {
          marker.removeAttribute(MARKER_ATTR);
        }
      }
    }
  }
}
