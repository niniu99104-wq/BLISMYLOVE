let mediaData = JSON.parse(localStorage.getItem('bl_tracker_data')) || [];

const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');
const submitBtn = document.getElementById('submit-btn');

const groupStatusDay = document.getElementById('group-status-day');
const groupProgress = document.getElementById('group-progress');
const updateDaySelect = document.getElementById('updateDay');
const statusSelect = document.getElementById('status');
const lastReadInput = document.getElementById('lastRead');
const latestChapterInput = document.getElementById('latestChapter');

// 取得平台對應的 CSS class
function getPlatformClass(platformName) {
    switch(platformName) {
        case 'bomtoon.tw': return 'plat-bomtoon';
        case 'Webtoon': return 'plat-webtoon';
        case '鏡文學': return 'plat-mirror';
        case 'BW電子書': return 'plat-bw';
        case 'gagaOOlala': return 'plat-gaga';
        case 'Netflix': return 'plat-netflix';
        case '電影院（實體）': return 'plat-vieshow';
        default: return 'plat-mirror';
    }
}

// 根據平台動態切換輸入欄位、按鈕顏色、單位與連載日
function updateFormFields() {
    const platform = platformSelect.value;
    const isVideo = ['Netflix', 'gagaOOlala', '電影院（實體）'].includes(platform);
    const isMovie = platform === '電影院（實體）';
    
    // 按鈕跟著變色
    submitBtn.className = `btn-submit ${getPlatformClass(platform)}`;
    
    // 電影院特殊處理：不顯示連載日、不顯示進度、狀態強制設為完結
    if (isMovie) {
        groupStatusDay.style.display = 'none';
        groupProgress.style.display = 'none';
        statusSelect.value = 'completed';
    } else {
        groupStatusDay.style.display = 'flex';
        groupProgress.style.display = 'flex';
        
        // 影視平台隱藏連載日，並改變進度欄位文字
        if (isVideo) {
            updateDaySelect.style.display = 'none';
            lastReadInput.placeholder = "目前看到第幾集/次";
            latestChapterInput.placeholder = "平台更新至第幾集";
        } else {
            updateDaySelect.style.display = 'block';
            lastReadInput.placeholder = "目前看到第幾話/次";
            latestChapterInput.placeholder = "平台更新至第幾話";
        }
    }
    
    if (platform === 'bomtoon.tw') {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="每話 幾 C (例: 4)" min="0" required>
            <input type="number" id="count" placeholder="已購買話數" min="0" required>
            <input type="number" id="extra" placeholder="額外花費 (幾 C)" value="0" min="0">
        `;
    } else if (isMovie) {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="單張票價 (元)" min="0" required>
            <input type="number" id="count" placeholder="觀看張數" value="1" min="1" required>
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    } else if (['Netflix', 'gagaOOlala'].includes(platform)) {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="月/年費支出 (元)" value="0" min="0" required>
            <input type="hidden" id="count" value="1">
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    } else {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="單價 (元)" min="0" required>
            <input type="number" id="count" placeholder="已購話數/本數" min="0" required>
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    }
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
        const isVideo = ['Netflix', 'gagaOOlala', '電影院（實體）'].includes(item.platform);
        const isMovie = item.platform === '電影院（實體）';
        const unit = isVideo ? '集' : '話';
        
        if (isBomtoon) totalC += itemTotal;
        else totalTWD += itemTotal;

        // 電影院與一般作品的文字顯示差異
        let progressText = '';
        if (isMovie) {
            progressText = `狀態：<b style="color: var(--text-main)">✅ 已觀影</b>`;
        } else {
            progressText = `進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${item.lastRead || 0}</b> / ${item.latestChapter || 0} ${unit}`;
        }

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

        // 狀態分流
        if (item.status === "completed" || isMovie) {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            
            // 影視類不參與「今日更新提醒」，純看漫畫
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
    const isVideo = ['Netflix', 'gagaOOlala', '電影院（實體）'].includes(platform);
    const isMovie = platform === '電影院（實體）';
    
    const newItem = {
        title: title,
        platform: platform,
        status: isMovie ? 'completed' : document.getElementById('status').value,
        updateDayLabel: isVideo ? null : document.getElementById('updateDay').value,
        cost: document.getElementById('cost').value || 0,
        count: document.getElementById('count').value || 0,
        extra: document.getElementById('extra').value || 0,
        lastRead: isMovie ? 1 : (document.getElementById('lastRead').value || 0),
        latestChapter: isMovie ? 1 : (document.getElementById('latestChapter').value || 0)
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
