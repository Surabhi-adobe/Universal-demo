/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-image. Base: cards.
 * Source: https://www.jackson.com/
 * Selector: div.promo-card-wrapper
 * Model: container of cards-image-item (image | text). One row per promo card.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.promo-card-block'));

  const cells = [];

  cards.forEach((card) => {
    const img = card.querySelector('.promo-image img');
    const body = card.querySelector('.card-content') || card;

    // Column 1: card image
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(img);
    }

    // Column 2: title, description, CTA button
    const textNodes = [];
    const title = body.querySelector('.title');
    const titleText = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
    if (titleText) {
      const h = document.createElement('h4');
      h.textContent = titleText;
      textNodes.push(h);
    }
    const description = body.querySelector('.description');
    if (description) {
      Array.from(description.children).forEach((child) => {
        if (child.textContent.trim()) textNodes.push(child);
      });
    }
    body.querySelectorAll('.action a[href]').forEach((a) => {
      const p = document.createElement('p');
      p.appendChild(a);
      textNodes.push(p);
    });

    const textFrag = document.createDocumentFragment();
    if (textNodes.length) {
      textFrag.appendChild(document.createComment(' field:text '));
      textNodes.forEach((node) => textFrag.appendChild(node));
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-image', cells });
  element.replaceWith(block);
}
