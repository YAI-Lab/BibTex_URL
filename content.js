// content.js - 注入到 Google Scholar 页面

function addBibtexLinks() {
  const papers = document.querySelectorAll('.gs_ri');

  papers.forEach(paper => {
    if (paper.dataset.bibtexUrlAdded) return;
    paper.dataset.bibtexUrlAdded = 'true';

    // 找到原有的 Import into BibTeX 链接
    const importLink = paper.querySelector('a[href*="scholar.bib"]');
    if (!importLink) return;

    // 获取论文标题链接
    const titleEl = paper.querySelector('.gs_rt a');
    const paperUrl = titleEl ? titleEl.href : '';

    // 创建新链接 - 红色
    const newLink = document.createElement('a');
    newLink.href = 'javascript:void(0)';
    newLink.textContent = 'Import into BibTeX with URL';
    newLink.style.marginLeft = '10px';
    newLink.style.color = '#d93025';  // 红色
    newLink.style.cursor = 'pointer';

    newLink.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        // 通过 background script 获取完整的 BibTeX
        const response = await chrome.runtime.sendMessage({
          action: 'fetchBibtex',
          url: importLink.href
        });

        let bibtex = '';
        if (response && response.success) {
          bibtex = response.data.trim();
        } else {
          // fallback: 手动生成
          const title = titleEl ? titleEl.textContent.replace(/\[.*?\]/g, '').trim() : '';
          const authorEl = paper.querySelector('.gs_a');
          const authorText = authorEl ? authorEl.textContent : '';
          const author = authorText.split('-')[0].trim();
          const yearMatch = paper.textContent.match(/\b(19|20)\d{2}\b/);
          const year = yearMatch ? yearMatch[0] : '';
          const firstAuthor = author.split(',')[0].split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
          const citeKey = (firstAuthor || 'x') + year;

          bibtex = `@article{${citeKey},\n  title={${title}},\n  author={${author}},\n  year={${year}}\n}`;
        }

        // 添加 URL
        if (paperUrl && !paperUrl.includes('scholar.google') && bibtex) {
          if (!bibtex.includes('url') && !bibtex.includes('doi')) {
            bibtex = bibtex.replace(/\n\}$/, `,\n  url={${paperUrl}}\n}`);
          }
        }

        // 复制
        await navigator.clipboard.writeText(bibtex);

        // 显示绿色 ✅ 提示
        const msg = document.createElement('span');
        msg.textContent = '✅';
        msg.style.marginLeft = '5px';
        msg.style.fontSize = '14px';

        const prevMsg = paper.querySelector('.bibtex-copied-msg');
        if (prevMsg) prevMsg.remove();

        newLink.parentNode.insertBefore(msg, newLink.nextSibling);
        msg.className = 'bibtex-copied-msg';
        setTimeout(() => msg.remove(), 3000);

      } catch (err) {
        console.error('Copy failed:', err);
      }
    });

    importLink.parentNode.insertBefore(newLink, importLink.nextSibling);
  });
}

// 监听页面变化
const observer = new MutationObserver(() => {
  addBibtexLinks();
});

observer.observe(document.body, { childList: true, subtree: true });

addBibtexLinks();
