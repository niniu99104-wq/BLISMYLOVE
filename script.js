// 初始預設資料（幫你預載了幾部，讓你一打開不至於空空的）
const defaultData = [
    { title: "Jinx", platform: "Bomtoon", status: "ongoing", updateDay: 5, chapterCost: 4, purchasedChapters: 96, extraCost: 0, lastRead: 96, latestChapter: 96 },
    { title: "星期一的救贖", platform: "Bomtoon", status: "ongoing", updateDay: 1, chapterCost: 3, purchasedChapters: 74, extraCost: 0, lastRead: 74, latestChapter: 74 },
    { title: "秘密關係", platform: "GagaOOlala 🇹🇼", status: "completed", updateDay: null, chapterCost: 0, purchasedChapters: 0, extraCost: 0, lastRead: 0, latestChapter: 0 }
];

// 從瀏覽器讀取資料，如果沒有就用預設資料
let mediaData = JSON.parse(localStorage.getItem('bl_tracker_data')) || defaultData;

// 儲存資料到瀏覽器並重新渲染畫面
function saveData() {
    localStorage.setItem('bl_tracker_data', JSON.stringify(mediaData));
    renderAll();
}

// 渲染所有清單與計算
function renderAll() {
    let totalCoins = 0;
    const today = new Date().getDay(); // 取得今天是星期幾 (0=週日, 1=週一...)
    
    const lists = {
        update: document.getElementById("update-list"),
        ongoing: document.getElementById("ongoing-list"),
        completed: document.getElementById("completed-list")
    };

    // 清空現有清單
    Object.values(lists).forEach(l => l.innerHTML = "");
    let hasUpdates = false;

    // 反轉陣列，讓最新加入的排在最前面
    const reversedData = [...mediaData].reverse();

    reversedData.forEach((item, reversedIndex) => {
        // 因為陣列反轉過，我們需要找回它在原始陣列的正確 index 才能正確刪除
        const originalIndex = mediaData.length - 1 - reversedIndex; 

        // 計算這部作品的總花費
        const itemTotalC = (Number(item.chapterCost) * Number(item.purchasedChapters)) + Number(item.extraCost);
        totalCoins += itemTotalC;

        // 產生卡片 HTML
        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${originalIndex})">×</button>
            <div class="card-header">
                <span class="card-title">${item.title}</span>
                <span class="card-platform">${item.platform}</span>
            </div>
            <div class="card-details">
                ${item.status === 'ongoing' ? `進度：${item.lastRead} / ${item.latestChapter} 話` : '狀態：已完結'}
            </div>
            <div class="card-cost">投資：${itemTotalC} C</div>
        `;

        // 依據狀態塞入對應的區塊
        if (item.status === "completed") {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            
            // 判斷今日是否更新且未看 (最新話數 > 已看話數)
            if (item.updateDay !== null && Number(item.updateDay) === today && Number(item.lastRead) < Number(item.latestChapter)) {
                lists.update.appendChild(card.cloneNode(true));
                hasUpdates = true;
            }
        }
    });

    // 更新總花費顯示
    document.getElementById("total-coins").textContent = totalCoins;
    
    // 控制「今日更新」區塊的顯示與隱藏
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

// 處理表單送出 (新增作品)
document.getElementById('media-form').addEventListener('submit', (e) => {
    e.preventDefault(); // 防止網頁重新整理
    
    const updateDayVal = document.getElementById('updateDay').value;
    
    const newItem = {
        title: document.getElementById('title').value,
        platform: document.getElementById('platform').value,
        status: document.getElementById('status').value,
        updateDay: updateDayVal === 'null' ? null : Number(updateDayVal),
        chapterCost: Number(document.getElementById('chapterCost').value) || 0,
        purchasedChapters: Number(document.getElementById('purchasedChapters').value) || 0,
        extraCost: Number(document.getElementById('extraCost').value) || 0,
        lastRead: Number(document.getElementById('lastRead').value) || 0,
        latestChapter: Number(document.getElementById('latestChapter').value) || 0
    };
    
    mediaData.push(newItem);
    saveData();
    e.target.reset(); // 清空表單
});

// 刪除特定紀錄
function deleteItem(index) {
    if(confirm('確定要刪除這筆紀錄嗎？')) {
        mediaData.splice(index, 1);
        saveData();
    }
}

// 清空所有資料
document.getElementById('clear-data').addEventListener('click', () => {
    if(confirm('警告：這會清空所有你辛辛苦苦輸入的資料，確定要重來嗎？')) {
        localStorage.removeItem('bl_tracker_data');
        location.reload(); // 重新載入網頁恢復預設值
    }
});

// 網頁載入時首次渲染
renderAll();
