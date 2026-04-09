const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1BXE2b1ySLjC3HgG1gSgRlW4cI2Y3PAmkxNu--9-KkF5xp-_isL-yRLeNH7h7vpvRQA/exec'; 

let mediaData = [];

// 日期淨化器：把 "2026-04-01T16:00:00.000Z" 這種髒東西轉成乾淨的 "2026-04-01"
function cleanDateStr(rawStr) {
    if (!rawStr) return "";
    // 取 T 以前的字串，如果是 ISO 格式就會被裁掉後半段
    return rawStr.split('T')[0]; 
}

// 推算下次更新日 (排除時區誤差)
function calculateNextDate(dateStr, cycle) {
    if (!dateStr || !cycle) return "";
    let clean = cleanDateStr(dateStr);
    let parts = clean.split('-');
    if (parts.length !== 3) return "";

    // 使用整數建立日期，避免時區自動跳轉
    let d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    if (cycle === '#十天一次連載') {
        d.setDate(d.getDate() + 10);
    } else if (cycle.includes('週')) {
        d.setDate(d.getDate() + 7);
    } else {
        return "";
    }

    let y = d.getFullYear();
    let m = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

async function loadData() {
    const loading = document.getElementById('loading-msg');
    try {
        loading.style.display = 'block';
        const response = await fetch(SCRIPT_URL);
        mediaData = await response.json();
        mediaData.reverse();
        renderAll();
    } catch (e) { alert("讀取雲端失敗"); }
    finally { loading.style.display = 'none'; }
}

function getPlatformClass(plat) {
    switch(plat) {
        case 'bomtoon.tw': return 'plat-bomtoon';
        case 'Webtoon': return 'plat-webtoon';
        case '實體電影院': return 'plat-vieshow';
        case 'Netflix': return 'plat-netflix';
        case '愛奇藝': return 'plat-iqiyi';
        case 'Disney+': return 'plat-disney';
        case 'gagaOOlala': return 'plat-gaga';
        default: return 'plat-mirror';
    }
}

function renderAll() {
    // 取得今天台灣時間
    let now = new Date();
    let todayStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,'0') + "-" + String(now.getDate()).padStart(2,'0');

    const lists = { 
        update: document.getElementById("update-list"), 
        ongoing: document.getElementById("ongoing-list"), 
        completed: document.getElementById("completed-list") 
    };
    Object.values(lists).forEach(l => l.innerHTML = "");

    let totalC = 0, totalTWD = 0, hasUpdates = false;

    mediaData.forEach(item => {
        const isBomtoon = item.platform === 'bomtoon.tw';
        const isMovie = item.platform === '實體電影院';
        const itemTotal = (Number(item.cost) * Number(item.count)) + Number(item.extra);
        
        if (isBomtoon) totalC += itemTotal; else totalTWD += itemTotal;

        let cleanDate = cleanDateStr(item.customDate);
        let nextDate = calculateNextDate(cleanDate, item.updateDayLabel);

        let dateHTML = isMovie ? `觀影日：${cleanDate}` : `最新更新：${cleanDate}`;
        if (nextDate && !isMovie) {
            dateHTML += `<br><span style="color:#f70c6b; font-weight:bold;">⏰ 下次更新：${nextDate}</span>`;
        }

        const card = document.createElement('li');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem('${item.title}')">×</button>
            <span class="plat-tag ${getPlatformClass(item.platform)}">${item.platform}</span>
            <span class="card-title">${item.title}</span>
            ${item.updateDayLabel ? `<span class="update-tag">${item.updateDayLabel}</span>` : ''}
            <div style="margin: 12px 0; font-size: 0.95rem;">
                進度：${item.lastRead} / ${item.latestChapter}<br>
                <small style="color:#888;">${dateHTML}</small>
            </div>
            <div style="text-align:right; font-weight:bold; font-size:1.1rem; color:${isBomtoon?'#f70c6b':'#4caf50'}">
                ${isBomtoon ? itemTotal + ' C' : itemTotal + ' 元'}
            </div>
        `;

        if (item.status === 'completed' || item.status === 'watched' || isMovie) {
            lists.completed.appendChild(card);
        } else {
            lists.ongoing.appendChild(card.cloneNode(true));
            // 提醒邏輯：下次更新日到了 且 有新進度
            if (nextDate && todayStr >= nextDate && Number(item.lastRead) < Number(item.latestChapter)) {
                lists.update.appendChild(card.cloneNode(true));
                hasUpdates = true;
            }
        }
    });

    document.getElementById("total-c-coins").textContent = totalC;
    document.getElementById("total-twd").textContent = totalTWD;
    document.getElementById("update-alert").classList.toggle("hidden", !hasUpdates);
}

// 監聽存檔
document.getElementById('media-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const formData = {
        title: document.getElementById('title').value.trim(),
        platform: document.getElementById('platform').value,
        status: document.getElementById('status').value,
        updateDayLabel: document.getElementById('updateDay').value,
        cost: document.getElementById('cost')?.value || 0,
        count: document.getElementById('count')?.value || 1,
        extra: document.getElementById('extra')?.value || 0,
        lastRead: document.getElementById('lastRead')?.value || 0,
        latestChapter: document.getElementById('latestChapter')?.value || 0,
        customDate: document.getElementById('customDate').value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "雲端同步中...";

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(formData) });
        await loadData();
        e.target.reset();
    } catch (e) { alert("儲存失敗"); }
    finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "確認儲存";
    }
});

async function deleteItem(title) {
    if (!confirm(`確定要刪除「${title}」嗎？`)) return;
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'delete', title: title }) });
        await loadData();
    } catch (e) { alert("刪除失敗"); }
}

// 初始載入
loadData();
