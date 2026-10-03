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

  const postMeta = document.querySelector('#post-meta, .post-meta');
  const postPath = norm(location.pathname);
  if (postMeta && /^\/.+\/$/.test(postPath)) {
    fetch(API + '?path=' + encodeURIComponent(postPath))
      .then(r => r.json())
      .then(d => postMeta.appendChild(btn(postPath, d.count || 0)))
      .catch(() => {});
  }

  const list = [];
  document.querySelectorAll('.recent-post-item, .article-container article').forEach(it => {
    const a = it.querySelector('a.post-title-link, .post-title a, h1 a, h2 a, h3 a');
    if (!a) return;
    const path = norm(a.getAttribute('href') || '');
    if (path !== '/') list.push({ it, path });
  });
  if (list.length) {
    const qs = list.map(x => 'p=' + encodeURIComponent(x.path)).join('&');
    fetch(API + '?batch&' + qs).then(r => r.json()).then(data => {
      list.forEach(({ it, path }) => {
        const meta = it.querySelector('.post-meta');
        if (meta) meta.appendChild(btn(path, (data && data[path]) || 0));
      });
    }).catch(() => {});
  }

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
      .catch(() => {
        num.textContent = prev;
        b.classList.remove('active'); b.disabled = false;
        liked.delete(path); localStorage.setItem(KEY, JSON.stringify([...liked]));
      });
  });
})();