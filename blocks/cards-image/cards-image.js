import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Cards image: each row is a card with a top image cell and a text cell
 * (title, description, CTA button).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      const isImage = div.querySelector('picture') && div.textContent.trim() === '';
      div.className = isImage ? 'cards-image-card-image' : 'cards-image-card-body';
    });
    // the paragraph holding only a link is the card CTA (pinned to the panel bottom)
    li.querySelectorAll('.cards-image-card-body p').forEach((p) => {
      const a = p.querySelector('a[href]');
      if (a && p.textContent.trim() === a.textContent.trim()) p.classList.add('cards-image-card-cta');
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
