/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-hero. Base: tabs.
 * Source: https://www.jackson.com/
 * Selector: div.hero-space.v3
 * Model: container of tabs-hero-item (title | content_heading, content_image, content_richtext).
 *
 * The cleanup transformer removes each panel's desktop "div.wide" copy, so tab
 * content is read from "div.narrow". Tab labels come from the tablist <li>
 * items and are paired with panels by document order. The shared background
 * image (div.background img) is placed in the first tab only.
 */
export default function parse(element, { document }) {
  const panels = Array.from(element.querySelectorAll('div.tab-content'));
  const labels = Array.from(element.querySelectorAll('div.tab-container ul > li'));
  const bgImg = element.querySelector('div.background img');

  const cells = [];

  panels.forEach((panel, i) => {
    const content = panel.querySelector(':scope > div.narrow .tab-content-wrappper')
      || panel.querySelector(':scope > div.narrow')
      || panel.querySelector('.tab-content-wrappper')
      || panel;

    // Column 1: tab title (plain text field)
    const titleFrag = document.createDocumentFragment();
    const label = labels[i];
    const labelText = label ? label.textContent.replace(/\s+/g, ' ').trim() : '';
    if (labelText) {
      titleFrag.appendChild(document.createComment(' field:title '));
      titleFrag.appendChild(document.createTextNode(labelText));
    }

    // Column 2: content_heading, content_image, content_richtext (shared "content_" prefix)
    const contentFrag = document.createDocumentFragment();

    const headline = content.querySelector('.headline');
    if (headline) {
      const inner = headline.querySelector('h1, h2, h3, h4, h5, h6');
      const level = inner ? inner.tagName.toLowerCase() : headline.tagName.toLowerCase();
      const text = (inner || headline).textContent.replace(/\s+/g, ' ').trim();
      if (text) {
        const h = document.createElement(/^h[1-6]$/.test(level) ? level : 'h2');
        h.textContent = text;
        contentFrag.appendChild(document.createComment(' field:content_heading '));
        contentFrag.appendChild(h);
      }
    }

    if (i === 0 && bgImg) {
      contentFrag.appendChild(document.createComment(' field:content_image '));
      contentFrag.appendChild(bgImg);
    }

    const richNodes = [];
    const description = content.querySelector('.description');
    if (description) {
      Array.from(description.children).forEach((child) => {
        if (child.textContent.trim()) richNodes.push(child);
      });
    }
    content.querySelectorAll('.action a[href]').forEach((a) => {
      const p = document.createElement('p');
      p.appendChild(a);
      richNodes.push(p);
    });
    if (richNodes.length) {
      contentFrag.appendChild(document.createComment(' field:content_richtext '));
      richNodes.forEach((node) => contentFrag.appendChild(node));
    }

    cells.push([titleFrag, contentFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-hero', cells });
  element.replaceWith(block);
}
