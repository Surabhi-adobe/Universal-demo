/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media. Base: columns.
 * Source: https://www.jackson.com/
 * Selector: div.comparison-highlight-layout
 * Model: columns (no field hints). One row: copy cell (heading, paragraph, list, link) | image cell.
 */
export default function parse(element, { document }) {
  const main = element.querySelector('.main-content') || element;
  const secondary = element.querySelector('.secondary-content');

  // Column 1: copy
  const copy = [];
  const heading = main.querySelector('.title h1, .title h2, .title h3, .title h4, h2, h3');
  if (heading) copy.push(heading);
  const description = main.querySelector('.description');
  if (description) {
    Array.from(description.children).forEach((child) => {
      if (child.textContent.trim()) copy.push(child);
    });
  }
  main.querySelectorAll('.small-links a[href]').forEach((a) => {
    a.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const p = document.createElement('p');
    p.appendChild(a);
    copy.push(p);
  });

  // Column 2: image
  const media = [];
  const img = secondary ? secondary.querySelector('img') : null;
  if (img) media.push(img);

  const cells = [[copy, media]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
