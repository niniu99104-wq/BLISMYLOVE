let mediaData = JSON.parse(localStorage.getItem('bl_tracker_data')) || [];

const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');
const submitBtn = document.getElementById('submit-btn');
const groupStatusDay = document.getElementById('group-status-day');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect = document.getElementById('status');

// 取得平台對應的 CSS class
function getPlatformClass(platformName) {
    switch(platformName) {
        case 'bomtoon.tw': return 'plat-bomtoon';
        case 'Webtoon': return 'plat-webtoon';
        case '鏡文學': return 'plat-mirror';
        case 'BW電子書': return 'plat-bw';
        case 'gagaOOlala': return 'plat-gaga';
        case 'Netflix': return 'plat-netflix';
        case '實體電影院': return 'plat-vieshow';
        default: return 'plat-mirror';
    }
}

// 根據平台動態生成對應的 HTML 輸入框與選單狀態
function updateFormFields() {
    const platform = platformSelect.value;
    const isVideo = ['Netflix', 'gagaOOlala', '實體電影院'].includes(platform);
    const isMovie = platform === '實體電影院';
    
    // 按鈕變色
    submitBtn.className = `btn-submit ${getPlatformClass(platform)}`;
    
    // 狀態與連載日的顯示邏輯
    if (isMovie) {
        groupStatusDay.style.display = 'flex';
        updateDaySelect.style.display = 'none'; // 隱藏連載日
        statusSelect.innerHTML = '<option value="watched">已觀影</option>'; // 鎖定狀態為已觀影
    } else {
        groupStatusDay.style.display = 'flex';
        updateDaySelect.style.display = isVideo ? 'none' : 'block'; // 影視類隱藏連載日
        statusSelect.innerHTML = `
            <option value="ongoing">正在追</option>
            <option value="completed">已完結 / 封存</option>
        `; // 恢復一般狀態選項
    }
    
    // 動態生成輸入欄位
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
    } else if (isVideo) { 
        htmlContent = `
            <div class="form-group">
                <input type="number" id="cost" placeholder="月/年費支出 (元)" value="0" min="0" required>
                <input type="hidden" id="count" value="1">
                <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
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

platformSelect.addEventListener('change', updateFormFields);
updateFormFields();

function saveData() {
    localStorage.setItem('bl_tracker_data', JSON.stringify(mediaData));
    renderAll();
}

function renderAll() {
    let totalC = 0;
    let totalTWD = 0;
    const today = new Date().getDay();
    
    const lists = { update: document.getElementById("update-list"), ongoing: document.getElementById("ongoing-list"), completed: document.getElementById("completed-list") };
    Object.values(lists).forEach(l => l.innerHTML = "");
    let hasUpdates = false;

    mediaData.forEach((item, index) => {
        const itemTotal = (Number(item.cost) * Number(item.count)) + Number(item.extra);
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isVideo = ['Netflix', 'gagaOOlala', '實體電影院'].includes(item.platform);
        const isMovie = item.platform === '實體電影院';
        const unit = isVideo ? '集' : '話';
        
        if (isBomtoon) totalC += itemTotal;
        else totalTWD += itemTotal;

        let progressText = isMovie 
            ? `狀態：<b style="color: var(--text-main)">✅ 已觀影</b>` 
            : `進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${item.lastRead || 0}</b> / ${item.latestChapter || 0} ${unit}`;

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${index})">×</button>
            <span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span><br>
            <span class="card-title">${item.title}</span>
            ${(!isVideo && item.updateDayLabel) ? `<span class="update-tag">${item.updateDayLabel}</span>` : ''}
            <div class="card-details">
                ${progressText}<br>
                <small style="color:#666">已購基礎數/張數：${item.count}</small>
            </div>
            <div class="card-cost ${isBomtoon ? 'cost-c' : 'cost-twd'}">
                ${isBomtoon ? `總花費：${itemTotal} C` : `總支出：${itemTotal} 元`}
            </div>
        `;

        // 完結、已觀影都會收進戰績區
        if (item.status === "completed" || item.status === "watched" || isMovie) {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            
            if (!isVideo) {
                const dayMap = {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6};
                const isToday = dayMap[item.updateDayLabel] === today;
                if ((isToday || item.updateDayLabel === "#十天一次連載") && Number(item.lastRead || 0) < Number(item.latestChapter || 0)) {
                    lists.update.appendChild(card.cloneNode(true));
                    hasUpdates = true;
                }
            }
        }
    });

    document.getElementById("total-c-coins").textContent = totalC;
    document.getElementById("total-twd").textContent = totalTWD;
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

document.getElementById('media-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const platform = platformSelect.value;
    const isVideo = ['Netflix', 'gagaOOlala', '實體電影院'].includes(platform);
    const isMovie = platform === '實體電影院';
    
    const lastReadVal = document.getElementById('lastRead')?.value || 0;
    const latestChapterVal = document.getElementById('latestChapter')?.value || 0;

    const newItem = {
        title: title,
        platform: platform,
        status: isMovie ? 'watched' : document.getElementById('status').value,
        updateDayLabel: isVideo ? null : document.getElementById('updateDay').value,
        cost: document.getElementById('cost').value || 0,
        count: document.getElementById('count').value || 0,
        extra: document.getElementById('extra').value || 0,
        lastRead: isMovie ? 1 : lastReadVal,
        latestChapter: isMovie ? 1 : latestChapterVal
    };

    const existingIndex = mediaData.findIndex(item => item.title === title);
    if (existingIndex !== -1) mediaData[existingIndex] = newItem;
    else mediaData.unshift(newItem); 
    
    saveData();
    e.target.reset();
    updateFormFields(); 
});

function deleteItem(index) {
    if(confirm('要刪除這筆紀錄嗎？')) { mediaData.splice(index, 1); saveData(); }
}

document.getElementById('clear-data').addEventListener('click', () => {
    if(confirm('注意：清空後資料無法恢復，確定嗎？')) { localStorage.removeItem('bl_tracker_data'); location.reload(); }
});

renderAll();
