document.addEventListener('DOMContentLoaded', async () => {
  const bibtexArea = document.getElementById('bibtex');
  const copyBtn = document.getElementById('copyBtn');
  const status = document.getElementById('status');

  // 获取当前 tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 检查是否是 Google Scholar 页面
  if (!tab.url.includes('scholar.google.com')) {
    bibtexArea.value = '请在 Google Scholar 页面使用此扩展';
    return;
  }

  // 执行 content script 获取论文信息
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPapersInfo
    });

    const papers = results[0].result;

    if (papers.length === 0) {
      bibtexArea.value = '未找到论文信息，请确保在 Google Scholar 搜索结果页面';
      return;
    }

    // 生成带 URL 的 BibTeX
    const bibtex = generateBibtex(papers);
    bibtexArea.value = bibtex;

    // 复制功能
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bibtex);
        status.textContent = '已复制！';
        setTimeout(() => status.textContent = '', 2000);
      } catch (err) {
        status.textContent = '复制失败';
      }
    });

  } catch (err) {
    bibtexArea.value = '获取失败: ' + err.message;
  }
});

// 从页面提取论文信息
function getPapersInfo() {
  const papers = [];

  // 查找搜索结果中的论文条目
  const gsrs = document.querySelectorAll('.gs_ri');

  gsrs.forEach((el, index) => {
    // 获取标题
    const titleEl = el.querySelector('.gs_rt a');
    const title = titleEl ? titleEl.textContent.replace(/\[.*?\]/g, '').trim() : '';

    // 获取链接
    let url = '';
    if (titleEl && titleEl.href) {
      url = titleEl.href;
      // 如果是 Google Scholar 缓存链接，尝试获取原始链接
      if (url.includes('scholar.google')) {
        // 保持原链接
      }
    }

    // 获取作者
    const authorEl = el.querySelector('.gs_a');
    let author = authorEl ? authorEl.textContent.split('-')[0].trim() : '';

    // 获取年份
    const yearMatch = el.textContent.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : '';

    // 获取期刊/会议
    let journal = authorEl ? authorEl.textContent.split('-').slice(1).join('-').trim() : '';
    journal = journal.replace(/,.*$/, '').trim();

    if (title) {
      papers.push({ title, author, year, journal, url });
    }
  });

  return papers;
}

// 生成 BibTeX
function generateBibtex(papers) {
  let output = '';

  papers.forEach((paper, i) => {
    // 生成 cite key: author + year
    const firstAuthor = paper.author.split(',')[0].split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    const citeKey = firstAuthor + paper.year;

    output += `@article{${citeKey},\n`;
    output += `  title={${paper.title}},\n`;
    output += `  author={${paper.author}},\n`;

    if (paper.journal) {
      output += `  journal={${paper.journal}},\n`;
    }

    if (paper.year) {
      output += `  year={${paper.year}},\n`;
    }

    if (paper.url) {
      output += `  url={${paper.url}}\n`;
    }

    output += `}\n\n`;
  });

  return output;
}
