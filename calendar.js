/**
 * calendar.js
 * 宇佐合気道会カレンダーメインアプリケーション
 * カレンダーの描画、お知らせの更新、イベントリスナーを管理します。
 */

// eventData.jsからデータと関数をインポート
import { eventDates } from './eventData.js';

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // 1. DOM要素の取得
    // ----------------------------------------
    const yearSelect = document.getElementById("year-select");
    const monthSelect = document.getElementById("month-select");
    const calendarDiv = document.getElementById("calendar");
    const monthlyDynamicNoticeDiv = document.getElementById("monthly-dynamic-notice"); 

    // エラーチェック: 必要な要素がない場合は処理を中断
    if (!yearSelect || !monthSelect || !calendarDiv || !monthlyDynamicNoticeDiv) {
        console.error("カレンダー機能に必要なDOM要素が見つかりませんでした。HTMLを確認してください。");
        return;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); 
    const days = ["日", "月", "火", "水", "木", "金", "土"];


    // ----------------------------------------
    // 2. 初期設定（年選択・月選択の準備）
    // ----------------------------------------

    // 年のセレクトボックス作成（現在の年を中心に±5年）
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y + "年";
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    // 月の初期値を現在の月に設定
    monthSelect.value = currentMonth;
    
    // ----------------------------------------
    // 3. カレンダー描画関数
    // ----------------------------------------
    function renderCalendar(year, month) {
        const date = new Date(year, month, 1);
        const firstDayIndex = date.getDay(); 
        const lastDate = new Date(year, month + 1, 0).getDate(); 

        let html = `<table id="calendar-table"><thead><tr>`;
        // 曜日のヘッダーを生成
        for (let d of days) {
            let headerClass = '';
            if (d === '日') headerClass = 'sunday-text';
            if (d === '土') headerClass = 'saturday-text';
            html += `<th class="${headerClass}">${d}</th>`;
        }
        html += `</tr></thead><tbody><tr>`;

        // 月の最初の曜日まで空のセルを挿入
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<td></td>`;
        }

        // 日付のセルを生成
        for (let d = 1; d <= lastDate; d++) {
            const current = new Date(year, month, d);
            const dayOfWeek = current.getDay(); // 0=日, 6=土
            const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            let classes = [];
            let additionalTexts = []; 
            const eventInfo = eventDates[formattedDate];
            
            // 複数のタイプとテキストを配列として扱う
            const types = eventInfo ? (Array.isArray(eventInfo.type) ? eventInfo.type : [eventInfo.type]) : [];
            const texts = eventInfo ? (Array.isArray(eventInfo.text) ? eventInfo.text : [eventInfo.text]) : [];
            
            const isHoliday = types.includes("holiday");
            const isClosedDay = types.includes("closed");
            const isGeneralEvent = types.includes("event");
            
            const addedTextsSet = new Set(); 

            // --- テキストカラーと背景カラーの適用 ---
            if (dayOfWeek === 0) { // 日曜日
                classes.push("sunday-text", "holiday-or-sunday-background"); 
            } else if (dayOfWeek === 6) { // 土曜日
                classes.push("saturday-text");
            }

            if (isHoliday) { 
                 classes.push("holiday-or-sunday-background");
            } else if (isClosedDay) { 
                 classes.push("closed-non-training-day");
            }
            // 土曜日の背景を上書きしないように調整
            if (dayOfWeek === 6 && !isClosedDay && !isHoliday) { 
                 classes.push("saturday-background");
            }

            // --- 補足テキストの生成（稽古休み, 演武会, 祝日名など） ---
            texts.forEach(text => {
                if (addedTextsSet.has(text) || text === "稽古日") return; 

                // 祝日名
                if (["元日", "成人の日", "建国記念の日", "天皇誕生日", "春分の日", "昭和の日", "憲法記念日", "みどりの日", "こどもの日", "海の日", "山の日", "敬老の日", "秋分の日", "スポーツの日", "文化の日", "勤労感謝の日", "振替休日", "国民の休日"].includes(text)) { 
                    additionalTexts.push(`<span class="event-text holiday-text">${text}</span>`);
                } 
                // 稽古休み
                else if (text === "稽古休み") {
                    additionalTexts.push(`<span class="closed-text">${text}</span>`);
                } 
                // その他のイベント
                else if (isGeneralEvent || isClosedDay) { 
                    additionalTexts.push(`<span class="event-text">${text}</span>`);
                }
                addedTextsSet.add(text);
            });

            // 「稽古日」の表示ロジック (水曜日 or 土曜日 で、稽古休み・祝日ではない場合)
            const isRegularTrainingDay = (dayOfWeek === 3 || dayOfWeek === 6);
            const shouldDisplayTrainingText = isRegularTrainingDay && !isClosedDay && !isHoliday && !addedTextsSet.has("稽古日");
            
            if (shouldDisplayTrainingText) {
                additionalTexts.push('<span class="training-text">稽古日</span>');
                addedTextsSet.add("稽古日"); 
            }
            
            // 今日の日付のスタイルを最優先で適用
            const isToday = current.toDateString() === new Date().toDateString();
            if (isToday) classes.push("today");

            // セルに日付と補足テキストを結合してHTMLに追加
            html += `<td class="${classes.join(" ")}"><span class="day-number">${d}</span>${additionalTexts.join("")}</td>`;
            
            // 週の終わり（土曜日）で新しい行を開始
            if (dayOfWeek === 6 && d !== lastDate) {
                html += `</tr><tr>`;
            }
        }

        // 月の最終日以降の空のセルを挿入
        const lastDayOfWeek = new Date(year, month, lastDate).getDay();
        const remainingCells = 6 - lastDayOfWeek;
        for (let i = 0; i < remainingCells; i++) {
            html += `<td></td>`;
        }

        html += `</tr></tbody></table>`;
        calendarDiv.innerHTML = html;
    }

    // ----------------------------------------
    // 4. 月ごとのお知らせ更新関数
    // ----------------------------------------
    function updateMonthlyNoticeSection(year, month) {
        let dynamicNoticeContent = ''; 
        const holidayNames = ["元日", "成人の日", "建国記念の日", "天皇誕生日", "春分の日", "昭和の日", "憲法記念日", "みどりの日", "こどもの日", "海の日", "山の日", "敬老の日", "秋分の日", "スポーツの日", "文化の日", "勤労感謝の日", "振替休日", "国民の休日", "振替休日", "国民の休日"];

        // 現在の月に該当するイベントのみを抽出し、日付順にソート
        const noticesForCurrentMonth = Object.keys(eventDates)
            .filter(dateStr => {
                const [y, m, d] = dateStr.split('-').map(Number);
                return y === year && (m - 1) === month; 
            })
            .sort(); 

        if (noticesForCurrentMonth.length > 0) {
            noticesForCurrentMonth.forEach(dateStr => {
                const eventInfo = eventDates[dateStr];
                const dateObj = new Date(dateStr);
                const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${days[dateObj.getDay()]}）`;
                
                let textsForDate = Array.isArray(eventInfo.text) ? eventInfo.text : [eventInfo.text];

                const addedTextsToNotice = new Set(); 

                // 祝日名と「稽古日」テキストを通知から除外
                textsForDate = textsForDate.filter(text => !holidayNames.includes(text) && text !== "稽古日");

                // フィルタリングされた残りのテキスト（演武会、稽古休み、審査など）を通知に追加
                textsForDate.forEach(text => {
                    if (addedTextsToNotice.has(text)) { 
                        return;
                    }
                    dynamicNoticeContent += `<p><small>${displayDate}は**${text}**。</small></p>`;
                    addedTextsToNotice.add(text);
                });
                
                // 祝日ではない、水曜 or 土曜で、他に通知すべき特別なイベントがない場合に「稽古日」を通知
                const dayOfWeek = dateObj.getDay();
                const isTrainingDayCandidate = (dayOfWeek === 3 || dayOfWeek === 6); 
                const isNotHolidayTextPresent = !eventInfo.text || !textsForDate.some(text => holidayNames.includes(text));

                if (isTrainingDayCandidate && isNotHolidayTextPresent && addedTextsToNotice.size === 0) {
                     dynamicNoticeContent += `<p><small>${displayDate}は**稽古日**。</small></p>`;
                     addedTextsToNotice.add("稽古日"); 
                }
            });
        } else {
            dynamicNoticeContent += '<p><small>今月のお知らせはありません。</small></p>';
        }

        monthlyDynamicNoticeDiv.innerHTML = dynamicNoticeContent;
    }


    // ----------------------------------------
    // 5. 初期描画とイベントリスナーの設定
    // ----------------------------------------
    renderCalendar(currentYear, currentMonth);
    updateMonthlyNoticeSection(currentYear, currentMonth); 

    const handleChange = () => {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        renderCalendar(year, month);
        updateMonthlyNoticeSection(year, month); 
    };

    yearSelect.addEventListener("change", handleChange);
    monthSelect.addEventListener("change", handleChange);
});