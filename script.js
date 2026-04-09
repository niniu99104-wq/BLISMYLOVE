// 👇 👇 👇 霓，請把你在 Google 取得的那串網址貼在下面引號裡面 👇 👇 👇
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuOxN81iU7oqnto_y6FQ9K3KlfuVnLD1DTUoFxXDZUUMZKeqyNLs9r3T0h7VzFnmReiQ/exec'; 

let mediaData = [];

const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');
const submitBtn = document.getElementById('submit-btn');
const groupStatusDay = document.getElementById('group-status-day');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect = document.getElementById('status');
const loadingMsg = document.getElementById('loading-msg');

// 初始讀取 Google 試算表資料
async function loadData() {
    if (SCRIPT_URL.includes('請在這裡貼上')) {
        alert('你還沒有貼上 Google Apps Script 網址喔！');
        return;
    }
    try {
        loadingMsg.style.display = 'block';
        const response = await fetch(SCRIPT_URL);
        mediaData = await response.json();
        // 陣列反轉，讓試算表最新的資料排在上面
        mediaData.reverse(); 
        renderAll();
    } catch (error) {
        alert('無法連線到資料庫，請檢查網址或網路狀態。');
    } finally {
        loadingMsg.style.display = 'none';
    }
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
        if (isMovie) {
            statusSelect.innerHTML = '<option value="watched">已觀影</option>';
        } else {
            statusSelect.innerHTML = `
                <option value="ongoing">正在追</option>
                <option value="completed">已完結 / 封存</option>
            `;
        }
    }
    
    let htmlContent = '';

    if (platform === 'bomtoon.tw') {
        htmlContent = `
            <div class="form-group">
                <input type="number" id="cost" placeholder="每話 幾 C (例: 4)" min="0" required>
                <input type="number" id="count" placeholder="已購買話數" min="0" required>
                <input type="number" id="extra" placeholder="額外花費 (幾 C)" value="0" min="0">
            </div>
            <div class="form-group">
                <input type="number" id="lastRead" placeholder="目前看到第幾話/次" min="0">
                <input type="number" id="latestChapter" placeholder="平台更新至第幾話" min="0">
            </div>`;
    } else if (isMovie) {
        htmlContent = `
            <div class="form-group">
                <input type="number" id="cost" placeholder="單張票價 (元)" min="0" required>
                <input type="number" id="count" placeholder="電影票張數" value="1" min="1" required>
                <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
            </div>`;
    } else if (isSubPlatform) { 
        htmlContent = `
            <div class="form-group" style="margin-bottom: 5px;">
                <input type="number" id="cost" placeholder="此劇額外花費 (通常為 0)" value="0" min="0" required>
                <input type="hidden" id="count" value="1">
                <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
            </div>
            <div style="color: #888; font-size: 0.85rem; margin-bottom: 15px; padding-left: 5px;">
                💡 記帳建議：追劇成本預設為 0 以免重複計算。若要紀錄月費，可單獨新增一筆「10月月費」即可。
            </div>
            <div class="form-group">
                <input type="number" id="lastRead" placeholder="目前看到第幾集/次" min="0">
                <input type="number" id="latestChapter" placeholder="平台更新至第幾集" min="0">
            </div>`;
    } else { 
        htmlContent = `
            <div class="form-group">
                <input type="number" id="cost" placeholder="單價 (元)" min="0" required>
                <input type="number" id="count" placeholder="已購話數/本數" min="0" required>
                <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
            </div>
            <div class="form-group">
                <input type="number" id="lastRead" placeholder="目前看到第幾話/次" min="0">
                <input type="number" id="latestChapter" placeholder="平台更新至第幾話" min="0">
            </div>`;
    }

    dynamicFields.innerHTML = htmlContent;
}

if (platformSelect) platformSelect.addEventListener('change', updateFormFields);
updateFormFields();

