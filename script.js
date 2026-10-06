// Portfólio — Cayque Cicarelli
// Seções: armazenamento · idioma · tema · rota · visual novel · conquistas ·
//         Konami/CRT · currículos · navegação · contato · animações · inicialização
(() => {
    'use strict';

    const root = document.documentElement;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---------- Armazenamento ----------
    // O localStorage é compartilhado por todos os sites em neonbrasil.github.io,
    // por isso as chaves levam o prefixo "cayque:".
    const store = {
        get(key) {
            try { return localStorage.getItem('cayque:' + key); } catch { return null; }
        },
        set(key, value) {
            try { localStorage.setItem('cayque:' + key, value); } catch { /* modo privado ou bloqueado */ }
        },
    };

    function readJSON(key, fallback) {
        try { return JSON.parse(store.get(key)) ?? fallback; } catch { return fallback; }
    }

    function setParam(name, value) {
        const url = new URL(location.href);
        if (value) url.searchParams.set(name, value);
        else url.searchParams.delete(name);
        history.replaceState(history.state, '', url);
    }

    function icon(name) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'icon');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#i-' + name);
        svg.append(use);
        return svg;
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // ---------- Idioma ----------
    const dict = typeof translations !== 'undefined' ? translations : {};
    let lang = root.lang.startsWith('en') ? 'en' : 'pt';
    const t = (key) => (dict[lang] && dict[lang][key]) || (dict.pt && dict.pt[key]) || '';

    function applyLanguage(next) {
        lang = next === 'en' ? 'en' : 'pt';
        root.lang = lang === 'en' ? 'en' : 'pt-BR';

        $$('[data-translate]').forEach((node) => {
            const value = t(node.dataset.translate);
            if (value) node.textContent = value;
        });
        $$('[data-translate-html]').forEach((node) => {
            const value = t(node.dataset.translateHtml);
            if (value) node.innerHTML = value;
        });
        $$('[data-translate-attr]').forEach((node) => {
            node.dataset.translateAttr.split(';').forEach((pair) => {
                const [attr, key] = pair.split(':').map((s) => s.trim());
                const value = t(key);
                if (attr && value) node.setAttribute(attr, value);
            });
        });

        document.title = t('page-title') || document.title;

        // Os currículos mudam conforme o idioma
        ['security', 'gamedev'].forEach((type) => {
            const link = document.getElementById('cv-option-' + type);
            const file = t('cv-file-' + type);
            if (link && file) {
                link.setAttribute('href', file);
                // Nome do arquivo baixado sem a pasta e sem o ".docx" que veio da conversão
                link.setAttribute('download', file.split('/').pop().replace('.docx.pdf', '.pdf'));
            }
        });

        $$('[data-lang]').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang)));
        root.classList.remove('i18n-pending');
        document.dispatchEvent(new CustomEvent('langchange'));
    }

    // ---------- Tema ----------
    function applyTheme(theme) {
        root.dataset.theme = theme === 'light' ? 'light' : 'dark';
        const meta = $('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', root.dataset.theme === 'light' ? '#F4EFE6' : '#12100E');
    }

    // ---------- Rota (tudo / game dev / segurança) ----------
    const ROUTES = ['all', 'game', 'sec'];
    let route = ROUTES.includes(root.dataset.route) ? root.dataset.route : 'all';

    function setRoute(next, { fromUser = true } = {}) {
        route = ROUTES.includes(next) ? next : 'all';
        root.dataset.route = route;
        $$('[data-route-set]').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.routeSet === route)));

        if (fromUser) {
            store.set('route', route);
            // Link compartilhável: ?route=game ou ?route=sec
            const url = new URL(location.href);
            url.searchParams.delete('rota');
            if (route === 'all') url.searchParams.delete('route');
            else url.searchParams.set('route', route);
            history.replaceState(history.state, '', url);
        }

        if (route !== 'all') markRouteSeen(route);
        document.dispatchEvent(new CustomEvent('routechange'));
    }

    function markRouteSeen(seenRoute) {
        const seen = new Set(readJSON('routes-seen', []));
        seen.add(seenRoute);
        store.set('routes-seen', JSON.stringify([...seen]));
        if (seen.has('game') && seen.has('sec')) unlock('multiclass');
    }

    // ---------- Visual novel ----------
    function initVisualNovel(vn) {
        const textEl = $('.vn-text', vn);
        const live = $('.vn-live', vn);
        const box = $('.vn-box', vn);
        const nextBtn = $('.vn-next', vn);
        const choices = $('.vn-choices', vn);
        const after = $('.vn-after', vn);
        const log = $('.vn-log', vn);
        const logList = $('.vn-log-list', vn);
        const logClose = $('.js-vn-log-close', vn);
        const historyBtn = $('[data-vn="history"]', vn);
        const skipBtn = $('[data-vn="skip"]', vn);
        const autoBtn = $('[data-vn="auto"]', vn);
        const clock = $('.vn-clock', vn);

        const INTRO = ['vn-line-1', 'vn-line-2', 'vn-line-3', 'vn-line-4'];
        const CHAR_MS = 24;
        const seen = []; // falas já exibidas, para o histórico
        let index = 0;
        let current = null;
        let typer = null;
        let autoTimer = null;
        let auto = false;

        // Leitores de tela recebem a fala inteira pela região "ao vivo", não letra por letra
        textEl.setAttribute('aria-hidden', 'true');

        function setState(state) {
            vn.dataset.state = state;
            choices.hidden = state !== 'choice';
            after.hidden = state !== 'after';
            nextBtn.hidden = state !== 'talk';
            skipBtn.disabled = state !== 'talk';
            autoBtn.disabled = state !== 'talk';
        }

        function stopTyping() {
            clearInterval(typer);
            typer = null;
            vn.classList.remove('is-typing');
        }

        function say(key, { instant = false } = {}) {
            stopTyping();
            clearTimeout(autoTimer);
            current = key;
            if (seen[seen.length - 1] !== key) seen.push(key);

            const line = t(key);
            live.textContent = line;
            if (instant || reducedMotion.matches) {
                lineDone();
                return;
            }

            let shown = 0;
            textEl.textContent = '';
            vn.classList.add('is-typing');
            typer = setInterval(() => {
                shown += 1;
                textEl.textContent = line.slice(0, shown);
                if (shown >= line.length) lineDone();
            }, CHAR_MS);
        }

        function lineDone() {
            stopTyping();
            textEl.textContent = t(current);
            if (vn.dataset.state !== 'talk') return;
            if (index >= INTRO.length - 1) openChoices();
            else if (auto) autoTimer = setTimeout(advance, 1200 + t(current).length * 20);
        }

        function advance() {
            if (vn.dataset.state !== 'talk') return;
            if (typer) {
                lineDone(); // primeiro clique completa a fala
                return;
            }
            if (index < INTRO.length - 1) {
                index += 1;
                say(INTRO[index]);
            }
        }

        function openChoices({ focus = vn.contains(document.activeElement) } = {}) {
            setState('choice');
            if (focus) $('.vn-choice', choices).focus({ preventScroll: true });
        }

        function choose(next) {
            setState('after');
            say('vn-reply-' + next);
            setRoute(next);
            unlock('route');
            store.set('vn-done', '1');
            $('a', after).focus({ preventScroll: true });
        }

        function skip() {
            if (vn.dataset.state !== 'talk') return;
            for (let i = index + 1; i < INTRO.length; i += 1) seen.push(INTRO[i]);
            index = INTRO.length - 1;
            say(INTRO[index], { instant: true });
        }

        function toggleAuto() {
            auto = !auto;
            autoBtn.setAttribute('aria-pressed', String(auto));
            clearTimeout(autoTimer);
            if (auto && !typer && vn.dataset.state === 'talk') autoTimer = setTimeout(advance, 700);
        }

        function renderLog() {
            logList.replaceChildren(...seen.map((key) => {
                const item = el('li');
                item.append(el('span', 'vn-log-who', 'Cayque'), el('p', 'vn-log-line', t(key)));
                return item;
            }));
            logList.scrollTop = logList.scrollHeight;
        }

        function openLog() {
            renderLog();
            log.hidden = false;
            logClose.focus({ preventScroll: true });
        }

        function closeLog() {
            log.hidden = true;
            historyBtn.focus({ preventScroll: true });
        }

        function updateClock() {
            if (!clock) return;
            clock.textContent = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
                hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
            }).format(new Date());
        }

        box.addEventListener('click', (e) => {
            if (e.target.closest('a, .vn-quick, .vn-after')) return;
            advance();
        });
        $$('.vn-choice', vn).forEach((btn) => btn.addEventListener('click', () => choose(btn.dataset.choice)));
        $('.js-vn-reroute', vn).addEventListener('click', () => {
            say('vn-line-4', { instant: true });
            openChoices({ focus: true });
        });
        historyBtn.addEventListener('click', openLog);
        logClose.addEventListener('click', closeLog);
        log.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                closeLog();
            }
        });
        skipBtn.addEventListener('click', skip);
        autoBtn.addEventListener('click', toggleAuto);

        document.addEventListener('langchange', () => {
            if (current) {
                live.textContent = t(current);
                lineDone();
            }
            if (!log.hidden) renderLog();
            updateClock();
        });

        // Se a rota mudar pelo seletor dos projetos, a resposta do diálogo acompanha
        document.addEventListener('routechange', () => {
            if (vn.dataset.state === 'after' && current !== 'vn-reply-' + route) {
                say('vn-reply-' + route, { instant: true });
            }
        });

        updateClock();
        setInterval(updateClock, 30000);

        // Quem chega por um link com rota (ou já escolheu antes) vai direto para a resposta
        const params = new URLSearchParams(location.search);
        if (params.has('route') || params.has('rota') || store.get('vn-done')) {
            index = INTRO.length - 1;
            seen.push(...INTRO);
            setState('after');
            say('vn-reply-' + route, { instant: true });
        } else {
            setState('talk');
            say(INTRO[0]);
        }
    }

    // ---------- Conquistas ----------
    const ACHIEVEMENTS = [
        { id: 'route', icon: 'code-branch' },
        { id: 'multiclass', icon: 'dice-d20' },
        { id: 'explorer', icon: 'compass' },
        { id: 'loot', icon: 'file-arrow-down' },
        { id: 'polyglot', icon: 'language' },
        { id: 'contact', icon: 'envelope' },
        { id: 'konami', icon: 'gamepad', secret: true },
    ];
    const unlocked = new Set(readJSON('achievements', []));
    const toastRegion = $('.toasts');
    let toastsOn = store.get('toasts') !== 'off';

    function unlock(id) {
        if (unlocked.has(id)) return;
        unlocked.add(id);
        store.set('achievements', JSON.stringify([...unlocked]));
        renderAchievements();
        showToast(id);

        if (!unlocked.has('platinum') && ACHIEVEMENTS.every((a) => unlocked.has(a.id))) {
            unlocked.add('platinum');
            store.set('achievements', JSON.stringify([...unlocked]));
            renderAchievements();
            setTimeout(() => showToast('platinum'), 900);
        }
    }

    function showToast(id) {
        if (!toastsOn || !toastRegion) return;
        const def = ACHIEVEMENTS.find((a) => a.id === id) || { icon: 'trophy' };

        const toast = el('div', 'toast');
        const iconBox = el('span', 'toast-icon');
        iconBox.append(icon(def.icon));
        const body = el('div');
        body.append(el('p', 'toast-kicker', t('ach-unlocked')), el('p', 'toast-title', t(`ach-${id}-title`)));
        if (id === 'platinum') {
            const link = el('a', '', t('ach-platinum-cta') + ' →');
            link.href = '#contato';
            body.append(link);
        }
        toast.append(iconBox, body);
        toastRegion.append(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-in')));
        setTimeout(() => {
            toast.classList.remove('is-in');
            setTimeout(() => toast.remove(), 400);
        }, id === 'platinum' ? 8000 : 4200);
    }

    function renderAchievements() {
        const count = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
        $$('.ach-count').forEach((node) => { node.textContent = `${count}/${ACHIEVEMENTS.length}`; });
        $$('.js-open-ach').forEach((btn) => btn.classList.toggle('is-platinum', unlocked.has('platinum')));

        const list = $('.ach-list');
        if (!list) return;
        const items = ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.has(a.id);
            const isHidden = a.secret && !isUnlocked;
            const item = el('li', 'ach-item' + (isUnlocked ? '' : ' is-locked'));
            const iconBox = el('span', 'ach-icon');
            iconBox.append(icon(isUnlocked ? a.icon : 'lock'));
            const text = el('div');
            text.append(
                el('p', 'ach-name', isHidden ? t('ach-secret') : t(`ach-${a.id}-title`)),
                el('p', 'ach-desc', isHidden ? t('ach-secret-desc') : t(`ach-${a.id}-desc`)),
            );
            item.append(iconBox, text);
            return item;
        });
        if (unlocked.has('platinum')) {
            const item = el('li', 'ach-item');
            const iconBox = el('span', 'ach-icon');
            iconBox.append(icon('trophy'));
            const text = el('div');
            text.append(el('p', 'ach-name', t('ach-platinum-title')), el('p', 'ach-desc', t('ach-platinum-desc')));
            item.append(iconBox, text);
            items.unshift(item);
        }
        list.replaceChildren(...items);
    }

    // ---------- Código Konami → modo CRT ----------
    const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    const typedKeys = [];
    const crtExit = $('.crt-exit');

    function toggleCRT(force) {
        const on = typeof force === 'boolean' ? force : !root.classList.contains('crt');
        if (on && !document.getElementById('crt-font')) {
            const font = el('link');
            font.id = 'crt-font';
            font.rel = 'stylesheet';
            font.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
            document.head.append(font);
        }
        root.classList.toggle('crt', on);
        if (crtExit) crtExit.hidden = !on;
        if (on) unlock('konami');
    }

    // ---------- Navegação ----------
    const menuBtn = $('.menu-toggle');

    function setMenu(open) {
        root.classList.toggle('menu-open', open);
        if (!menuBtn) return;
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', t(open ? 'menu-close' : 'menu-label'));
    }

    // ---------- Inicialização ----------
    applyTheme(root.dataset.theme);
    renderAchievements();
    applyLanguage(lang);
    setRoute(route, { fromUser: false });

    const vn = $('#vn');
    if (vn) initVisualNovel(vn);

    // Idioma
    $$('[data-lang]').forEach((btn) => btn.addEventListener('click', () => {
        if (btn.dataset.lang === lang) return;
        applyLanguage(btn.dataset.lang);
        store.set('lang', lang);
        setParam('lang', lang === 'en' ? 'en' : null);
        unlock('polyglot');
    }));

    // Tema
    $('.theme-toggle')?.addEventListener('click', () => {
        applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
        store.set('theme', root.dataset.theme);
    });

    // Seletor de rota nos projetos
    $$('[data-route-set]').forEach((btn) => btn.addEventListener('click', () => {
        setRoute(btn.dataset.routeSet);
        if (route !== 'all') unlock('route');
    }));

    // Diálogos (currículos e conquistas)
    const cvDialog = $('#cv-dialog');
    const achDialog = $('#ach-dialog');
    $$('.js-open-cv').forEach((btn) => btn.addEventListener('click', () => {
        setMenu(false);
        cvDialog?.showModal();
    }));
    $$('.cv-option').forEach((link) => link.addEventListener('click', () => {
        unlock('loot');
        setTimeout(() => cvDialog.close(), 150);
    }));
    $$('.js-open-ach').forEach((btn) => btn.addEventListener('click', () => {
        renderAchievements();
        achDialog?.showModal();
    }));
    $$('dialog.modal').forEach((dialog) => dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close(); // clique fora da caixa
    }));

    const toastToggle = $('.js-ach-toasts');
    if (toastToggle) {
        toastToggle.checked = toastsOn;
        toastToggle.addEventListener('change', () => {
            toastsOn = toastToggle.checked;
            store.set('toasts', toastsOn ? 'on' : 'off');
        });
    }

    // Konami (teclado) e dica clicável no rodapé (celular)
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
        typedKeys.push(e.key.toLowerCase());
        if (typedKeys.length > KONAMI.length) typedKeys.shift();
        if (typedKeys.join() === KONAMI.join()) {
            typedKeys.length = 0;
            toggleCRT();
        }
    });
    $('.js-konami-hint')?.addEventListener('click', () => toggleCRT());
    crtExit?.addEventListener('click', () => toggleCRT(false));

    // Menu mobile
    menuBtn?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    $('#site-nav')?.addEventListener('click', (e) => {
        if (e.target.closest('a')) setMenu(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (root.classList.contains('menu-open')) setMenu(false);
        else if (root.classList.contains('crt') && !$('dialog[open]')) toggleCRT(false);
    });

    // Header ganha borda depois de rolar
    const header = $('.site-header');
    const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Link ativo no menu + conquista "Explorador"
    const navLinks = $$('.site-nav a');
    const visited = new Set();
    const toVisit = ['projetos', 'experiencia', 'sobre', 'contato'];
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach((link) => {
                if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
            if (toVisit.includes(id) && !visited.has(id)) {
                visited.add(id);
                if (toVisit.every((s) => visited.has(s))) unlock('explorer');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((section) => sectionObserver.observe(section));

    // Copiar email
    $$('.js-copy-email').forEach((btn) => {
        const label = $('.copy-label', btn);
        let timer;
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email;
            let copied = false;
            try {
                await navigator.clipboard.writeText(email);
                copied = true;
            } catch {
                const tmp = el('textarea');
                tmp.value = email;
                tmp.setAttribute('readonly', '');
                tmp.style.cssText = 'position:fixed;opacity:0';
                document.body.append(tmp);
                tmp.select();
                try { copied = document.execCommand('copy'); } catch { copied = false; }
                tmp.remove();
            }
            if (!copied) return;
            btn.classList.add('is-done');
            label.textContent = t('copied');
            clearTimeout(timer);
            timer = setTimeout(() => {
                btn.classList.remove('is-done');
                label.textContent = t('copy-email');
            }, 2200);
            unlock('contact');
        });
    });
    $$('a[href^="mailto:"]').forEach((link) => link.addEventListener('click', () => unlock('contact')));

    // Elementos aparecem suavemente ao rolar
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        $$('.reveal').forEach((node) => revealObserver.observe(node));
        root.classList.add('reveal-ready');
    }

    $$('.js-year').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
})();
