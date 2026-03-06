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

    // 创建 Copy BibTeX 链接（不带 URL）
    const copyLink = document.createElement('a');
    copyLink.href = 'javascript:void(0)';
    copyLink.textContent = 'Copy BibTeX';
    copyLink.style.marginLeft = '10px';
    copyLink.style.color = '#d93025';
    copyLink.style.cursor = 'pointer';

    copyLink.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        // 获取原始 BibTeX
        const response = await chrome.runtime.sendMessage({
          action: 'fetchBibtex',
          url: importLink.href
        });

        let bibtex = '';
        if (response && response.success) {
          bibtex = response.data.trim();
        }

        if (!bibtex) {
          bibtex = 'Failed to get BibTeX';
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

        copyLink.parentNode.insertBefore(msg, copyLink.nextSibling);
        msg.className = 'bibtex-copied-msg';
        setTimeout(() => msg.remove(), 3000);

      } catch (err) {
        console.error('Copy failed:', err);
      }
    });

    // 创建 Copy BibTeX with URL 链接（带 URL）
    const copyWithUrlLink = document.createElement('a');
    copyWithUrlLink.href = 'javascript:void(0)';
    copyWithUrlLink.textContent = 'Copy BibTeX with URL';
    copyWithUrlLink.style.marginLeft = '10px';
    copyWithUrlLink.style.color = '#d93025';
    copyWithUrlLink.style.cursor = 'pointer';

    copyWithUrlLink.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        // 获取原始 BibTeX
        const response = await chrome.runtime.sendMessage({
          action: 'fetchBibtex',
          url: importLink.href
        });

        let bibtex = '';
        if (response && response.success) {
          bibtex = response.data.trim();
        }

        if (!bibtex) {
          bibtex = 'Failed to get BibTeX';
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

        copyWithUrlLink.parentNode.insertBefore(msg, copyWithUrlLink.nextSibling);
        msg.className = 'bibtex-copied-msg';
        setTimeout(() => msg.remove(), 3000);

      } catch (err) {
        console.error('Copy failed:', err);
      }
    });

    // 插入链接
    importLink.parentNode.insertBefore(copyLink, importLink.nextSibling);
    copyLink.parentNode.insertBefore(copyWithUrlLink, copyLink.nextSibling);
  });
}

// 监听页面变化
const observer = new MutationObserver(() => {
  addBibtexLinks();
});

observer.observe(document.body, { childList: true, subtree: true });

addBibtexLinks();
