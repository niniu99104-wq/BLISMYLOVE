// 初始資料庫
let mediaData = JSON.parse(localStorage.getItem('bl_tracker_data')) || [];

function saveData() {
    localStorage.setItem('bl_tracker_data', JSON.stringify(mediaData));
    renderAll();
}

function renderAll() {
    let totalCoins = 0;
    const today = new Date().getDay(); // 0=週日, 1=週一...
    
    const lists = {
        update: document.getElementById("update-list"),
        ongoing: document.getElementById("ongoing-list"),
        completed: document.getElementById("completed-list")
    };

    Object.values(lists).forEach(l => l.innerHTML = "");
    let hasUpdates = false;

    // 渲染清單
    mediaData.forEach((item, index) => {
        // 【核心邏輯】花費只跟「已購話數」有關，跟你看到第幾話無關
        const itemTotalC = (Number(item.chapterCost) * Number(item.purchasedChapters)) + Number(item.extraCost);
        totalCoins += itemTotalC;

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${index})">×</button>
            <div class="card-header">
                <span class="card-title">${item.title}</span>
                <span class="card-platform">${item.platform}</span>
            </div>
            <div class="card-details">
                <span class="tag">${item.updateDayLabel}</span><br>
                進度：<b style="color:var(--accent-color)">${item.lastRead}</b> / ${item.latestChapter} 話<br>
                <small>(已購：${item.purchasedChapters} 話)</small>
            </div>
            <div class="card-cost">投資：${itemTotalC} C</div>
        `;

        if (item.status === "completed") {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            
            // 提醒邏輯：如果是今天更新且有新話數未讀
            const dayMap = {"#週日連載":0, "#週一連載":1, "#週二連載":2, "#週三連載":3, "#週四連載":4, "#週五連載":5, "#週六連載":6};
            const isToday = dayMap[item.updateDayLabel] === today;
            
            if ((isToday || item.updateDayLabel === "#十天一次連載") && Number(item.lastRead) < Number(item.latestChapter)) {
                lists.update.appendChild(card.cloneNode(true));
                hasUpdates = true;
            }
        }
    });

    document.getElementById("total-coins").textContent = totalCoins;
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

// 處理表單
document.getElementById('media-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const updateDaySelect = document.getElementById('updateDay');
    
    const newItem = {
        title: title,
        platform: document.getElementById('platform').value,
        status: document.getElementById('status').value,
        updateDayLabel: updateDaySelect.value, // 儲存標籤文字
        chapterCost: Number(document.getElementById('chapterCost').value) || 0,
        purchasedChapters: Number(document.getElementById('purchasedChapters').value) || 0,
        extraCost: Number(document.getElementById('extraCost').value) || 0,
        lastRead: Number(document.getElementById('lastRead').value) || 0,
        latestChapter: Number(document.getElementById('latestChapter').value) || 0
    };

    // 【覆蓋邏輯】檢查是否已存在同名作品
    const existingIndex = mediaData.findIndex(item => item.title === title);
    
    if (existingIndex !== -1) {
        // 如果存在，直接覆蓋更新
        mediaData[existingIndex] = newItem;
    } else {
        // 如果不存在，新增到清單
        mediaData.push(newItem);
    }
    
    saveData();
    e.target.reset();
});

function deleteItem(index) {
    if(confirm('要刪除這部作品嗎？')) {
        mediaData.splice(index, 1);
        saveData();
    }
}

document.getElementById('clear-data').addEventListener('click', () => {
    if(confirm('確定清空所有資料？')) {
        localStorage.removeItem('bl_tracker_data');
        location.reload();
    }
});

renderAll();
