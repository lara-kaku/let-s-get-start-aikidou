/**
 * eventData.js
 * カレンダー表示用のイベントデータ
 * 形式: "YYYY-MM-DD": { type: "closed" | "holiday" | "event" | ["type1", "type2"], text: "説明" | ["説明1", "説明2"] }
 */
export const eventDates = {
    // 2025年11月
    "2025-11-03": { type: "holiday", text: "文化の日" },
    "2025-11-23": { type: "holiday", text: "勤労感謝の日" },
    "2025-11-23": { type: "event", text: "昇級審査会" }, 

    // 2025年12月
    "2025-12-20": { type: "closed", text: "稽古休み" }, 
    "2025-12-24": { type: "closed", text: "稽古休み" },
    "2025-12-27": { type: "closed", text: "稽古休み" }, 
    "2025-12-21": { type: "event", text: "忘年会" }, // 例: 稽古休みだが納会がある
    "2025-12-31": { type: "closed", text: "稽古休み" },
    
    // 2026年1月
    "2026-01-01": { type: "closed", text: "元日" }, // 祝日だが稽古休みとして扱う
    "2026-01-03": { type: "closed", text: "稽古休み" },
    "2026-01-07": { type: "closed", text: "稽古始め" },
};