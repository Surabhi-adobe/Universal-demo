/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-promo. Base: hero.
 * Source: https://www.jackson.com/
 * Selector: div.background-container div.contents:has(> div.spotlight)
 * Model: hero-promo (image | text). Row 1: background image, row 2: heading, text, CTA.
 */
export default function parse(element, { document }) {
  const img = element.querySelector(':scope > img') || element.querySelector('img');
  const wrapper = element.querySelector('.spotlight-wrapper') || element.querySelector('.spotlight') || element;

  const cells = [];

  // Row 1: background image
  const imageFrag = document.createDocumentFragment();
  if (img) {
    imageFrag.appendChild(document.createComment(' field:image '));
    imageFrag.appendChild(img);
  }
  cells.push([imageFrag]);

  // Row 2: heading, paragraph(s), CTA
  const textNodes = [];
  const heading = wrapper.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading && heading.textContent.trim()) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    textNodes.push(h);
  }
  wrapper.querySelectorAll('.header > p').forEach((p) => {
    if (p.textContent.trim()) textNodes.push(p);
  });
  wrapper.querySelectorAll('.action a[href]').forEach((a) => {
    const p = document.createElement('p');
    p.appendChild(a);
    textNodes.push(p);
  });

  const textFrag = document.createDocumentFragment();
  if (textNodes.length) {
    textFrag.appendChild(document.createComment(' field:text '));
    textNodes.forEach((node) => textFrag.appendChild(node));
  }
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo', cells });
  element.replaceWith(block);
}
