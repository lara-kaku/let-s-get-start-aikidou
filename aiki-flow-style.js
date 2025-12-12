const flowData = {
    // ID: S1 (スタート質問 1)
    "S1": {
        question: "運動経験はありますか？",
        yes: "Q2",  // 次の質問ID
        no: "Q3",   // 次の質問ID
        type: "question"
    },
    // ID: Q2
    "Q2": {
        question: "身体能力に自信がありますか？",
        yes: "R1", 
        no: "R2",
        type: "question"
    },
    // ID: Q3
    "Q3": {
        question: "武道に興味はありますか？",
        yes: "R2",
        no: "R3",
        type: "question"
    },
    
    // ID: R1 (結果 1)
    "R1": {
        title: "結果: 🥋ぜひ合気道をおすすめします！",
        description: "合気道は自分のペースで体を動かせますが、基本をマスターするまでには継続的な努力が必要です。運動経験を活かし、じっくりと技の理合いを学んでいきましょう！",
        type: "result"
    },
    // ID: R2 (結果 2)
    "R2": {
        title: "結果: 🌸合気道は理想的かもしれません",
        description: "合気道は、筋力よりも**体の使い方や相手の力への合わせ方**を重視します。激しいぶつかり合いがなく、年齢や体力に関係なく始められます。見学・体験からぜひどうぞ！",
        type: "result"
    },
    // ID: R3 (結果 3)
    "R3": {
        title: "結果: 🍀まずは見学・体験を！",
        description: "武道に馴染みがなくても心配ありません。合気道は心身の鍛錬を目的としており、護身術としても役立ちます。一度道場の雰囲気を体験してみませんか？",
        type: "result"
    }
};

let currentFlowId = "S1"; // 最初の質問ID

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM要素の取得
    const questionText = document.getElementById('question-text');
    const resultDescription = document.getElementById('result-description');
    const flowContainer = document.getElementById('flow-container'); // 追加
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');
    const restartButton = document.getElementById('restart-button');

    // 致命的なエラーを避けるためのチェックを追加
    if (!questionText || !resultDescription || !flowContainer || !yesButton || !noButton || !restartButton) {
        console.error("フローチャートに必要なDOM要素が見つかりません。HTMLのIDを確認してください。");
        // 必須要素がない場合は処理を中断
        return;
    }

    // 2. 質問・結果の表示を更新するメイン関数
    function updateFlowContent(nextId) {
        // アニメーションのため、コンテンツを一旦隠す
        questionText.style.opacity = '0';
        resultDescription.style.display = 'none';
        flowContainer.classList.remove('result-mode'); // 結果モードを解除
        
        // 50ms後にコンテンツを更新し、フェードイン
        setTimeout(() => {
            currentFlowId = nextId;
            const currentData = flowData[currentFlowId];
            
            if (currentData.type === "question") {
                // 質問の場合
                questionText.textContent = currentData.question;
                
                yesButton.style.display = 'inline-block';
                noButton.style.display = 'inline-block';
                restartButton.style.display = 'none';

            } else if (currentData.type === "result") {
                // 結果の場合
                questionText.textContent = currentData.title;
                // リンクにクラス名（button-stump）を追加してデザインを適用
                resultDescription.innerHTML = 
                    `<p>${currentData.description}</p>
                    <p class="contact-link">
                        <a href="contact.html"  </a>
                        <a href="https://www.instagram.com/usaaikidokai?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" class="button-stump">
                            >> 📷宇佐合気道会 公式Instagramをチェック
                        </a>
                    </p>`;
                resultDescription.style.display = 'block';
                flowContainer.classList.add('result-mode'); // 結果モードを適用
                
                // ボタンを非表示にし、リスタートボタンを表示
                yesButton.style.display = 'none';
                noButton.style.display = 'none';
                restartButton.style.display = 'inline-block';
            }
            // コンテンツをフェードイン
            questionText.style.opacity = '1';
            if (currentData.type === 'result') {
                 resultDescription.style.opacity = '1';
            }

        }, 50); // アニメーション時間
    }

    // 3. イベントリスナーの設定
    yesButton.addEventListener('click', () => {
        const nextId = flowData[currentFlowId].yes;
        updateFlowContent(nextId);
    });

    noButton.addEventListener('click', () => {
        const nextId = flowData[currentFlowId].no;
        updateFlowContent(nextId);
    });

    restartButton.addEventListener('click', () => {
        updateFlowContent("S1"); // 最初の質問に戻る
    });

    // 4. 初期表示
    updateFlowContent(currentFlowId);
});
