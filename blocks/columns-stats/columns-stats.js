/**
 * Columns stats: intro copy with CTAs beside a stack of statistic figures.
 * Stat values are authored as bold paragraphs followed by a label paragraph.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const firstRow = block.firstElementChild;
  if (!firstRow) return;
  block.classList.add(`columns-stats-${firstRow.children.length}-cols`);

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    cols.forEach((col, i) => {
      const isStats = cols.length > 1 && i === cols.length - 1;
      col.classList.add(isStats ? 'columns-stats-figures' : 'columns-stats-copy');
    });

    // CTA paragraphs (a lone link): first is primary, the rest secondary
    row.querySelectorAll('.columns-stats-copy').forEach((col) => {
      const ctas = [...col.children].filter((el) => {
        const a = el.tagName === 'P' && el.querySelector(':scope > a[href]');
        return a && el.children.length === 1 && el.textContent.trim() === a.textContent.trim();
      });
      if (!ctas.length) return;
      const actions = document.createElement('div');
      actions.className = 'columns-stats-actions';
      ctas[0].before(actions);
      ctas.forEach((p, idx) => {
        const a = p.querySelector('a');
        p.className = 'button-wrapper';
        a.classList.add('button', idx === 0 ? 'primary' : 'secondary');
        actions.append(p);
      });
    });

    // group each bold figure with the label that follows it
    row.querySelectorAll('.columns-stats-figures').forEach((col) => {
      const children = [...col.children];
      let current = null;
      children.forEach((el) => {
        const isFigure = el.tagName === 'P'
          && el.firstElementChild
          && ['STRONG', 'B'].includes(el.firstElementChild.tagName)
          && el.textContent.trim() === el.firstElementChild.textContent.trim();
        if (isFigure) {
          current = document.createElement('div');
          current.className = 'columns-stats-item';
          el.classList.add('columns-stats-value');
          el.before(current);
          current.append(el);
        } else if (current) {
          el.classList.add('columns-stats-label');
          current.append(el);
        }
      });
    });
  });
}
