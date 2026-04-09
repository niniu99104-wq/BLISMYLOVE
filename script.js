// 👇 👇 👇 霓，請把你在 Google 取得的那串網址貼在下面引號裡面 👇 👇 👇
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1BXE2b1ySLjC3HgG1gSgRlW4cI2Y3PAmkxNu--9-KkF5xp-_isL-yRLeNH7h7vpvRQA/exec'; 

let mediaData = [];

const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');
const submitBtn = document.getElementById('submit-btn');
const groupStatusDay = document.getElementById('group-status-day');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect = document.getElementById('status');
const loadingMsg = document.getElementById('loading-msg');
const dateLabel = document.getElementById('date-label'); 

// 台灣時間轉換器：處理 Google 傳來的 T16:00:00.000Z，轉成精準的 YYYY-MM-DD
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

// 推算下次更新日
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
    } catch (error) { console.error('連線失敗'); }
    finally { loadingMsg.style.display = 'none'; }
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
    const isVideo = isSubPlatform || platform === '實體電影院';
    const isMovie = platform === '實體電影院';
    
    if (submitBtn) submitBtn.className = `btn-submit ${getPlatformClass(platform)}`;
    if (groupStatusDay) groupStatusDay.style.display = 'flex';
    if (updateDaySelect) updateDaySelect.style.display = isVideo ? 'none' : 'block';
    
    if (statusSelect) {
        if (isMovie) statusSelect.innerHTML = '<option value="watched">已觀影</option>';
        else statusSelect.innerHTML = '<option value="ongoing">正在追</option><option value="completed">已完結 / 封存</option>';
    }
    
    if (dateLabel) dateLabel.textContent = isVideo ? '📅 觀影日：' : '📅 最新更新日：';
    
    let htmlContent = '';
    if (platform === 'bomtoon.tw') {
        htmlContent = `
            <div class="form-group">
                <input type="number" id="cost" placeholder="每話幾C" min="0" required>
                <input type="number" id="count" placeholder="正文已購數" min="0" required>
                <input type="number" id="extra" placeholder="外傳總金額" value="0" min="0">
            </div>
            <div class="form-group">
                <input type="number" id="lastRead" placeholder="目前進度" min="0">
                <input type="number" id="latestChapter" placeholder="正文總話數" min="0">
                <input type="number" id="specialCount" placeholder="外傳話數" value="0" min="0">
            </div>`;
    } else if (isMovie) {
        htmlContent = `<div class="form-group"><input type="number" id="cost" placeholder="單張票價" min="0" required><input type="number" id="count" placeholder="電影票張數" value="1" min="1" required><input type="number" id="extra" placeholder="其他花費" value="0" min="0"></div>`;
    } else if (isSubPlatform) { 
        htmlContent = `<div class="form-group" style="margin-bottom: 5px;"><input type="number" id="cost" placeholder="額外花費" value="0" min="0" required><input type="hidden" id="count" value="1"><input type="number" id="extra" placeholder="其他花費" value="0" min="0"></div><div style="color: #888; font-size: 0.85rem; margin-bottom: 15px;">💡 追劇預設 0 元。若要紀錄月費，可單獨新增一筆「10月月費」。</div><div class="form-group"><input type="number" id="lastRead" placeholder="目前進度(集)" min="0"><input type="number" id="latestChapter" placeholder="最新進度(集)" min="0"></div>`;
    } else { 
        htmlContent = `<div class="form-group"><input type="number" id="cost" placeholder="單價(元)" min="0" required><input type="number" id="count" placeholder="正文已購數" min="0" required><input type="number" id="extra" placeholder="外傳總金額" value="0" min="0"></div><div class="form-group"><input type="number" id="lastRead" placeholder="目前進度" min="0"><input type="number" id="latestChapter" placeholder="正文本數" min="0"><input type="number" id="specialCount" placeholder="外傳數" value="0" min="0"></div>`;
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
        const itemTotal = (Number(item.cost) * Number(item.count)) + Number(item.extra);
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(item.platform);
        const isMovie = item.platform === '實體電影院';
        const unit = isVideo ? '集' : '話';
        if (isBomtoon) totalC += itemTotal; else totalTWD += itemTotal;

        // 進度分流顯示：正文 X/Y (+ 外傳 X/Y)
        let lastRead = Number(item.lastRead || 0);
        let mainTotal = Number(item.latestChapter || 0);
        let specialTotal = Number(item.specialCount || 0);
        
        let progressText = "";
        if (isMovie) {
            progressText = `狀態：<b>✅ 已觀影</b>`;
        } else {
            let mainRead = Math.min(lastRead, mainTotal);
            let specRead = Math.max(0, lastRead - mainTotal);
            progressText = `進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${mainRead}</b> / ${mainTotal} ${unit}`;
            if (specialTotal > 0) {
                progressText += ` <small>(+ <b style="color: var(--accent-c)">${specRead}</b> / ${specialTotal} 外傳)</small>`;
            }
        }

        let cleanDate = formatTaiwanDate(item.customDate);
        let nextDateStr = calculateNextDate(cleanDate, item.updateDayLabel);
        let dateTagHTML = '';
        if (isVideo && cleanDate) dateTagHTML = `<div style="margin-top: 8px;"><small style="color:#aaa;">🗓️ 觀影日：${cleanDate}</small></div>`;
        else if (!isVideo && cleanDate) {
            dateTagHTML = `<div style="margin-top: 8px;"><small style="color:#aaa;">🗓️ 最新更新：${cleanDate}</small></div>`;
            if (nextDateStr) dateTagHTML += `<div><small style="color:var(--accent-c); font-weight:bold; font-size:0.95rem;">⏰ 下次更新：${nextDateStr}</small></div>`;
        }

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `<button class="delete-btn" onclick="deleteItem('${item.title}')">×</button><span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span><br><span class="card-title">${item.title}</span>${(!isVideo && item.updateDayLabel) ? `<div class="update-tag">${item.updateDayLabel}</div>` : ''}<div class="card-details">${progressText}${dateTagHTML}</div><div class="card-cost ${isBomtoon ? 'cost-c' : 'cost-twd'}">${isBomtoon ? `總投資：${itemTotal} C` : `總支出：${itemTotal} 元`}</div>`;

        if (item.status === "completed" || item.status === "watched" || isMovie) {
            if (lists.completed) lists.completed.appendChild(card);
        } else {
            if (lists.ongoing) lists.ongoing.appendChild(card.cloneNode(true));
            let isUpdateDay = (nextDateStr && todayDateStr >= nextDateStr) || (!item.customDate && item.updateDayLabel && !isVideo && {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6}[item.updateDayLabel] === todayDayOfWeek);
            if (isUpdateDay && lastRead < (mainTotal + specialTotal)) {
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
    const platform = platformSelect.value;
    const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(platform);
    const newItem = {
        title: document.getElementById('title').value.trim(), platform: platform,
        status: (platform === '實體電影院') ? 'watched' : document.getElementById('status').value,
        updateDayLabel: isVideo ? null : document.getElementById('updateDay').value,
        cost: document.getElementById('cost')?.value || 0, count: document.getElementById('count')?.value || 1,
        extra: document.getElementById('extra')?.value || 0, lastRead: document.getElementById('lastRead')?.value || 0,
        latestChapter: document.getElementById('latestChapter')?.value || 0,
        customDate: document.getElementById('customDate')?.value || "",
        specialCount: document.getElementById('specialCount')?.value || 0
    };
    submitBtn.textContent = '雲端同步中...'; submitBtn.disabled = true;
    try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(newItem) }); await loadData(); e.target.reset(); updateFormFields(); }
    catch (error) { alert('儲存失敗'); } finally { submitBtn.textContent = '確認儲存'; submitBtn.disabled = false; }
});

async function deleteItem(title) { if(!confirm(`確定要刪除「${title}」嗎？`)) return; try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', title: title }) }); await loadData(); } catch (error) { alert('刪除失敗'); } }
loadData();
