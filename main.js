document.addEventListener('DOMContentLoaded', () => {
    const practiceModeLinks = document.querySelectorAll('nav a');
    const textDisplay = document.getElementById('text-display');
    const translationDisplay = document.getElementById('translation-display');
    const longTranslationContainer = document.getElementById('long-translation-container');
    const longTranslationContent = document.getElementById('long-translation-content');
    const textInput = document.getElementById('text-input');
    const keyboardContainer = document.getElementById('keyboard-container');
    const handContainer = document.getElementById('hand-container');
    const timeEl = document.getElementById('time');
    const accuracyEl = document.getElementById('accuracy');

    let currentMode = 'chars';
    let practiceText = '';
    let practiceTextForComparison = '';
    let timer;
    let time = 0;
    let correctStrokes = 0;
    let totalStrokes = 0;

    const russian = {
        chars: ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ', 'ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.'],
        words: {
            'здра́вствуйте': '안녕하세요',
            'спаси́бо': '감사합니다',
            'пожа́луйста': '천만에요 / 부디',
            'до свида́ния': '안녕히 가세요',
            'студе́нт': '학생',
            'шко́ла': '학교',
            'учи́тель': '선생님',
            'кни́га': '책',
            'чита́ть': '읽다',
            'писа́ть': '쓰다',
            'говори́ть': '말하다',
            'краси́вый': '아름다운',
            'интере́сный': '흥미로운',
            'хорошо́': '좋아요',
            'сего́дня': '오늘',
            'за́втра': '내일',
            'Росси́я': '러시아',
            'Москва́': '모스크바'
        },
        shortSentences: {
            'Я студе́нт.': '저는 학생입니다.',
            'Она́ чита́ет кни́гу.': '그녀는 책을 읽고 있습니다.',
            'Он хорошо́ говори́т по-ру́сски.': '그는 러시아어를 잘합니다.',
            'Как дела́?': '어떻게 지내세요?',
            'Что э́то?': '이것은 무엇입니까?',
            'Где вы живёте?': '어디에 사시나요?',
            'Ско́лько э́то сто́ит?': '이것은 얼마입니까?',
            'Я не понима́ю.': '저는 이해하지 못합니다.',
            'О́чень прия́тно.': '만나서 반갑습니다.',
            'Вы говори́те по-англи́йски?': '영어를 할 줄 아시나요?'
        },
        longSentences: {
            'Ру́сский язы́к — оди́н из восточнославя́нских языко́в, оди́н из крупне́йших языко́в ми́ра, в том числе́ са́мый распространённый из славя́нских языко́в и са́мый распространённый язы́к в Евро́пе, как географи́чески, так и по числу́ носи́телей языка́ как родно́го.': '러시아어는 동슬라브어파에 속하는 언어 중 하나이며, 세계의 주요 언어 중 하나이다. 슬라브어파 중에서 가장 널리 사용되며, 지리적으로나 원어민 수로나 유럽에서 가장 널리 퍼져 있는 언어이다.'
        }
    };

    const keyboardLayout = [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.'],
        [' ']
    ];

    const fingerMap = {
        'й': 'left-pinky', 'ц': 'left-ring', 'у': 'left-middle', 'к': 'left-pointer', 'е': 'left-pointer',
        'н': 'right-pointer', 'г': 'right-pointer', 'ш': 'right-middle', 'щ': 'right-ring', 'з': 'right-pinky', 'х': 'right-pinky', 'ъ': 'right-pinky',
        'ф': 'left-pinky', 'ы': 'left-ring', 'в': 'left-middle', 'а': 'left-pointer', 'п': 'left-pointer',
        'р': 'right-pointer', 'о': 'right-pointer', 'л': 'right-middle', 'д': 'right-ring', 'ж': 'right-pinky', 'э': 'right-pinky',
        'я': 'left-pinky', 'ч': 'left-ring', 'с': 'left-middle', 'м': 'left-pointer', 'и': 'left-pointer',
        'т': 'right-pointer', 'ь': 'right-pointer', 'б': 'right-middle', 'ю': 'right-ring', '.': 'right-pinky',
        ' ': 'thumb'
    };

    const homeKeys = {
        'left-pinky': 'ф', 'left-ring': 'ы', 'left-middle': 'в', 'left-pointer': 'а',
        'right-pointer': 'о', 'right-middle': 'л', 'right-ring': 'д', 'right-pinky': 'ж'
    };

    function toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    function createHands() {
        handContainer.innerHTML = '';
        Object.keys(homeKeys).forEach(fingerId => {
            const fingerEl = document.createElement('div');
            fingerEl.id = fingerId; 
            fingerEl.className = 'finger';
            handContainer.appendChild(fingerEl);
        });
    }

    function createKeyboard() {
        const keyboardNode = keyboardContainer.querySelector('#keyboard');
        if (keyboardNode) keyboardNode.remove();

        const keyboardDiv = document.createElement('div');
        keyboardDiv.id = 'keyboard';
        keyboardLayout.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.classList.add('keyboard-row');
            row.forEach(key => {
                const keyEl = document.createElement('div');
                keyEl.classList.add('key');
                if (key === ' ') {
                    keyEl.classList.add('space');
                    keyEl.dataset.key = 'space'; // Use 'space' as a robust identifier
                } else {
                    keyEl.dataset.key = key;
                }
                keyEl.textContent = key;
                rowEl.appendChild(keyEl);
            });
            keyboardDiv.appendChild(rowEl);
        });
        keyboardContainer.appendChild(keyboardDiv);
    }

    function positionFinger(fingerId, keyChar, isPressing) {
        const keyEl = keyChar ? document.querySelector(`.key[data-key="${keyChar}"]`) : null;
        const fingerEl = document.getElementById(fingerId);
        if (!fingerEl || !keyEl) return;

        const keyRect = keyEl.getBoundingClientRect();
        const containerRect = handContainer.getBoundingClientRect();

        const x = keyRect.left - containerRect.left + (keyRect.width / 2) - (fingerEl.offsetWidth / 2);
        const y = isPressing 
            ? keyRect.top - containerRect.top + (keyRect.height / 2) - (fingerEl.offsetHeight / 2)
            : keyRect.top - containerRect.top - 30;

        fingerEl.style.transform = `translate(${x}px, ${y}px)`;
        fingerEl.style.backgroundColor = isPressing ? '#2a65c7' : 'rgba(74, 144, 226, 0.7)';
    }

    function resetFingersToHome() {
        Object.entries(homeKeys).forEach(([fingerId, keyChar]) => {
            positionFinger(fingerId, keyChar, false); // false = hover
        });
    }

    function highlightKey(key) {
        const keyLower = key.toLowerCase();
        const keySelector = (keyLower === ' ') ? 'space' : keyLower;
        const keyEl = document.querySelector(`.key[data-key="${keySelector}"]`);

        if (!keyEl) return; 

        document.querySelectorAll('.key.highlight').forEach(k => k.classList.remove('highlight'));
        keyEl.classList.add('highlight');

        resetFingersToHome();

        const fingerId = fingerMap[keyLower];
        if (fingerId && fingerId !== 'thumb') {
            positionFinger(fingerId, keyLower, true); 
        }
    }

    function unhighlightAllKeys() {
        document.querySelectorAll('.key.highlight').forEach(k => k.classList.remove('highlight'));
        resetFingersToHome();
    }

    function startTimer() {
        if (timer) return;
        timer = setInterval(() => {
            time++;
            const minutes = Math.floor(time / 60).toString().padStart(2, '0');
            const seconds = (time % 60).toString().padStart(2, '0');
            timeEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timer);
        timer = null;
    }

    function resetStats() {
        stopTimer();
        time = 0;
        correctStrokes = 0;
        totalStrokes = 0;
        timeEl.textContent = '00:00';
        accuracyEl.textContent = '0.00%';
    }

    function updateAccuracy() {
        const acc = totalStrokes > 0 ? (correctStrokes / totalStrokes) * 100 : 0;
        accuracyEl.textContent = `${acc.toFixed(2)}%`;
    }

    function nextItem() {
        textInput.value = '';
        let rawText = '';
        let translation = '';

        translationDisplay.style.display = 'none';
        longTranslationContainer.style.display = 'none';
        longTranslationContainer.open = false;

        const camelCaseMode = toCamelCase(currentMode);
        const modeData = russian[camelCaseMode];

        if (currentMode === 'chars') {
            const randomIndex = Math.floor(Math.random() * modeData.length);
            rawText = modeData[randomIndex];
        } else if (modeData) {
            const keys = Object.keys(modeData);
            const randomIndex = Math.floor(Math.random() * keys.length);
            rawText = keys[randomIndex];
            translation = modeData[rawText];

            if (currentMode === 'long-sentences') {
                longTranslationContent.textContent = translation;
                longTranslationContainer.style.display = 'block';
            } else {
                translationDisplay.textContent = translation;
                translationDisplay.style.display = 'block';
            }
        }

        practiceText = rawText;
        practiceTextForComparison = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        let initialHtml = '';
        let i = 0;
        while (i < practiceText.length) {
            let graphemeEnd = i + 1;
            while (graphemeEnd < practiceText.length && /[\u0300-\u036f]/.test(practiceText[graphemeEnd])) {
                graphemeEnd++;
            }
            const grapheme = practiceText.substring(i, graphemeEnd);
            
            if (grapheme === ' ') {
                initialHtml += '<span class="space-char">&nbsp;</span>';
            } else {
                initialHtml += `<span>${grapheme}</span>`;
            }
            i = graphemeEnd;
        }
        textDisplay.innerHTML = initialHtml;

        unhighlightAllKeys();
        if (practiceTextForComparison.length > 0) {
            highlightKey(practiceTextForComparison[0]);
        }
    }

    function initMode(mode) {
        currentMode = mode;
        resetStats();
        createKeyboard();
        createHands();
        setTimeout(() => {
            nextItem();
        }, 150);
    }

    textInput.addEventListener('input', () => {
        startTimer();
        const typedText = textInput.value;
        
        let html = '';
        let fullyCorrect = true;

        let textIndex = 0;
        let comparisonIndex = 0;
        while (comparisonIndex < practiceTextForComparison.length) {
            let graphemeEnd = textIndex + 1;
            while (graphemeEnd < practiceText.length && /[\u0300-\u036f]/.test(practiceText[graphemeEnd])) {
                graphemeEnd++;
            }
            const grapheme = practiceText.substring(textIndex, graphemeEnd);
            const comparisonChar = practiceTextForComparison[comparisonIndex];

            const isSpace = comparisonChar === ' ';
            const displayChar = isSpace ? '&nbsp;' : grapheme;
            
            let classes = [];
            if (isSpace) {
                classes.push('space-char');
            }

            if (comparisonIndex < typedText.length) {
                const isCorrect = typedText[comparisonIndex] === comparisonChar;
                if(isCorrect) {
                    classes.push('correct');
                } else {
                    classes.push('incorrect');
                    fullyCorrect = false;
                }
            } else {
                fullyCorrect = false;
            }
            
            html += `<span class="${classes.join(' ')}">${displayChar}</span>`;
            
            textIndex = graphemeEnd;
            comparisonIndex++;
        }
        textDisplay.innerHTML = html;

        totalStrokes = typedText.length;
        correctStrokes = typedText.split('').filter((c, i) => c === practiceTextForComparison[i]).length;
        updateAccuracy();

        if (typedText.length < practiceTextForComparison.length) {
            highlightKey(practiceTextForComparison[typedText.length]);
        } else if (fullyCorrect) {
            setTimeout(nextItem, 200);
        } else {
            unhighlightAllKeys();
        }
    });

    practiceModeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            practiceModeLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            initMode(link.dataset.mode);
        });
    });

    initMode('chars');
    window.addEventListener('resize', unhighlightAllKeys);
});
