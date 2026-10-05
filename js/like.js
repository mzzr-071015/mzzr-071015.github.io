(function () {
  const API = 'https://blog-like.2170392148.workers.dev';
  const KEY = 'liked_posts';
  const liked = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  const norm = p => '/' + String(p).replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '') + '/';

  function btn(path, count) {
    const on = liked.has(path);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'post-like' + (on ? ' active' : '');
    b.dataset.path = path;
    b.disabled = on;
    b.innerHTML = '<span class="heart">♥</span><span class="num">' + (count || 0) + '</span>';
    return b;
  }

  // ① 文章页：先无条件把按钮画出来，再异步把真实数字填进去
  const host = document.querySelector('#post-meta')

    || document.querySelector('#post-info-wrap .post-meta')
    || document.querySelector('.post-meta');
  const postPath = norm(location.pathname);
  if (host && /^\/.+\/$/.test(postPath)) {
    const b = btn(postPath, 0);            // 先插按钮，数字默认 0
    host.appendChild(b);
    fetch(API + '?path=' + encodeURIComponent(postPath))   // 再补真实数字，失败也无所谓
      .then(r => r.json())
      .then(d => { const n = b.querySelector('.num'); if (n && d && typeof d.count === 'number') n.textContent = d.count; })
      .catch(() => {});
  }

  // ② 首页/归档：同样先插按钮，再批量更新数字
  const list = [];
  document.querySelectorAll('.recent-post-item, .article-container article').forEach(it => {
    const a = it.querySelector('a.post-title-link, .post-title a, h1 a, h2 a, h3 a');
    if (!a) return;
    const p = norm(a.getAttribute('href') || '');
    const meta = it.querySelector('.post-meta');
    if (p !== '/' && meta) { const b = btn(p, 0); meta.appendChild(b); list.push({ b, p }); }
  });
  if (list.length) {
    const qs = list.map(x => 'p=' + encodeURIComponent(x.p)).join('&');
    fetch(API + '?batch&' + qs).then(r => r.json()).then(data => {
      list.forEach(({ b, p }) => { const n = b.querySelector('.num'); if (n && data && typeof data[p] === 'number') n.textContent = data[p]; });
    }).catch(() => {});
  }

  // ③ 点击点赞
  document.addEventListener('click', e => {
    const b = e.target.closest('.post-like');
    if (!b || b.disabled) return;
    const path = b.dataset.path, num = b.querySelector('.num');
    const prev = parseInt(num.textContent, 10);
    num.textContent = prev + 1;
    b.classList.add('active'); b.disabled = true;
    liked.add(path); localStorage.setItem(KEY, JSON.stringify([...liked]));
    fetch(API + '?path=' + encodeURIComponent(path), { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (typeof d.count === 'number') num.textContent = d.count; })
      .catch(() => { num.textContent = prev; b.classList.remove('active'); b.disabled = false; liked.delete(path); localStorage.setItem(KEY, JSON.stringify([...liked])); });
  });
})();