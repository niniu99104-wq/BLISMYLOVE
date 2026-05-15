// ===== 小墨管家 script.js v2 =====

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw154_slWBUssHmoVsJQppcHRH6RDS1cETCdF8ex_SrO1o_UrL5dwIAwRPYVjK2O3eJrw/exec';

let mediaData = [];
let pendingDeleteTitle = null;

// DOM refs
const titleInput      = document.getElementById('title');
const platformSelect  = document.getElementById('platform');
const dynamicFields   = document.getElementById('dynamic-fields');
const submitBtn       = document.getElementById('submit-btn');
const submitText      = document.getElementById('submit-text');
const submitSpinner   = document.getElementById('submit-spinner');
const groupStatusDay  = document.getElementById('group-status-day');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect    = document.getElementById('status');
const loadingMsg      = document.getElementById('loading-msg');
const dateLabel       = document.getElementById('date-label');
const autocompleteList = document.getElementById('autocomplete-list');

// ───────────────────────────────────────────
// 🔔 Toast 通知（取代 alert）
// ───────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

// ───────────────────────────────────────────
// 🗓️ 日期工具
// ───────────────────────────────────────────
function formatTaiwanDate(isoStr) {
    if (!isoStr) return "";
    if (!isoStr.includes('T')) return isoStr;
    const d = new Date(isoStr);
    const tw = new Date(d.getTime() + 8 * 3600000);
    return `${tw.getUTCFullYear()}-${String(tw.getUTCMonth()+1).padStart(2,'0')}-${String(tw.getUTCDate()).padStart(2,'0')}`;
}

