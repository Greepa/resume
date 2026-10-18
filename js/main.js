/* ==========================================================================
   王国毫 · 个人简历交互脚本
   模块：主题切换 / 导航 / 滚动动画 / 视差 / 打字机 / 数字滚动 / 复制 / 微交互
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 1. 主题切换（深色 / 浅色） ---------- */
  var themeToggle = $('#themeToggle');

  function applyMetaColor() {
    var meta = $('meta[name="theme-color"]');
    var dark = document.documentElement.dataset.theme === 'dark';
    if (meta) meta.setAttribute('content', dark ? '#0b1420' : '#f5f3ec');
  }
  applyMetaColor();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* 隐私模式忽略 */ }
      applyMetaColor();
    });
  }

  /* ---------- 2. 导航：滚动态 / 移动端菜单 ---------- */
  var header = $('#siteHeader');
  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');

  function onScrollHeader() {
    header.classList.toggle('scrolled', window.scrollY > 24);
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    // 点击链接后收起菜单
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    // Escape 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------- 3. 滚动渐入 reveal ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- 4. 导航高亮 scrollspy ---------- */
  var spyLinks = $$('[data-spy]');
  var spyMap = {};
  spyLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    spyMap[id] = a;
  });
  var sections = Object.keys(spyMap).map(function (id) { return document.getElementById(id); }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          spyLinks.forEach(function (a) { a.classList.remove('active'); });
          var link = spyMap[entry.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-38% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { spyIO.observe(s); });
  }

  /* ---------- 5. 返回顶部 ---------- */
  var backTop = $('#backTop');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 6. 视差滚动（rAF 节流） ---------- */
  var parallaxEls = $$('[data-parallax]');
  var ticking = false;

  function updateParallax() {
    var y = window.scrollY;
    if (!reducedMotion) {
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.dataset.parallax) || 0.2;
        el.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
      });
    }
    onScrollHeader();
    if (backTop) backTop.classList.toggle('show', y > 560);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  }, { passive: true });

  /* ---------- 6. 打字机轮播 ---------- */
  var typeTarget = $('#typeTarget');
  if (typeTarget && !reducedMotion) {
    var phrases = ['电机结构设计', '三维建模与工程图输出', '有限元与电磁仿真', '从图纸到实物的完整闭环'];
    var pIdx = 0, cIdx = phrases[0].length, deleting = true;

    (function tick() {
      var word = phrases[pIdx];
      if (deleting) {
        cIdx--;
        if (cIdx <= 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
      } else {
        cIdx++;
        if (cIdx >= phrases[pIdx].length) {
          deleting = true;
          typeTarget.textContent = phrases[pIdx];
          setTimeout(tick, 2200);
          return;
        }
      }
      typeTarget.textContent = phrases[pIdx].slice(0, cIdx);
      setTimeout(tick, deleting ? 55 : 110);
    })();
  }

  /* ---------- 7. 数字滚动 count-up ---------- */
  var counters = $$('.count');
  function runCounter(el) {
    var target = parseInt(el.dataset.target, 10) || 0;
    if (reducedMotion) { el.textContent = String(target); return; }
    var duration = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- 8. 技能条填充 ---------- */
  var bars = $$('.bar-fill');
  if ('IntersectionObserver' in window) {
    var barIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var fill = entry.target;
          fill.style.width = fill.style.getPropertyValue('--w');
          barIO.unobserve(fill);
        }
      });
    }, { threshold: 0.5 });
    bars.forEach(function (b) { barIO.observe(b); });
  } else {
    bars.forEach(function (b) { b.style.width = b.style.getPropertyValue('--w'); });
  }

  /* ---------- 9. 复制到剪贴板 + Toast ---------- */
  var toast = $('#toast');
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }

  // 兼容方案：隐藏 textarea + execCommand（适用于无 Clipboard API 或权限受限场景）
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-999px;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      // 权限被拒时回退到 execCommand
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  $$('[data-copy]').forEach(function (card) {
    card.addEventListener('click', function () {
      copyText(card.dataset.copy)
        .then(function () { showToast('已复制：' + card.dataset.copy); })
        .catch(function () { showToast('复制失败，请手动选择文本'); });
    });
  });

  /* ---------- 10. 按钮涟漪微交互 ---------- */
  $$('.has-ripple').forEach(function (el) {
    el.addEventListener('pointerdown', function (e) {
      var rect = el.getBoundingClientRect();
      var d = Math.max(rect.width, rect.height);
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = d + 'px';
      ripple.style.left = (e.clientX - rect.left - d / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - d / 2) + 'px';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    });
  });

  /* ---------- 初始化首屏状态 ---------- */
  onScrollHeader();
})();
