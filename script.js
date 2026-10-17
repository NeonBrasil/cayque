// Portfólio — Cayque Cicarelli
// Seções: armazenamento · idioma · tema · rota · visual novel · conquistas ·
//         Konami/CRT · Snake · currículos e detalhes técnicos · navegação · contato ·
//         animações · console · inicialização
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
        { id: 'inspect', icon: 'magnifying-glass' },
        { id: 'loot', icon: 'file-arrow-down' },
        { id: 'polyglot', icon: 'language' },
        { id: 'contact', icon: 'envelope' },
        { id: 'konami', icon: 'gamepad', secret: true },
        { id: 'snake', icon: 'worm', secret: true },
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
        // Um diálogo aberto fica na camada de cima e cobriria a notificação: ela espera ele fechar
        const openDialog = $('dialog[open]');
        if (openDialog) {
            openDialog.addEventListener('close', () => showToast(id), { once: true });
            return;
        }
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

    // ---------- Snake (easter egg do celular de A Week to Remember) ----------
    function initSnake(dialog) {
        const lcd = $('.snake-lcd', dialog);
        const canvas = $('.snake-canvas', dialog);
        const ctx = canvas.getContext('2d');
        const msg = $('.js-snake-msg', dialog);
        const live = $('.js-snake-live', dialog);
        const scoreEl = $('.js-snake-score', dialog);
        const bestEl = $('.js-snake-best', dialog);

        const COLS = 20;
        const ROWS = 12;
        const CELL = canvas.width / COLS;
        const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
        // Setas, WASD e o teclado numérico do Nokia (2/4/6/8)
        const KEYS = {
            arrowup: 'up', w: 'up', 2: 'up',
            arrowdown: 'down', s: 'down', 8: 'down',
            arrowleft: 'left', a: 'left', 4: 'left',
            arrowright: 'right', d: 'right', 6: 'right',
        };

        let snake = [];
        let food = [0, 0];
        let dir = 'right';
        let queue = []; // viradas pedidas entre um passo e outro
        let score = 0;
        let best = Number(store.get('snake-best')) || 0;
        let state = 'idle'; // idle | play | paused | over
        let msgKey = 'snake-start';
        let timer = null;
        let overAt = 0;
        let touchStart = null;

        const pad = (n) => String(n).padStart(4, '0');

        function placeFood() {
            const free = [];
            for (let x = 0; x < COLS; x += 1) {
                for (let y = 0; y < ROWS; y += 1) {
                    if (!snake.some(([sx, sy]) => sx === x && sy === y)) free.push([x, y]);
                }
            }
            food = free.length ? free[Math.floor(Math.random() * free.length)] : [-1, -1];
        }

        function updateHud() {
            scoreEl.textContent = pad(score);
            bestEl.textContent = pad(best);
        }

        function draw() {
            const style = getComputedStyle(lcd);
            ctx.fillStyle = style.getPropertyValue('--lcd-bg').trim();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = style.getPropertyValue('--lcd-ink').trim();
            snake.forEach(([x, y]) => ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2));
            // Comida em "+", como no Nokia
            const [fx, fy] = food;
            ctx.fillRect(fx * CELL + 5, fy * CELL + 2, 4, CELL - 4);
            ctx.fillRect(fx * CELL + 2, fy * CELL + 5, CELL - 4, 4);
        }

        function reset() {
            snake = [[6, 6], [5, 6], [4, 6]];
            dir = 'right';
            queue = [];
            score = 0;
            placeFood();
            updateHud();
            draw();
        }

        function showMsg(key) {
            msgKey = key;
            msg.hidden = !key;
            if (!key) return;
            msg.textContent = key === 'snake-over'
                ? `${t('snake-over').replace('{n}', score)} ${t('snake-again')}`
                : t(key);
        }

        function tick() {
            if (queue.length) dir = queue.shift();
            const [dx, dy] = DIRS[dir];
            // Sem paredes: a cobra sai de um lado e entra do outro
            const head = [(snake[0][0] + dx + COLS) % COLS, (snake[0][1] + dy + ROWS) % ROWS];
            const eats = head[0] === food[0] && head[1] === food[1];
            const body = eats ? snake : snake.slice(0, -1); // sem comer, a cauda sai da frente
            if (body.some(([x, y]) => x === head[0] && y === head[1])) {
                gameOver();
                return;
            }
            snake = [head, ...body];
            if (eats) {
                score += 1;
                if (score > best) {
                    best = score;
                    store.set('snake-best', String(best));
                }
                if (score >= 5) unlock('snake');
                updateHud();
                placeFood();
            }
            draw();
            timer = setTimeout(tick, Math.max(80, 150 - score * 4));
        }

        function start() {
            if (state === 'over') {
                if (Date.now() - overAt < 400) return false; // não reinicia com a tecla que ainda estava apertada
                reset();
            }
            state = 'play';
            showMsg(null);
            clearTimeout(timer);
            timer = setTimeout(tick, 150);
            return true;
        }

        function pause() {
            if (state !== 'play') return;
            clearTimeout(timer);
            state = 'paused';
            showMsg('snake-paused');
        }

        function gameOver() {
            clearTimeout(timer);
            state = 'over';
            overAt = Date.now();
            showMsg('snake-over');
            live.textContent = msg.textContent;
        }

        function turn(next) {
            if (state !== 'play' && !start()) return;
            const last = queue.length ? queue[queue.length - 1] : dir;
            if (next === last || next === OPPOSITE[last]) return;
            if (queue.length < 2) queue.push(next);
        }

        dialog.addEventListener('keydown', (e) => {
            const next = KEYS[e.key.toLowerCase()];
            if (!next) return;
            e.preventDefault();
            turn(next);
        });
        $$('.snake-key', dialog).forEach((btn) => btn.addEventListener('click', () => turn(btn.dataset.dir)));

        // No celular: deslizar na tela vira, tocar começa
        lcd.addEventListener('touchstart', (e) => {
            touchStart = [e.touches[0].clientX, e.touches[0].clientY];
        }, { passive: true });
        lcd.addEventListener('touchend', (e) => {
            if (!touchStart) return;
            const dx = e.changedTouches[0].clientX - touchStart[0];
            const dy = e.changedTouches[0].clientY - touchStart[1];
            touchStart = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
                if (state !== 'play') start();
                return;
            }
            if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 'right' : 'left');
            else turn(dy > 0 ? 'down' : 'up');
        });

        dialog.addEventListener('close', () => {
            clearTimeout(timer);
            state = 'idle';
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause();
        });
        document.addEventListener('langchange', () => {
            if (msgKey) showMsg(msgKey);
        });

        return {
            open() {
                if (dialog.open) return;
                reset();
                state = 'idle';
                showMsg('snake-start');
                dialog.showModal();
            },
        };
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
    // Detalhes técnicos dos jogos
    $$('.js-open-tech').forEach((btn) => btn.addEventListener('click', () => {
        document.getElementById('tech-' + btn.dataset.tech)?.showModal();
        unlock('inspect');
    }));
    // Snake: pelo botão nos detalhes de A Week to Remember ou digitando "snake"
    const snakeDialog = $('#snake-dialog');
    const snakeGame = snakeDialog ? initSnake(snakeDialog) : null;
    $$('.js-open-snake').forEach((btn) => btn.addEventListener('click', () => snakeGame?.open()));
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

    // Konami e "snake" (teclado) e dica clicável no rodapé (celular)
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
        if (snakeDialog?.open) return; // durante o jogo, as teclas são do Snake
        typedKeys.push(e.key.toLowerCase());
        if (typedKeys.length > KONAMI.length) typedKeys.shift();
        if (typedKeys.join() === KONAMI.join()) {
            typedKeys.length = 0;
            toggleCRT();
        } else if (typedKeys.slice(-5).join('') === 'snake') {
            typedKeys.length = 0;
            snakeGame?.open();
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

    // ---------- Console: recado para devs ----------
    // bugReport() imita o bug report in-game de A Week to Remember: onde a pessoa está, a última fala e as specs
    window.bugReport = () => {
        const middle = window.innerHeight / 2;
        const section = $$('main section[id]').find((s) => {
            const box = s.getBoundingClientRect();
            return box.top <= middle && box.bottom >= middle;
        });
        const done = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
        console.log([
            'bug report · neonbrasil.github.io/cayque',
            `page: ${location.href}`,
            `section: #${section ? section.id : 'inicio'}`,
            `route: ${route} · lang: ${lang} · theme: ${root.dataset.theme}${root.classList.contains('crt') ? ' · crt' : ''}`,
            `last_line: "${$('.vn-text')?.textContent ?? ''}"`,
            `achievements: ${done}/${ACHIEVEMENTS.length}`,
            `viewport: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
            `user_agent: ${navigator.userAgent}`,
            `date: ${new Date().toISOString()}`,
        ].join('\n'));
        console.log(t('console-bug'));
    };
    console.log('%c' + t('console-hello'), 'font: 500 12px/1.6 "IBM Plex Mono", monospace; color: #F2762E');
})();