function calculateNextDate(twDateStr, cycle) {
    if (!twDateStr || !cycle || cycle === '#收藏品' || cycle === '#不定期連載') return "";
    const [y, m, d] = twDateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (cycle === '#十天一次連載') dt.setDate(dt.getDate() + 10);
    else if (cycle.includes('週')) dt.setDate(dt.getDate() + 7);
    else return "";
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function todayStr() {
    const now = new Date();
    return new Date(now - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = (new Date(dateStr) - new Date(todayStr())) / 86400000;
    return Math.round(diff);
}

function friendlyNextDate(nextDateStr) {
    if (!nextDateStr) return '';
    const d = daysUntil(nextDateStr);
    if (d < 0) return `⚠️ 可能已更新（${nextDateStr}）`;
    if (d === 0) return `🔥 今天更新！`;
    if (d === 1) return `⏰ 明天更新`;
    return `⏰ ${nextDateStr}（還有 ${d} 天）`;
}

// ───────────────────────────────────────────
// 📡 資料載入
// ───────────────────────────────────────────
async function loadData() {
    try {
        loadingMsg.style.display = 'flex';
        const res = await fetch(SCRIPT_URL);
        mediaData = await res.json();
        mediaData.reverse();
        renderAll();
        showUpdateBanner();
    } catch (e) {
        console.error('連線失敗', e);
        showToast('無法連線到資料庫，請稍後再試', 'error');
    } finally {
        loadingMsg.style.display = 'none';
    }
}

// ───────────────────────────────────────────
// 🔥 更新提醒 Banner（取代 alert）
// ───────────────────────────────────────────
function showUpdateBanner() {
    const today = todayStr();
    const todayDOW = new Date().getDay();
    const DOW_MAP = {"#週日連載":0,"#週一連載":1,"#週二連載":2,"#週三連載":3,"#週四連載":4,"#週五連載":5,"#週六連載":6};

    const updates = [];
    const unread = [];

    mediaData.forEach(item => {
        if (item.platform === '周邊商品') return;
        const isVideo = ['Netflix','gagaOOlala','愛奇藝','Disney+','實體電影院'].includes(item.platform);
        const cleanDate = formatTaiwanDate(item.customDate);
        const nextDate = calculateNextDate(cleanDate, item.updateDayLabel);
        const lastRead = Number(item.lastRead || 0);
        const mainTotal = Number(item.latestChapter || 0);
        const specTotal = Number(item.specialCount || 0);

        if (item.status === 'ongoing') {
            const isDue = (nextDate && today >= nextDate) ||
                (!item.customDate && item.updateDayLabel && !isVideo && DOW_MAP[item.updateDayLabel] === todayDOW);
            if (isDue) {
                updates.push(`${item.title} <span class="ac-plat">${item.platform}</span>`);
                return;
            }
        }
        if (lastRead > 0 && lastRead < mainTotal + specTotal) {
            const label = item.status === 'hiatus' ? ' [季休中]' : (item.status === 'completed' ? ' [已完結]' : '');
            unread.push(`${item.title}${label}（進度 ${lastRead}/${mainTotal}）`);
        }
    });

    const banner = document.getElementById('update-banner');
    const bannerList = document.getElementById('update-banner-list');
    let html = '';
    if (updates.length) html += updates.map(t => `📖 ${t}`).join('<br>');
    if (unread.length) {
        if (html) html += '<br>';
        html += `<span style="color:#888;font-size:0.8rem;">未讀：${unread.join('　')}</span>`;
    }
    if (html) {
        bannerList.innerHTML = html;
        banner.classList.remove('hidden');
    }
}

// ───────────────────────────────────────────
// 🎨 平台 CSS class
// ───────────────────────────────────────────
function getPlatformClass(p) {
    const map = {
        'bomtoon.tw':'plat-bomtoon','Webtoon':'plat-webtoon','鏡文學':'plat-mirror',
        'BW電子書':'plat-bw','gagaOOlala':'plat-gaga','Netflix':'plat-netflix',
        '愛奇藝':'plat-iqiyi','Disney+':'plat-disney','實體電影院':'plat-vieshow','周邊商品':'plat-merch'
    };
    return map[p] || 'plat-mirror';
}

// ───────────────────────────────────────────
// 🖊️ 表單欄位動態渲染
// ───────────────────────────────────────────
function updateFormFields() {
    if (!platformSelect || !dynamicFields) return;
    const p = platformSelect.value;
    const isSub   = ['Netflix','gagaOOlala','愛奇藝','Disney+'].includes(p);
    const isMovie = p === '實體電影院';
    const isMerch = p === '周邊商品';
    const isVideo = isSub || isMovie;
    const isComic = ['bomtoon.tw','Webtoon','鏡文學','BW電子書'].includes(p);

    if (submitBtn) submitBtn.className = `btn-submit ${getPlatformClass(p)}`;
    if (updateDaySelect) updateDaySelect.style.display = (isVideo || isMerch) ? 'none' : '';

    if (statusSelect) {
        if (isMovie) statusSelect.innerHTML = '<option value="watched">已觀影</option>';
        else if (isMerch) statusSelect.innerHTML = '<option value="ongoing">已下單 / 預購中</option><option value="completed">已收到 / 收藏中</option>';
        else statusSelect.innerHTML = '<option value="ongoing">正在追</option><option value="hiatus">季休中 / 待更新</option><option value="completed">已完結 / 封存</option>';
    }
    if (dateLabel) {
        dateLabel.textContent = isMerch ? '📅 購買日期：' : isVideo ? '📅 觀影日：' : '📅 最新更新日：';
    }

    let html = '';
    if (isMerch) {
        html = `<div class="form-row">
            <input type="number" id="cost" placeholder="商品單價（元）" min="0" required>
            <input type="number" id="count" placeholder="購入數量" min="1" required>
        </div>
        <div class="form-row">
            <input type="text" id="extra" placeholder="備註（店家、規格等）">
        </div>`;
    } else if (isComic) {
        html = `<div class="form-row">
            <input type="number" id="cost" placeholder="每話費用" min="0" required>
            <input type="number" id="count" placeholder="正文已購話數" min="0" required>
            <input type="number" id="specialPurchased" placeholder="外傳已購話數" min="0">
        </div>
        <div class="form-row">
            <input type="number" id="extra" placeholder="其他花費" min="0">
            <input type="number" id="lastRead" placeholder="目前進度（話）" min="0">
        </div>
        <div class="form-row">
            <input type="number" id="latestChapter" placeholder="正文總話數" min="0">
            <input type="number" id="specialCount" placeholder="外傳總話數" min="0">
        </div>`;
    } else if (isMovie) {
        html = `<div class="form-row">
            <input type="number" id="cost" placeholder="票價" min="0" required>
            <input type="number" id="count" placeholder="張數" min="1" required>
            <input type="number" id="extra" placeholder="其他花費" min="0">
        </div>`;
    } else if (isSub) {
        html = `<div class="form-row">
            <input type="number" id="cost" placeholder="額外花費" min="0" required>
            <input type="hidden" id="count" value="1">
            <input type="number" id="extra" placeholder="其他花費" min="0">
        </div>
        <div class="form-row">
            <input type="number" id="lastRead" placeholder="目前進度（集）" min="0">
            <input type="number" id="latestChapter" placeholder="最新集數" min="0">
        </div>`;
    }
    dynamicFields.innerHTML = html;
}

if (platformSelect) platformSelect.addEventListener('change', updateFormFields);
updateFormFields();

// ───────────────────────────────────────────
// 🔍 標題自動補全
// ───────────────────────────────────────────
let acIndex = -1;

titleInput?.addEventListener('input', () => {
    const val = titleInput.value.trim();
    if (!val) { autocompleteList.classList.add('hidden'); return; }
    const matches = mediaData.filter(d => d.title.includes(val)).slice(0, 8);
    if (!matches.length) { autocompleteList.classList.add('hidden'); return; }
    acIndex = -1;
    autocompleteList.innerHTML = matches.map(d =>
        `<li onclick="selectAutocomplete('${d.title.replace(/'/g, "\\'")}')">
            ${d.title} <span class="ac-plat">${d.platform}</span>
        </li>`
    ).join('');
    autocompleteList.classList.remove('hidden');
});

titleInput?.addEventListener('keydown', e => {
    const items = autocompleteList.querySelectorAll('li');
    if (!items.length || autocompleteList.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown') { acIndex = Math.min(acIndex + 1, items.length - 1); highlightAC(items); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { acIndex = Math.max(acIndex - 1, 0); highlightAC(items); e.preventDefault(); }
    else if (e.key === 'Enter' && acIndex >= 0) { e.preventDefault(); items[acIndex].click(); }
    else if (e.key === 'Escape') { autocompleteList.classList.add('hidden'); }
});

function highlightAC(items) {
    items.forEach((li, i) => li.classList.toggle('active', i === acIndex));
    if (acIndex >= 0) items[acIndex].scrollIntoView({ block: 'nearest' });
}

function selectAutocomplete(title) {
    titleInput.value = title;
    autocompleteList.classList.add('hidden');
    fillFormFromData(title);
}

document.addEventListener('click', e => {
    if (!e.target.closest('.title-autocomplete-wrap')) autocompleteList.classList.add('hidden');
});

// ───────────────────────────────────────────
// 📥 自動填入已存在的資料
// ───────────────────────────────────────────
titleInput?.addEventListener('blur', () => {
    const title = titleInput.value.trim();
    if (!title) return;
    // 若未選自動補全，也嘗試精確比對
    const existing = mediaData.find(d => d.title === title);
    if (existing) fillFormFromData(title);
});

function fillFormFromData(title) {
    const item = mediaData.find(d => d.title === title);
    if (!item) return;

    platformSelect.value = item.platform;
    updateFormFields();

    setTimeout(() => {
        if (statusSelect) statusSelect.value = item.status || 'ongoing';
        if (updateDaySelect) updateDaySelect.value = item.updateDayLabel || '#週一連載';

        const fields = ['cost','count','specialPurchased','extra','lastRead','latestChapter','specialCount'];
        fields.forEach(f => { const el = document.getElementById(f); if (el) el.value = item[f] || ''; });
        const dateEl = document.getElementById('customDate');
        if (dateEl && item.customDate) dateEl.value = formatTaiwanDate(item.customDate);

        showToast(`已載入「${title}」的現有資料`, 'info');
    }, 50);
}

// ───────────────────────────────────────────
// 🔍 篩選功能
// ───────────────────────────────────────────
function applyFilter() {
    const keyword = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const plat = document.getElementById('filter-platform')?.value || '';
    document.querySelectorAll('.card').forEach(card => {
        const titleEl = card.querySelector('.card-title');
        const platEl  = card.querySelector('.plat-tag');
        const titleMatch = !keyword || (titleEl?.textContent || '').toLowerCase().includes(keyword);
        const platMatch  = !plat || (platEl?.textContent || '').trim() === plat;
        card.style.display = (titleMatch && platMatch) ? '' : 'none';
    });
}

// ───────────────────────────────────────────
// 🖼️ 渲染所有卡片
// ───────────────────────────────────────────
function renderAll() {
    let totalC = 0, totalTWD = 0, totalMerch = 0;
    const today = todayStr();
    const todayDOW = new Date().getDay();
    const DOW_MAP = {"#週日連載":0,"#週一連載":1,"#週二連載":2,"#週三連載":3,"#週四連載":4,"#週五連載":5,"#週六連載":6};

    const lists = {
        update: document.getElementById('update-list'),
        ongoing: document.getElementById('ongoing-list'),
        completed: document.getElementById('completed-list'),
        merch: document.getElementById('merch-list')
    };
    Object.values(lists).forEach(l => { if (l) l.innerHTML = ''; });
    let updateCount = 0, ongoingCount = 0, merchCount = 0;

    mediaData.forEach(item => {
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isMerch   = item.platform === '周邊商品';
        const isVideo   = ['Netflix','gagaOOlala','愛奇藝','Disney+','實體電影院'].includes(item.platform);
        const isMovie   = item.platform === '實體電影院';
        const unit      = isBomtoon ? 'C' : '元';

        const cost      = Number(item.cost || 0);
        const count     = Number(item.count || 0);
        const specBought = Number(item.specialPurchased || 0);
        const extraVal  = Number(item.extra || 0);
        const itemTotal = (!isVideo && !isMerch)
            ? cost * (count + specBought) + extraVal
            : cost * count + (isMerch ? 0 : extraVal);

        if (isMerch) totalMerch += itemTotal;
        else if (isBomtoon) totalC += itemTotal;
        else totalTWD += itemTotal;

        const lastRead  = Number(item.lastRead || 0);
        const mainTotal = Number(item.latestChapter || 0);
        const specTotal = Number(item.specialCount || 0);
        const mainRead  = Math.min(lastRead, mainTotal);
        const totalLimit = mainTotal + specTotal;
        const hasUnread = lastRead < totalLimit && mainTotal > 0;

        // 進度條
        let progressHTML = '';
        if (!isMerch && !isMovie && mainTotal > 0) {
            const pct = Math.min(100, Math.round((mainRead / mainTotal) * 100));
            const isDone = pct >= 100;
            progressHTML = `
                <div class="progress-bar-wrap" title="${mainRead}/${mainTotal} ${isVideo?'集':'話'}">
                    <div class="progress-bar-fill ${isDone?'done':''}" style="width:${pct}%"></div>
                </div>
                <div class="progress-bar-pct">${mainRead} / ${mainTotal} ${isVideo?'集':'話'} (${pct}%)</div>`;
        }

        // 外傳標記
        let specHTML = '';
        if (!isMerch && specTotal > 0) {
            const specCost = cost * specBought;
            specHTML = `<div style="font-size:0.8rem;color:var(--text-sub);margin-top:2px;">外傳 ${specBought}/${specTotal} 話・${specCost} ${unit}</div>`;
        }

        // 未讀徽章
        const unreadBadge = hasUnread && lastRead > 0
            ? `<span class="unread-badge">未讀 ${totalLimit - lastRead}</span>` : '';

        // 日期區
        const cleanDate = formatTaiwanDate(item.customDate);
        const nextDate  = calculateNextDate(cleanDate, item.updateDayLabel);
        let dateHTML = '';
        if (isMerch && cleanDate) {
            dateHTML = `<div class="date-tag">🗓️ 入手：${cleanDate}</div>`;
        } else if (isVideo && cleanDate) {
            dateHTML = `<div class="date-tag">🗓️ 觀影：${cleanDate}</div>`;
        } else if (cleanDate) {
            dateHTML = `<div class="date-tag">🗓️ 最新更新：${cleanDate}</div>`;
            if (item.status === 'hiatus') {
                dateHTML += `<div class="hiatus-tag">⏸️ 季休中 / 待更新</div>`;
            } else if (nextDate) {
                dateHTML += `<div class="next-date-tag">${friendlyNextDate(nextDate)}</div>`;
            }
        }

        // 金額顯示 class
        const costClass = isMerch ? 'cost-merch' : isBomtoon ? 'cost-c' : 'cost-twd';

        // 商品數量或電影狀態
        let extraInfoHTML = '';
        if (isMerch) extraInfoHTML = `<div>數量：<b>${count}</b> 件${item.extra ? ` <span style="color:var(--text-sub)">(${item.extra})</span>` : ''}</div>`;
        if (isMovie) extraInfoHTML = `<div>狀態：<b>✅ 已觀影</b></div>`;

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="openDeleteModal('${item.title.replace(/'/g,"\\'")}')">×</button>
            <span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span>
            <span class="card-title">${item.title}${unreadBadge}</span>
            ${(!isVideo && !isMerch && item.updateDayLabel && item.updateDayLabel !== '#收藏品')
                ? `<div class="update-tag">${item.updateDayLabel}</div>` : ''}
            <div class="card-details">
                ${extraInfoHTML}
                ${progressHTML}
                ${specHTML}
                ${dateHTML}
            </div>
            <div class="card-cost ${costClass}">總投資：${itemTotal} ${unit}</div>
        `;

        // 更新提醒判定
        const isUpdateDue = item.status === 'ongoing' && (
            (nextDate && today >= nextDate) ||
            (!item.customDate && item.updateDayLabel && !isVideo && DOW_MAP[item.updateDayLabel] === todayDOW)
        );

        if (isMerch) { lists.merch.appendChild(card); merchCount++; }
        else if (item.status === 'completed' || item.status === 'watched' || isMovie) {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true)); ongoingCount++;
            if (isUpdateDue && hasUnread) {
                lists.update.appendChild(card.cloneNode(true)); updateCount++;
            }
        }
    });

    // 統計更新
    document.getElementById('total-c-coins').textContent = totalC;
    document.getElementById('total-twd').textContent = totalTWD;
    document.getElementById('total-merch').textContent = totalMerch;
    document.getElementById('update-count').textContent = updateCount;
    document.getElementById('ongoing-count').textContent = ongoingCount;
    document.getElementById('merch-count').textContent = merchCount;

    // 更新提醒 section 顯示
    document.getElementById('update-alert').classList.toggle('hidden', updateCount === 0);

    // 空狀態
    const showEmpty = (listId, emptyId) => {
        const list = document.getElementById(listId);
        const empty = document.getElementById(emptyId);
        if (list && empty) empty.classList.toggle('hidden', list.children.length > 0);
    };
    showEmpty('ongoing-list', 'ongoing-empty');
    showEmpty('completed-list', 'completed-empty');
    showEmpty('merch-list', 'merch-empty');
}

// ───────────────────────────────────────────
// 💾 表單提交
// ───────────────────────────────────────────
async function handleSubmit() {
    const title = titleInput?.value.trim();
    if (!title) { showToast('請輸入作品名稱', 'error'); titleInput?.focus(); return; }
    if (!document.getElementById('cost')?.value && document.getElementById('cost')) {
        showToast('請填寫費用欄位', 'error'); return;
    }

    const isMerch = platformSelect.value === '周邊商品';
    const isMovie = platformSelect.value === '實體電影院';
    const isVideoPlat = ['Netflix','gagaOOlala','愛奇藝','Disney+','實體電影院'].includes(platformSelect.value);

    const newItem = {
        title,
        platform: platformSelect.value,
        status: isMovie ? 'watched' : statusSelect.value,
        updateDayLabel: (isMerch || isVideoPlat) ? '#收藏品' : updateDaySelect.value,
        cost:             document.getElementById('cost')?.value || 0,
        count:            document.getElementById('count')?.value || 1,
        extra:            document.getElementById('extra')?.value || '',
        lastRead:         document.getElementById('lastRead')?.value || 0,
        latestChapter:    document.getElementById('latestChapter')?.value || 0,
        customDate:       document.getElementById('customDate')?.value || '',
        specialCount:     document.getElementById('specialCount')?.value || 0,
        specialPurchased: document.getElementById('specialPurchased')?.value || 0,
    };

    submitText.textContent = '同步中…';
    submitSpinner.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(newItem) });
        showToast(`「${title}」儲存成功！`, 'success');
        // 重置表單
        titleInput.value = '';
        document.getElementById('customDate').value = '';
        dynamicFields.innerHTML = '';
        updateFormFields();
        await loadData();
    } catch (err) {
        showToast('儲存失敗，請稍後再試', 'error');
    } finally {
        submitText.textContent = '確認儲存';
        submitSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// ───────────────────────────────────────────
// 🗑️ 刪除 Modal
// ───────────────────────────────────────────
function openDeleteModal(title) {
    pendingDeleteTitle = title;
    document.getElementById('modal-item-name').textContent = `「${title}」`;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('modal-confirm-btn').onclick = confirmDelete;
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    pendingDeleteTitle = null;
}

async function confirmDelete() {
    if (!pendingDeleteTitle) return;
    const title = pendingDeleteTitle;
    closeDeleteModal();
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', title }) });
        showToast(`「${title}」已刪除`, 'info');
        await loadData();
    } catch (e) {
        showToast('刪除失敗', 'error');
    }
}

// 點 Modal 背景關閉
document.getElementById('delete-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('delete-modal')) closeDeleteModal();
});

// ───────────────────────────────────────────
// 🚀 啟動
// ───────────────────────────────────────────
loadData();