function renderAll() {
    let totalC = 0;
    let totalTWD = 0;
    const today = new Date().getDay();
    
    const lists = { update: document.getElementById("update-list"), ongoing: document.getElementById("ongoing-list"), completed: document.getElementById("completed-list") };
    if (!lists.ongoing) return;
    Object.values(lists).forEach(l => { if (l) l.innerHTML = ""; });
    
    let hasUpdates = false;

    mediaData.forEach((item) => {
        const itemTotal = (Number(item.cost) * Number(item.count)) + Number(item.extra);
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(item.platform);
        const isMovie = item.platform === '實體電影院';
        const unit = isVideo ? '集' : '話';
        
        if (isBomtoon) totalC += itemTotal;
        else totalTWD += itemTotal;

        let progressText = isMovie 
            ? `狀態：<b style="color: var(--text-main)">✅ 已觀影</b>` 
            : `進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${item.lastRead || 0}</b> / ${item.latestChapter || 0} ${unit}`;

        const card = document.createElement('li');
        card.className = 'card';
        // 因為資料現在由試算表主導，我們透過 title 當作刪除的依據
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem('${item.title}')">×</button>
            <span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span><br>
            <span class="card-title">${item.title}</span>
            ${(!isVideo && item.updateDayLabel) ? `<span class="update-tag">${item.updateDayLabel}</span>` : ''}
            <div class="card-details">
                ${progressText}<br>
                <small style="color:#666">${isMovie ? '電影票張數' : '已購基礎數'}：${item.count}</small>
            </div>
            <div class="card-cost ${isBomtoon ? 'cost-c' : 'cost-twd'}">
                ${isBomtoon ? `總花費：${itemTotal} C` : `總支出：${itemTotal} 元`}
            </div>
        `;

        if (item.status === "completed" || item.status === "watched" || isMovie) {
            if (lists.completed) lists.completed.appendChild(card);
        } else {
            if (lists.ongoing) lists.ongoing.appendChild(card.cloneNode(true));
            
            if (!isVideo) {
                const dayMap = {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6};
                const isToday = item.updateDayLabel ? dayMap[item.updateDayLabel] === today : false;
                if ((isToday || item.updateDayLabel === "#十天一次連載") && Number(item.lastRead || 0) < Number(item.latestChapter || 0)) {
                    if (lists.update) lists.update.appendChild(card.cloneNode(true));
                    hasUpdates = true;
                }
            }
        }
    });

    const totalCElement = document.getElementById("total-c-coins");
    const totalTWDElement = document.getElementById("total-twd");
    const updateAlert = document.getElementById("update-alert");

    if (totalCElement) totalCElement.textContent = totalC;
    if (totalTWDElement) totalTWDElement.textContent = totalTWD;
    if (updateAlert) updateAlert.classList.toggle("hidden", !hasUpdates);
}

// 送出表單並同步至雲端
const mediaForm = document.getElementById('media-form');
if (mediaForm) {
    mediaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        const platform = platformSelect.value;
        const isVideo = ['Netflix', 'gagaOOlala', '愛奇藝', 'Disney+', '實體電影院'].includes(platform);
        const isMovie = platform === '實體電影院';
        
        const lastReadVal = document.getElementById('lastRead')?.value || 0;
        const latestChapterVal = document.getElementById('latestChapter')?.value || 0;

        const newItem = {
            title: title,
            platform: platform,
            status: isMovie ? 'watched' : (statusSelect ? statusSelect.value : 'ongoing'),
            updateDayLabel: isVideo ? null : (updateDaySelect ? updateDaySelect.value : null),
            cost: document.getElementById('cost')?.value || 0,
            count: document.getElementById('count')?.value || 1,
            extra: document.getElementById('extra')?.value || 0,
            lastRead: isMovie ? 1 : lastReadVal,
            latestChapter: isMovie ? 1 : latestChapterVal
        };

        // UI 狀態改變：提示正在儲存
        submitBtn.textContent = '雲端同步中...';
        submitBtn.disabled = true;

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(newItem)
            });
            
            // 寫入成功後更新本地畫面
            const existingIndex = mediaData.findIndex(item => item.title === title);
            if (existingIndex !== -1) mediaData[existingIndex] = newItem;
            else mediaData.unshift(newItem); 
            
            renderAll();
            e.target.reset();
            updateFormFields(); 
        } catch (error) {
            alert('儲存失敗，請確認網路連線。');
        } finally {
            submitBtn.textContent = '確認儲存';
            submitBtn.disabled = false;
        }
    });
}

// 刪除雲端資料
async function deleteItem(title) {
    if(!confirm('確定要將這筆紀錄從雲端刪除嗎？')) return;
    
    try {
        loadingMsg.style.display = 'block';
        loadingMsg.textContent = '🗑️ 正在從雲端刪除...';
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', title: title })
        });
        
        mediaData = mediaData.filter(item => item.title !== title);
        renderAll();
    } catch (error) {
        alert('刪除失敗');
    } finally {
        loadingMsg.style.display = 'none';
        loadingMsg.textContent = '⏳ 正在與 Google 資料庫同步中，請稍候...';
    }
}

// 啟動程式：讀取資料庫
loadData();
