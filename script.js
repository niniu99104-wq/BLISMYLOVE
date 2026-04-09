let mediaData = JSON.parse(localStorage.getItem('bl_tracker_data')) || [];

const platformSelect = document.getElementById('platform');
const dynamicFields = document.getElementById('dynamic-fields');

// 根據平台動態切換輸入欄位
function updateFormFields() {
    const platform = platformSelect.value;
    
    if (platform === 'bomtoon.tw') {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="每話 C 幣 (例: 3)" min="0" required>
            <input type="number" id="count" placeholder="已購買話數" min="0" required>
            <input type="number" id="extra" placeholder="額外花費 C 幣" value="0" min="0">
        `;
    } else if (platform === '電影院（實體）') {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="單張票價 (元)" min="0" required>
            <input type="number" id="count" placeholder="觀看張數" value="1" min="1" required>
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    } else if (['Netflix', 'gagaOOlala'].includes(platform)) {
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="月費/年費支出 (元)" value="0" min="0" required>
            <input type="hidden" id="count" value="1">
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    } else {
        // Webtoon, BW, 鏡文學
        dynamicFields.innerHTML = `
            <input type="number" id="cost" placeholder="單價 (元)" min="0" required>
            <input type="number" id="count" placeholder="已購話數/本數" min="0" required>
            <input type="number" id="extra" placeholder="其他花費 (元)" value="0" min="0">
        `;
    }
}

// 監聽平台切換事件
platformSelect.addEventListener('change', updateFormFields);
updateFormFields(); // 初始化執行一次

function saveData() {
    localStorage.setItem('bl_tracker_data', JSON.stringify(mediaData));
    renderAll();
}

function renderAll() {
    let totalC = 0;
    let totalTWD = 0;
    const today = new Date().getDay(); // 0=日, 1=一...
    
    const lists = {
        update: document.getElementById("update-list"),
        ongoing: document.getElementById("ongoing-list"),
        completed: document.getElementById("completed-list")
    };

    Object.values(lists).forEach(l => l.innerHTML = "");
    let hasUpdates = false;

    mediaData.forEach((item, index) => {
        // 花費只跟已購數量有關
        const itemTotal = (Number(item.cost) * Number(item.count)) + Number(item.extra);
        const isBomtoon = item.platform === 'bomtoon.tw';
        
        if (isBomtoon) totalC += itemTotal;
        else totalTWD += itemTotal;

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${index})">×</button>
            <span class="card-platform">${item.platform}</span>
            <span class="card-title">${item.title}</span>
            <span class="tag">${item.updateDayLabel}</span>
            <div class="card-details">
                進度：<b style="color: ${isBomtoon ? 'var(--accent-c)' : 'var(--text-main)'}">${item.lastRead}</b> / ${item.latestChapter} 話<br>
                <small style="color:#666">已購基礎數：${item.count}</small>
            </div>
            <div class="card-cost ${isBomtoon ? 'cost-c' : 'cost-twd'}">
                ${isBomtoon ? '投資：' + itemTotal + ' C' : '支出：' + itemTotal + ' 元'}
            </div>
        `;

        // 狀態分流
        if (item.status === "completed") {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            
            // 提醒邏輯
            const dayMap = {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6};
            const isToday = dayMap[item.updateDayLabel] === today;
            
            if ((isToday || item.updateDayLabel === "#十天一次連載") && Number(item.lastRead) < Number(item.latestChapter)) {
                lists.update.appendChild(card.cloneNode(true));
                hasUpdates = true;
            }
        }
    });

    // 更新頂部數據
    document.getElementById("total-c-coins").textContent = totalC;
    document.getElementById("total-twd").textContent = totalTWD;
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

// 處理表單提交 (新增或覆蓋)
document.getElementById('media-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const newItem = {
        title: title,
        platform: platformSelect.value,
        status: document.getElementById('status').value,
        updateDayLabel: document.getElementById('updateDay').value,
        cost: document.getElementById('cost').value || 0,
        count: document.getElementById('count').value || 0,
        extra: document.getElementById('extra').value || 0,
        lastRead: document.getElementById('lastRead').value || 0,
        latestChapter: document.getElementById('latestChapter').value || 0
    };

    // 尋找是否同名，同名就覆蓋，不同名就新增
    const existingIndex = mediaData.findIndex(item => item.title === title);
    if (existingIndex !== -1) {
        mediaData[existingIndex] = newItem;
    } else {
        // 新增的放在陣列最前面，讓新坑直接出現在頂部
        mediaData.unshift(newItem); 
    }
    
    saveData();
    e.target.reset();
    updateFormFields(); // 重置表單後，讓動態欄位恢復成預設平台的樣子
});

function deleteItem(index) {
    if(confirm('要刪除這筆紀錄嗎？')) {
        mediaData.splice(index, 1);
        saveData();
    }
}

document.getElementById('clear-data').addEventListener('click', () => {
    if(confirm('注意：清空後資料無法恢復，確定嗎？')) {
        localStorage.removeItem('bl_tracker_data');
        location.reload();
    }
});

// 載入時渲染畫面
renderAll();
