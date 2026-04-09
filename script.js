const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw154_slWBUssHmoVsJQppcHRH6RDS1cETCdF8ex_SrO1o_UrL5dwIAwRPYVjK2O3eJrw/exec'; 

let mediaData = [];
const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');
const submitBtn = document.getElementById('submit-btn');
const groupStatusDay = document.getElementById('group-status-day');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect = document.getElementById('status');
const loadingMsg = document.getElementById('loading-msg');
const dateLabel = document.getElementById('date-label'); 

function formatTaiwanDate(isoStr) {
    if (!isoStr) return "";
    if (!isoStr.includes('T')) return isoStr; 
    let d = new Date(isoStr);
    let twTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
    let y = twTime.getUTCFullYear();
    let m = String(twTime.getUTCMonth() + 1).padStart(2, '0');
    let day = String(twTime.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function calculateNextDate(twDateStr, cycle) {
    if (!twDateStr || !cycle) return "";
    let parts = twDateStr.split('-');
    if (parts.length !== 3) return "";
    let d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (cycle === '#十天一次連載') d.setDate(d.getDate() + 10);
    else if (cycle.includes('週')) d.setDate(d.getDate() + 7);
    else return "";
    let y = d.getFullYear();
    let m = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

async function loadData() {
    try {
        loadingMsg.style.display = 'block';
        const response = await fetch(SCRIPT_URL);
        mediaData = await response.json();
        mediaData.reverse(); 
        renderAll();
        checkTodayUpdates();
    } catch (error) { console.error('連線失敗'); }
    finally { loadingMsg.style.display = 'none'; }
}

function checkTodayUpdates() {
    const now = new Date();
    const todayDayOfWeek = now.getDay(); 
    const offset = now.getTimezoneOffset() * 60000;
    const todayDateStr = (new Date(now - offset)).toISOString().split('T')[0];
    let todayUpdateTitles = [];
    let unfinishedTitles = [];

    mediaData.forEach((item) => {
        if (item.status === 'completed' || item.status === 'watched' || item.status === 'hiatus') return;
        let cleanDate = formatTaiwanDate(item.customDate);
        let nextDateStr = calculateNextDate(cleanDate, item.updateDayLabel);
        const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(item.platform);
        let lastRead = Number(item.lastRead || 0);
        let mainTotal = Number(item.latestChapter || 0);
        let specialTotal = Number(item.specialCount || 0);
        let totalLimit = mainTotal + specialTotal;
        const hasUnread = lastRead < totalLimit;
        
        let isUpdateDue = false;
        if (nextDateStr && todayDateStr >= nextDateStr) isUpdateDue = true;
        if (!item.customDate && item.updateDayLabel && !isVideo) {
            const dayMap = {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6};
            if (dayMap[item.updateDayLabel] === todayDayOfWeek) isUpdateDue = true;
        }
        if (isUpdateDue) todayUpdateTitles.push(`- ${item.title} (${item.platform})`);
        else if (lastRead > 0 && hasUnread) unfinishedTitles.push(`- ${item.title} (進度：${lastRead}/${mainTotal})`);
    });

    let message = "";
    if (todayUpdateTitles.length > 0) message += `🔥 今日新菜上桌：\n${todayUpdateTitles.join('\n')}\n\n`;
    if (unfinishedTitles.length > 0) message += `📖 這些還沒看完喔：\n${unfinishedTitles.join('\n')}\n\n`;
    if (message !== "") alert(`🔔 小墨管家巡邏報告：\n\n${message}睡前補充糧食！`);
}

function getPlatformClass(platformName) {
    switch(platformName) {
        case 'bomtoon.tw': return 'plat-bomtoon';
        case 'Webtoon': return 'plat-webtoon';
        case '鏡文學': return 'plat-mirror';
        case 'BW電子書': return 'plat-bw';
        case 'gagaOOlala': return 'plat-gaga';
        case 'Netflix': return 'plat-netflix';
        case '愛奇藝': return 'plat-iqiyi';
        case 'Disney+': return 'plat-disney';
        case '實體電影院': return 'plat-vieshow';
        default: return 'plat-mirror';
    }
}

function updateFormFields() {
    if (!platformSelect || !dynamicFields) return;
    const platform = platformSelect.value;
    const isSubPlatform = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+'].includes(platform);
    const isMovie = platform === '實體電影院';
    const isVideo = isSubPlatform || isMovie;
    
    if (submitBtn) submitBtn.className = `btn-submit ${getPlatformClass(platform)}`;
    if (groupStatusDay) groupStatusDay.style.display = 'flex';
    if (updateDaySelect) updateDaySelect.style.display = isVideo ? 'none' : 'block';
    if (statusSelect) {
        if (isMovie) statusSelect.innerHTML = '<option value="watched">已觀影</option>';
        else statusSelect.innerHTML = '<option value="ongoing">正在追</option><option value="hiatus">季休中 / 待更新</option><option value="completed">已完結 / 封存</option>';
    }
    if (dateLabel) dateLabel.textContent = isVideo ? '📅 觀影日：' : '📅 最新更新日：';
    
    let htmlContent = '';
    if (platform === 'bomtoon.tw') {
        htmlContent = `<div class="form-group"><input type="number" id="cost" placeholder="每話幾C" min="0" required><input type="number" id="count" placeholder="正文已購數" min="0" required><input type="number" id="specialPurchased" placeholder="外傳已購數" min="0"></div><div class="form-group"><input type="number" id="extra" placeholder="其他花費(周邊)" min="0"><input type="number" id="lastRead" placeholder="目前進度" min="0"></div><div class="form-group"><input type="number" id="latestChapter" placeholder="正文總話數" min="0"><input type="number" id="specialCount" placeholder="外傳總話數" min="0"></div>`;
    } else if (isMovie) {
        htmlContent = `<div class="form-group"><input type="number" id="cost" placeholder="單價" min="0" required><input type="number" id="count" placeholder="張數" min="1" required><input type="number" id="extra" placeholder="其他花費" min="0"></div>`;
    } else if (isSubPlatform) { 
        htmlContent = `<div class="form-group" style="margin-bottom: 5px;"><input type="number" id="cost" placeholder="額外花費" min="0" required><input type="hidden" id="count" value="1"><input type="number" id="extra" placeholder="其他花費" min="0"></div><div class="form-group"><input type="number" id="lastRead" placeholder="目前進度(集)" min="0"><input type="number" id="latestChapter" placeholder="最新進度(集)" min="0"></div>`;
    } else { 
        htmlContent = `<div class="form-group"><input type="number" id="cost" placeholder="單價(元)" min="0" required><input type="number" id="count" placeholder="正文已購數" min="0" required><input type="number" id="specialPurchased" placeholder="外傳已購數" min="0"></div><div class="form-group"><input type="number" id="extra" placeholder="其他花費" min="0"><input type="number" id="lastRead" placeholder="目前進度" min="0"></div><div class="form-group"><input type="number" id="latestChapter" placeholder="正文本數" min="0"><input type="number" id="specialCount" placeholder="外傳數" min="0"></div>`;
    }
    dynamicFields.innerHTML = htmlContent;
}

if (platformSelect) platformSelect.addEventListener('change', updateFormFields);
updateFormFields();

function renderAll() {
    let totalC = 0, totalTWD = 0;
    const now = new Date();
    const todayDayOfWeek = now.getDay(); 
    const offset = now.getTimezoneOffset() * 60000;
    const todayDateStr = (new Date(now - offset)).toISOString().split('T')[0];
    const lists = { update: document.getElementById("update-list"), ongoing: document.getElementById("ongoing-list"), completed: document.getElementById("completed-list") };
    Object.values(lists).forEach(l => { if (l) l.innerHTML = ""; });
    let hasUpdates = false;

    mediaData.forEach((item) => {
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(item.platform);
        const isMovie = item.platform === '實體電影院';
        const currencyUnit = isBomtoon ? 'C' : '元';
        let cost = Number(item.cost || 0);
        let count = Number(item.count || 0);
        let extraCost = Number(item.extra || 0);
        let specBought = Number(item.specialPurchased || 0);
        let specialTotal = Number(item.specialCount || 0);
        
        let itemTotal = (!isVideo && !isMovie) ? (cost * (count + specBought)) + extraCost : (cost * count) + extraCost;
        if (isBomtoon) totalC += itemTotal; else totalTWD += itemTotal;

        let lastRead = Number(item.lastRead || 0);
        let mainTotal = Number(item.latestChapter || 0);
        let mainRead = Math.min(lastRead, mainTotal);
        let progressText = isMovie ? `狀態：<b>✅ 已觀影</b>` : `進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${mainRead}</b> / ${mainTotal} ${isVideo?'集':'話'}`;
        
        if (specialTotal > 0 || specBought > 0) {
            let specialCost = cost * specBought;
            progressText += ` <small>(+ <b style="color: var(--accent-c)">${specialCost} ${currencyUnit}</b> / ${specialTotal} 外傳)</small>`;
        }

        let cleanDate = formatTaiwanDate(item.customDate);
        let nextDateStr = calculateNextDate(cleanDate, item.updateDayLabel);
        
        // 這裡改寫日期顯示邏輯
        let dateTagHTML = '';
        if (isVideo && cleanDate) {
            dateTagHTML = `<div style="margin-top: 8px;"><small style="color:#aaa;">🗓️ 觀影日：${cleanDate}</small></div>`;
        } else if (!isVideo) {
            if (cleanDate) {
                dateTagHTML += `<div style="margin-top: 8px;"><small style="color:#aaa;">🗓️ 最新更新：${cleanDate}</small></div>`;
            }
            // 判斷是否為季休
            if (item.status === 'hiatus') {
                dateTagHTML += `<div><small style="color:#aaa; font-weight:bold;">⏰ 下次更新：季休中 / 待更新</small></div>`;
            } else if (nextDateStr) {
                dateTagHTML += `<div><small style="color:var(--accent-c); font-weight:bold;">⏰ 下次更新：${nextDateStr}</small></div>`;
            }
        }

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `<button class="delete-btn" onclick="deleteItem('${item.title}')">×</button><span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span><br><span class="card-title">${item.title}</span>${(!isVideo && item.updateDayLabel) ? `<div class="update-tag">${item.updateDayLabel}</div>` : ''}<div class="card-details">${progressText}${dateTagHTML}</div><div class="card-cost ${isBomtoon ? 'cost-c' : 'cost-twd'}">總投資：${itemTotal} ${currencyUnit}</div>`;

        if (item.status === "completed" || item.status === "watched" || isMovie) lists.completed.appendChild(card);
        else {
            lists.ongoing.appendChild(card.cloneNode(true));
            let isUpdateDue = (nextDateStr && todayDateStr >= nextDateStr) || (!item.customDate && item.updateDayLabel && !isVideo && {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6}[item.updateDayLabel] === todayDayOfWeek);
            if (isUpdateDue && lastRead < (mainTotal + specialTotal) && item.status !== 'hiatus') {
                if (lists.update) lists.update.appendChild(card.cloneNode(true));
                hasUpdates = true;
            }
        }
    });
    document.getElementById("total-c-coins").textContent = totalC;
    document.getElementById("total-twd").textContent = totalTWD;
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

document.getElementById('media-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newItem = {
        title: document.getElementById('title').value.trim(), platform: platformSelect.value,
        status: (platformSelect.value === '實體電影院') ? 'watched' : document.getElementById('status').value,
        updateDayLabel: (['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(platformSelect.value)) ? null : document.getElementById('updateDay').value,
        cost: document.getElementById('cost')?.value || 0, count: document.getElementById('count')?.value || 1,
        extra: document.getElementById('extra')?.value || 0, lastRead: document.getElementById('lastRead')?.value || 0,
        latestChapter: document.getElementById('latestChapter')?.value || 0,
        customDate: document.getElementById('customDate')?.value || "",
        specialCount: document.getElementById('specialCount')?.value || 0,
        specialPurchased: document.getElementById('specialPurchased')?.value || 0
    };
    submitBtn.textContent = '雲端同步中...'; submitBtn.disabled = true;
    try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(newItem) }); await loadData(); e.target.reset(); updateFormFields(); }
    catch (error) { alert('儲存失敗'); } finally { submitBtn.textContent = '確認儲存'; submitBtn.disabled = false; }
});

async function deleteItem(title) { if(!confirm(`確定要刪除「${title}」嗎？`)) return; try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', title: title }) }); await loadData(); } catch (error) { alert('刪除失敗'); } }
loadData();
