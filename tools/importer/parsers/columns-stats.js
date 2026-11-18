/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-stats. Base: columns.
 * Source: https://www.jackson.com/
 * Selector: div.stat-spotlight
 * Model: columns (no field hints). One row: copy cell (heading, paragraph, CTA links) |
 * stats cell (each stat a bold value paragraph followed by a label paragraph).
 */
export default function parse(element, { document }) {
  const intro = element.querySelector('.stat-spotlight-content') || element;
  const stats = element.querySelector('.stats-container');

  // Column 1: copy
  const copy = [];
  const heading = intro.querySelector('h1, h2, h3');
  if (heading && heading.textContent.trim()) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    copy.push(h);
  }
  const description = intro.querySelector('.description');
  if (description) {
    Array.from(description.children).forEach((child) => {
      if (child.textContent.trim()) copy.push(child);
    });
  }
  intro.querySelectorAll('.action a[href]').forEach((a) => {
    const p = document.createElement('p');
    p.appendChild(a);
    copy.push(p);
  });

  // Column 2: stat figures (bold paragraph) + labels (paragraph), paired by order
  const figures = [];
  if (stats) {
    const headers = Array.from(stats.querySelectorAll('.stat-header'));
    const labels = Array.from(stats.querySelectorAll('.stat-description'));
    headers.forEach((header, i) => {
      const value = header.textContent.replace(/\s+/g, ' ').trim();
      if (value) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = value;
        p.appendChild(strong);
        figures.push(p);
      }
      const label = labels[i];
      if (label && label.textContent.trim()) {
        const p = document.createElement('p');
        const src = label.querySelector('p') || label;
        const inner = src.querySelector(':scope > span') || src;
        Array.from(inner.childNodes).forEach((n) => p.appendChild(n));
        figures.push(p);
      }
    });
  }

  const cells = [[copy, figures]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stats', cells });
  element.replaceWith(block);
}
