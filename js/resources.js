    const SEARCH_ENGINES = [
      { id: 'upyunso', name: 'UP云搜', desc: '聚合多网盘，自动出结果', disks: ['all', 'baidu', 'quark', 'aliyun', 'xunlei', '115', 'mobile'] },
      { id: 'pansoucc', name: '盘搜搜', desc: '百度网盘资源专搜', disks: ['all', 'baidu'], buildUrl: kw => `https://pansou.cc/s/${encodeURIComponent(kw)}-1.html` },
      { id: 'sosop', name: '搜搜盘', desc: '百度/夸克/迅雷', disks: ['all', 'baidu', 'quark', 'xunlei'], buildUrl: kw => `https://sosop.cn/?q=${encodeURIComponent(kw)}` },
      { id: 'alipansou', name: '猫狸盘搜', desc: '阿里/夸克/百度', disks: ['all', 'baidu', 'quark', 'aliyun'], buildUrl: kw => `https://www.alipansou.com/search?keyword=${encodeURIComponent(kw)}` },
      { id: 'xiongdipan', name: '兄弟盘', desc: '多网盘聚合', disks: ['all', 'baidu', 'quark', 'aliyun', 'xunlei'], buildUrl: kw => `https://www.xiongdipan.com/search?keyword=${encodeURIComponent(kw)}` }
    ];
    const UPYUNSO_PAN = { baidu: 'baidu', quark: 'kuake', aliyun: 'ali', xunlei: 'xunlei' };
    const DISK_DEFAULT_ENGINE = {
      all: 'upyunso', baidu: 'pansoucc', quark: 'upyunso', aliyun: 'upyunso',
      xunlei: 'upyunso', '115': 'upyunso', mobile: 'upyunso'
    };
    const EMBED_LOAD_TIMEOUT = 12000;

    const globalSearchInput = document.getElementById('globalSearchInput');
    const globalSearchBtn = document.getElementById('globalSearchBtn');
    const searchInput = document.getElementById('resourceSearch');
    const searchResults = document.getElementById('searchResults');
    const searchStatus = document.getElementById('searchStatus');
    const engineGrid = document.getElementById('engineGrid');
    const statResultCount = document.getElementById('statResultCount');
    const searchMode = document.getElementById('searchMode');
    const searchFrame = document.getElementById('searchFrame');
    const searchEmbed = document.getElementById('searchEmbed');
    const embedTitle = document.getElementById('embedTitle');
    const embedHint = document.getElementById('embedHint');
    const embedOpenNew = document.getElementById('embedOpenNew');
    const embedReload = document.getElementById('embedReload');
    const embedLoading = document.getElementById('embedLoading');
    const embedFallback = document.getElementById('embedFallback');
    const embedFallbackOpen = document.getElementById('embedFallbackOpen');
    const embedFallbackRetry = document.getElementById('embedFallbackRetry');
    const embedEngineBar = document.getElementById('embedEngineBar');
    let activeEngineId = DISK_DEFAULT_ENGINE.all;
    let activeDisk = 'all';
    let searchModeValue = 'global';
    let lastKeyword = '';
    let embedLoadTimer = null;
    let embedCurrentUrl = '';
    let dnsPrefetched = false;

    function buildEngineUrl(engine, kw) {
      if (engine.id === 'upyunso') {
        const params = new URLSearchParams({ keyword: kw });
        const pan = UPYUNSO_PAN[activeDisk];
        if (pan) params.set('pan_type', pan);
        return `https://www.upyunso.com/search?${params}`;
      }
      return engine.buildUrl(kw);
    }

    function getDefaultEngine() {
      const defaultId = DISK_DEFAULT_ENGINE[activeDisk] || 'upyunso';
      return getEnginesForDisk(activeDisk).find(e => e.id === defaultId) || getEnginesForDisk(activeDisk)[0];
    }

    function prefetchSearchHosts() {
      if (dnsPrefetched) return;
      dnsPrefetched = true;
      ['www.upyunso.com', 'pansou.cc', 'sosop.cn', 'www.alipansou.com', 'www.xiongdipan.com'].forEach(host => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${host}`;
        document.head.appendChild(link);
      });
    }

    function clearEmbedTimers() {
      if (embedLoadTimer) {
        clearTimeout(embedLoadTimer);
        embedLoadTimer = null;
      }
    }

    function setEmbedLoading(loading) {
      searchEmbed.classList.toggle('is-loading', loading);
      embedLoading.hidden = !loading;
      if (loading) {
        searchEmbed.classList.remove('has-fallback');
        embedFallback.hidden = true;
      }
    }

    function showEmbedFallback(show) {
      searchEmbed.classList.toggle('has-fallback', show);
      embedFallback.hidden = !show;
      if (show) setEmbedLoading(false);
    }

    function highlightActiveEngine(engineId) {
      activeEngineId = engineId;
      document.querySelectorAll('.engine-card[data-engine-id]').forEach(card => {
        card.classList.toggle('active', card.dataset.engineId === engineId);
      });
      document.querySelectorAll('.embed-engine-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.engineId === engineId);
      });
    }

    function renderEmbedEngineBar(keyword) {
      const kw = buildSearchKeyword(keyword || lastKeyword);
      const engines = getEnginesForDisk(activeDisk);
      if (!kw || !engines.length) {
        embedEngineBar.hidden = true;
        embedEngineBar.innerHTML = '';
        return;
      }
      embedEngineBar.hidden = false;
      embedEngineBar.innerHTML = engines.map(engine => `
        <button type="button" class="embed-engine-pill${engine.id === activeEngineId ? ' active' : ''}" data-engine-id="${engine.id}">${escapeHtml(engine.name)}</button>
      `).join('');
      embedEngineBar.querySelectorAll('[data-engine-id]').forEach(btn => {
        btn.onclick = () => {
          const engine = SEARCH_ENGINES.find(e => e.id === btn.dataset.engineId);
          if (engine) loadSearchEmbed(engine, kw);
        };
      });
    }

    function loadSearchEmbed(engine, kw) {
      if (!engine || !kw) return;
      prefetchSearchHosts();
      clearEmbedTimers();
      const url = buildEngineUrl(engine, kw);
      embedCurrentUrl = url;
      highlightActiveEngine(engine.id);
      embedTitle.textContent = `${engine.name} · 「${kw}」`;
      embedHint.textContent = '正在加载搜索结果…';
      embedOpenNew.href = url;
      embedFallbackOpen.href = url;
      searchEmbed.classList.add('show');
      setEmbedLoading(true);
      showEmbedFallback(false);
      searchFrame.onload = () => {
        clearEmbedTimers();
        setEmbedLoading(false);
        showEmbedFallback(false);
        embedHint.textContent = '若下方空白，请点「新窗口打开」或切换其他引擎';
      };
      searchFrame.onerror = () => {
        setEmbedLoading(false);
        showEmbedFallback(true);
        embedHint.textContent = '本页嵌入失败，请用新窗口打开';
      };
      searchFrame.loading = 'lazy';
      searchFrame.removeAttribute('src');
      searchFrame.src = url;
      embedLoadTimer = setTimeout(() => {
        setEmbedLoading(false);
        showEmbedFallback(true);
        embedHint.textContent = '加载较慢或禁止嵌入，建议新窗口打开';
      }, EMBED_LOAD_TIMEOUT);
      setSearchStatus(`已搜索 · ${engine.name} · 可切换上方引擎或下方列表`, false);
      renderEmbedEngineBar(kw);
    }

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildSearchKeyword(keyword) {
      return (keyword || '').trim();
    }

    function getEnginesForDisk(disk) {
      return SEARCH_ENGINES.filter(engine => engine.disks.includes('all') || engine.disks.includes(disk));
    }

    function renderJumpPanel(keyword) {
      const kw = buildSearchKeyword(keyword);
      const engineMore = document.getElementById('engineMore');
      if (!kw || (engineMore && !engineMore.open)) {
        searchResults.innerHTML = '';
        return;
      }
      const engines = getEnginesForDisk(activeDisk);
      const defaultId = DISK_DEFAULT_ENGINE[activeDisk] || 'upyunso';
      searchResults.innerHTML = `
        <section class="result-group">
          <div class="result-group-head">
            <strong>已为你准备 ${engines.length} 个搜索入口</strong>
            <span>关键词：${escapeHtml(kw)}</span>
          </div>
          <div class="result-list">
            ${engines.map(engine => `
              <article class="result-item">
                <div>
                  <div class="result-title">${escapeHtml(engine.name)}${engine.id === defaultId ? ' · 默认' : ''}</div>
                  <div class="result-meta">${escapeHtml(engine.desc)}</div>
                </div>
                <div class="result-actions">
                  <button class="result-btn primary" type="button" data-engine-id="${engine.id}">在本页搜索</button>
                  <a class="result-btn" href="${buildEngineUrl(engine, kw)}" target="_blank" rel="noopener noreferrer">新窗口</a>
                </div>
              </article>`).join('')}
          </div>
        </section>`;
      bindEngineActions(kw);
    }

    function bindEngineActions(kw) {
      document.querySelectorAll('[data-engine-id]').forEach(btn => {
        if (btn.tagName === 'A') return;
        btn.onclick = () => {
          const engine = SEARCH_ENGINES.find(e => e.id === btn.dataset.engineId);
          if (engine) loadSearchEmbed(engine, kw);
        };
      });
    }

    function renderEngines(keyword) {
      const kw = buildSearchKeyword(keyword || lastKeyword || '');
      const engines = getEnginesForDisk(activeDisk);
      statResultCount.textContent = String(engines.length);
      engineGrid.innerHTML = engines.map(engine => `
        <button type="button" class="engine-card${engine.id === activeEngineId ? ' active' : ''}" data-engine-id="${engine.id}">
          <strong>${escapeHtml(engine.name)}</strong>
          <span>${escapeHtml(engine.desc)}${kw ? ` · 搜「${escapeHtml(kw)}」` : ' · 输入关键词后搜索'}</span>
        </button>`).join('');
      bindEngineActions(kw);
    }

    function setSearchStatus(text, isError) {
      searchStatus.textContent = text;
      searchStatus.classList.toggle('show', !!text);
      searchStatus.classList.toggle('error', !!isError);
    }

    function focusPrimarySearch() {
      const el = searchModeValue === 'global' ? globalSearchInput : searchInput;
      el.focus();
      el.select();
    }

    function searchGlobalPan(keyword, reloadEmbed = true) {
      const raw = (keyword || '').trim();
      if (!raw) {
        setSearchStatus('请输入搜索关键词', true);
        focusPrimarySearch();
        return;
      }
      lastKeyword = raw;
      const kw = buildSearchKeyword(raw);
      globalSearchInput.value = raw;
      searchInput.value = raw;
      history.replaceState(null, '', `?q=${encodeURIComponent(raw)}${activeDisk !== 'all' ? '&disk=' + activeDisk : ''}`);

      renderEngines(raw);
      renderJumpPanel(raw);
      if (reloadEmbed) {
        loadSearchEmbed(getDefaultEngine(), kw);
        searchEmbed.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        renderEmbedEngineBar(kw);
      }
    }

    function setPageMode(mode) {
      searchModeValue = mode;
      document.body.classList.toggle('mode-global', mode === 'global');
      document.body.classList.toggle('mode-local', mode === 'local');
      searchMode.querySelectorAll('button').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
      const panel = document.getElementById('globalSearchPanel');
      if (panel) panel.style.display = mode === 'global' ? 'block' : 'none';
    }

    globalSearchBtn.addEventListener('click', () => searchGlobalPan(globalSearchInput.value));
    globalSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchGlobalPan(globalSearchInput.value); });
    globalSearchInput.addEventListener('input', () => { searchInput.value = globalSearchInput.value; });
    globalSearchInput.addEventListener('focus', () => prefetchSearchHosts(), { once: true });
    const engineMoreEl = document.getElementById('engineMore');
    if (engineMoreEl) {
      engineMoreEl.addEventListener('toggle', () => {
        if (engineMoreEl.open && lastKeyword) renderJumpPanel(lastKeyword);
      });
    }
    document.getElementById('diskTabs').addEventListener('click', e => {
      const tab = e.target.closest('.disk-tab');
      if (!tab) return;
      activeDisk = tab.dataset.disk;
      document.querySelectorAll('#diskTabs .disk-tab').forEach(t => t.classList.toggle('active', t === tab));
      if (lastKeyword) searchGlobalPan(lastKeyword, true);
    });
    document.querySelectorAll('.hot-keys button').forEach(btn => {
      btn.addEventListener('click', () => searchGlobalPan(btn.dataset.kw));
    });
    searchMode.addEventListener('click', e => {
      const btn = e.target.closest('button[data-mode]');
      if (!btn) return;
      setPageMode(btn.dataset.mode);
      if (btn.dataset.mode === 'local') applyResourceFilter();
      else if (lastKeyword) searchGlobalPan(lastKeyword, false);
    });

    embedReload.addEventListener('click', () => {
      if (!lastKeyword || !embedCurrentUrl) return;
      const engine = SEARCH_ENGINES.find(e => e.id === activeEngineId) || getDefaultEngine();
      loadSearchEmbed(engine, buildSearchKeyword(lastKeyword));
    });
    embedFallbackRetry.addEventListener('click', () => embedReload.click());

    document.getElementById('focusSearch').addEventListener('click', () => {
      if (searchModeValue === 'global') setPageMode('global');
      focusPrimarySearch();
    });

    document.getElementById('routeGlobalSearch').addEventListener('click', () => {
      const route = routes[activeRouteKey];
      const kw = (route && route.keyword) || (route && route.terms && route.terms[0]) || searchInput.value.trim();
      if (!kw) {
        alert('请先选择资源雷达场景，或输入搜索词');
        return;
      }
      setPageMode('global');
      searchGlobalPan(kw);
    });

    const tabs = Array.from(document.querySelectorAll('.tab'));
    const emptyState = document.getElementById('emptyState');
    const routeTitle = document.getElementById('routeTitle');
    const routeDesc = document.getElementById('routeDesc');
    const routeTags = document.getElementById('routeTags');
    const routeSteps = document.getElementById('routeSteps');
    const pathDock = document.getElementById('pathDock');
    const dockTitle = document.getElementById('dockTitle');
    const dockDesc = document.getElementById('dockDesc');
    const personas = Array.from(document.querySelectorAll('.persona'));
    const recentRoutesElement = document.getElementById('recentRoutes');
    const savedRoutesElement = document.getElementById('savedRoutes');
    const storageKeys = {
      recent: 'resourceRadarRecentRoutes',
      saved: 'resourceRadarSavedRoutes'
    };
    const routes = {
      watch: {
        title: '影视优先路径',
        desc: '先看电影和剧集，如果想找长期更新内容，再看综艺纪录和热门推荐。',
        category: '影视',
        keyword: '4K电影',
        terms: ['电影', '剧集', '综艺', '纪录', '热门'],
        tags: ['电影资源', '剧集资源', '综艺纪录', '热门推荐'],
        steps: ['先看剧集/电影是否已有入口', '再按清晰度或更新状态筛选', '找不到就去热门推荐看替代']
      },
      learn: {
        title: '学习成长路径',
        desc: '先按目标选择考试、编程或语言办公，再用标签区分真题、讲义、项目和模板。',
        category: '学习',
        keyword: '考研资料',
        terms: ['考试', '编程', '语言', '办公', '电子书', '报告'],
        tags: ['考试资料', '编程技术', '语言与办公', '技术书籍'],
        steps: ['先按学习目标选考试或技能', '用标签区分真题、讲义或项目', '把常用资料生成固定入口']
      },
      work: {
        title: '效率工具路径',
        desc: '适合想快速找软件、办公模板、AI 工具和自动化工作流的用户。',
        category: 'all',
        keyword: '办公软件',
        terms: ['工具', '软件', 'PPT', '模板', '工作流'],
        tags: ['Windows 工具', 'Mac 软件', 'PPT 与模板', 'AI 工作流'],
        steps: ['先找当前设备可用工具', '再补办公模板或自动化工作流', '把团队常用工具整理成入口']
      },
      create: {
        title: '内容创作路径',
        desc: '从素材模板开始，再补充音效、配乐、AI 工具和提示词。',
        category: 'all',
        keyword: '视频素材',
        terms: ['素材', '图片', '音效', '配乐', 'AI', '提示词'],
        tags: ['图片与图标', '视频音频素材', '音效素材', '提示词合集'],
        steps: ['先找素材类型', '再补音效或提示词', '按项目主题打包生成分享页']
      },
      mobile: {
        title: '移动端可用路径',
        desc: '优先看安卓、iOS 和主题美化，也可以搭配手机端网盘扫码使用。',
        category: '手机',
        keyword: '安卓应用',
        terms: ['安卓', 'iOS', '主题', '快捷指令'],
        tags: ['安卓软件', 'iOS 资源', '主题美化'],
        steps: ['先确认安卓或 iOS', '再看应用、主题或快捷指令', '移动端资源优先用扫码入口']
      },
      repair: {
        title: '补档与替代路径',
        desc: '先看最近更新和热门推荐，找不到再走失效反馈或重新生成入口。',
        category: '热门',
        keyword: '最近更新',
        terms: ['最近更新', '补档', '失效', '热门', '反馈'],
        tags: ['最近更新', '失效反馈', '热门推荐'],
        steps: ['先看最近更新是否已补档', '再找热门推荐里的替代入口', '最后提交失效反馈或重新生成链接']
      }
    };
    let recommendedTerms = [];
    let activeCategory = 'all';
    let activeRouteKey = '';

    function debounce(fn, delay) {
      let timer = null;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    function cacheCardSearchText() {
      document.querySelectorAll('.grid[data-category] .card').forEach(card => {
        if (!card.dataset.search) {
          card.dataset.search = card.textContent.toLowerCase();
        }
      });
    }
    function readRouteStore(key) {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; }
    }

    function writeRouteStore(key, value) {
      localStorage.setItem(key, JSON.stringify(value.slice(0, 6)));
    }

    function routeButton(routeKey) {
      const route = routes[routeKey];
      const btn = document.createElement('button');
      btn.className = 'route-pill';
      btn.type = 'button';
      btn.textContent = route ? route.title : routeKey;
      btn.addEventListener('click', () => activateRoute(routeKey));
      return btn;
    }

    function renderRouteStore() {
      const recent = readRouteStore(storageKeys.recent);
      const saved = readRouteStore(storageKeys.saved);
      recentRoutesElement.replaceChildren(...(recent.length ? recent.map(routeButton) : [emptyRoute('选择一个资源雷达目标后，这里会记录最近路线。')]));
      savedRoutesElement.replaceChildren(...(saved.length ? saved.map(routeButton) : [emptyRoute('点击“收藏当前路线”，下次可以直接恢复。')]));
    }

    function emptyRoute(text) {
      const el = document.createElement('div');
      el.className = 'route-empty';
      el.textContent = text;
      return el;
    }

    function rememberRecent(routeKey) {
      const recent = readRouteStore(storageKeys.recent).filter(item => item !== routeKey);
      recent.unshift(routeKey);
      writeRouteStore(storageKeys.recent, recent);
      renderRouteStore();
    }

    function applyResourceFilter() {
      const keyword = (searchInput.value || '').trim().toLowerCase();
      let visibleCards = 0;

      document.querySelectorAll('.grid[data-category]').forEach(grid => {
        const category = grid.dataset.category;
        const categoryMatched = activeCategory === 'all' || activeCategory === category;
        let sectionVisibleCards = 0;

        grid.querySelectorAll('.card').forEach(card => {
          const text = card.dataset.search || card.textContent.toLowerCase();
          const visible = categoryMatched && (!keyword || text.includes(keyword));
          const recommended = recommendedTerms.some(term => text.includes(term.toLowerCase()));
          card.classList.toggle('is-hidden', !visible);
          card.classList.toggle('recommended', visible && recommended);
          if (visible) {
            sectionVisibleCards++;
            visibleCards++;
          }
        });

        grid.classList.toggle('is-hidden', sectionVisibleCards === 0);
        const head = document.querySelector(`.section-head[data-category="${category}"]`);
        if (head) head.classList.toggle('is-hidden', sectionVisibleCards === 0);
      });

      emptyState.classList.toggle('show', visibleCards === 0);
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.filter;
        recommendedTerms = [];
        personas.forEach(item => item.classList.remove('active'));
        tabs.forEach(item => item.classList.toggle('active', item === tab));
        applyResourceFilter();
      });
    });
    searchInput.addEventListener('input', debounce(() => {
      if (searchModeValue === 'global') {
        globalSearchInput.value = searchInput.value;
      } else {
        applyResourceFilter();
      }
    }, 180));
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchModeValue === 'global') {
        e.preventDefault();
        searchGlobalPan(searchInput.value);
      }
    });

    function activateCategory(category) {
      activeCategory = category;
      tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.filter === category));
      if (!tabs.some(tab => tab.classList.contains('active'))) {
        tabs[0].classList.add('active');
        activeCategory = 'all';
      }
    }

    function renderRoute(route) {
      routeTitle.textContent = route.title;
      routeDesc.textContent = route.desc;
      routeTags.innerHTML = route.tags.map(tag => `<span>${tag}</span>`).join('');
      routeSteps.innerHTML = route.steps.map((step, index) => `<div class="route-step"><b>${index + 1}</b><span>${step}</span></div>`).join('');
      dockTitle.textContent = route.title;
      dockDesc.textContent = route.tags.join(' / ');
      pathDock.classList.add('show');
    }

    function activateRoute(routeKey) {
      const route = routes[routeKey];
      if (!route) return;
      activeRouteKey = routeKey;
      personas.forEach(item => item.classList.toggle('active', item.dataset.route === routeKey));
      recommendedTerms = route.terms;
      if (route.keyword) searchInput.value = route.keyword;
      activateCategory(route.category);
      renderRoute(route);
      rememberRecent(routeKey);
      applyResourceFilter();
    }

    personas.forEach(persona => {
      persona.addEventListener('click', () => activateRoute(persona.dataset.route));
    });

    document.getElementById('saveRoute').addEventListener('click', () => {
      if (!activeRouteKey) {
        alert('请先选择一个资源雷达目标');
        return;
      }
      const saved = readRouteStore(storageKeys.saved).filter(item => item !== activeRouteKey);
      saved.unshift(activeRouteKey);
      writeRouteStore(storageKeys.saved, saved);
      renderRouteStore();
    });

    function currentChecklist() {
      const route = routes[activeRouteKey];
      if (!route) {
        return '资源维护清单：1. 每周检查热门和最近更新入口；2. 给软件/游戏/AI 资源补充版本和使用说明；3. 保留失效反馈入口；4. 将高访问资源生成固定分享页。';
      }
      return `${route.title}维护清单：\n1. ${route.steps[0]}\n2. ${route.steps[1]}\n3. ${route.steps[2]}\n推荐入口：${route.tags.join('、')}`;
    }

    function copyText(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('已复制清单'));
      } else {
        alert(text);
      }
    }

    document.getElementById('copyRoutePlan').addEventListener('click', () => copyText(currentChecklist()));
    document.getElementById('copyDefaultChecklist').addEventListener('click', () => copyText(currentChecklist()));
    document.getElementById('clearRecent').addEventListener('click', () => {
      localStorage.removeItem(storageKeys.recent);
      renderRouteStore();
    });
    document.getElementById('clearSaved').addEventListener('click', () => {
      localStorage.removeItem(storageKeys.saved);
      renderRouteStore();
    });

    document.getElementById('clearRadar').addEventListener('click', () => {
      personas.forEach(item => item.classList.remove('active'));
      recommendedTerms = [];
      activeRouteKey = '';
      searchInput.value = '';
      activateCategory('all');
      routeTitle.textContent = '先选一个目标';
      routeDesc.textContent = '我会把搜索词和推荐入口自动整理好，帮用户少走几步。';
      routeTags.innerHTML = '<span>场景化找资源</span><span>自动高亮</span>';
      routeSteps.innerHTML = '<div class="route-step"><b>1</b><span>选择一个目标</span></div><div class="route-step"><b>2</b><span>查看推荐入口</span></div><div class="route-step"><b>3</b><span>生成或维护分享链接</span></div>';
      pathDock.classList.remove('show');
      applyResourceFilter();
    });
    cacheCardSearchText();
    renderRouteStore();
    renderEngines('');
    setPageMode('global');
    const urlParams = new URLSearchParams(location.search);
    const initialQuery = urlParams.get('q');
    const initialDisk = urlParams.get('disk');
    if (initialDisk) {
      activeDisk = initialDisk;
      document.querySelectorAll('#diskTabs .disk-tab').forEach(t => t.classList.toggle('active', t.dataset.disk === initialDisk));
    }
    if (initialQuery) searchGlobalPan(initialQuery);
