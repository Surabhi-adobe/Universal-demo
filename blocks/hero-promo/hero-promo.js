import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero promo: background image row plus a copy row (heading, text, CTA).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // an image-only row (or an empty image row) is the background, the rest is copy
    const hasText = row.textContent.trim() !== '';
    row.classList.add(hasText ? 'hero-promo-content' : 'hero-promo-media');
  });

  block.querySelectorAll('.hero-promo-media picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimized = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  // the CTA is authored as a plain link in its own paragraph
  block.querySelectorAll('.hero-promo-content p').forEach((p) => {
    const link = p.querySelector('a');
    if (link && p.children.length === 1 && p.textContent.trim() === link.textContent.trim()) {
      p.classList.add('hero-promo-cta');
    }
  });

  if (!block.querySelector('.hero-promo-media picture')) block.classList.add('hero-promo-no-image');
}
