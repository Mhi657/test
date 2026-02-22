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
            'приве́т': 'hello',
            'мир': 'world',
            'любо́вь': 'love',
            'ко́шка': 'cat',
            'соба́ка': 'dog',
            'до́м': 'house',
            'шко́ла': 'school',
            'учи́тель': 'teacher',
            'кни́га': 'book',
            'со́лнце': 'sun'
        },
        shortSentences: {
            'Ма́ма мы́ла ра́му.': 'Mom washed the frame.',
            'Ко́т спи́т на дива́не.': 'The cat is sleeping on the sofa.',
            'Я люблю́ чита́ть кни́ги.': 'I love to read books.',
            'Сего́дня хоро́шая пого́да.': 'The weather is good today.',
            'Ско́ро бу́дет ле́то.': 'Summer will be soon.'
        },
        longSentences: {
            'Ру́сский язы́к — оди́н из восточнославя́нских языко́в, оди́н из крупне́йших языко́в ми́ра, в том числе́ са́мый распространённый из славя́нских языко́в и са́мый распространённый язы́к в Евро́пе, как географи́чески, так и по числу́ носи́телей языка́ как родно́го.': 'Russian is one of the East Slavic languages, one of the largest languages in the world, including the most common of the Slavic languages and the most common language in Europe, both geographically and by the number of native speakers.'
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
        'left-pinky': 'ф',
        'left-ring': 'ы',
        'left-middle': 'в',
        'left-pointer': 'а',
        'right-pointer': 'о',
        'right-middle': 'л',
        'right-ring': 'д',
        'right-pinky': 'ж'
    };

    function createHands() {
        handContainer.innerHTML = '';
        const handWrapper = document.createElement('div');
        handWrapper.className = 'hand-wrapper';
        Object.keys(homeKeys).forEach(fingerId => {
            const fingerEl = document.createElement('div');
            const handClass = fingerId.startsWith('left') ? 'left-hand' : 'right-hand';
            fingerEl.className = `finger ${handClass} ${fingerId.split('-')[1]}`;
            fingerEl.id = fingerId;
            handWrapper.appendChild(fingerEl);
        });
        handContainer.appendChild(handWrapper);
    }

    function createKeyboard() {
        const existingKeyboard = keyboardContainer.querySelector('#keyboard');
        if (existingKeyboard) existingKeyboard.remove();
        
        const keyboardEl = document.createElement('div');
        keyboardEl.id = 'keyboard';
        keyboardLayout.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.classList.add('keyboard-row');
            row.forEach(key => {
                const keyEl = document.createElement('div');
                keyEl.classList.add('key');
                if (key === ' ') keyEl.classList.add('space');
                keyEl.dataset.key = key;
                keyEl.textContent = key;
                rowEl.appendChild(keyEl);
            });
            keyboardEl.appendChild(rowEl);
        });
        keyboardContainer.appendChild(keyboardEl);
    }

    function setFingerPosition(fingerId, keyChar, isPressing) {
        const fingerEl = document.getElementById(fingerId);
        const keyEl = document.querySelector(`.key[data-key="${keyChar}"]`);
        if (!fingerEl || !keyEl) return;

        const keyRect = keyEl.getBoundingClientRect();
        const containerRect = handContainer.getBoundingClientRect();

        const x = keyRect.left - containerRect.left + (keyRect.width / 2) - (fingerEl.offsetWidth / 2);
        // If pressing, move down. If hovering, stay up.
        const y = isPressing ? keyRect.top - containerRect.top + 5 : keyRect.top - containerRect.top - 35;

        fingerEl.style.transform = `translate(${x}px, ${y}px)`;
        fingerEl.style.backgroundColor = isPressing ? 'rgba(25, 102, 198, 0.9)' : 'rgba(74, 144, 226, 0.7)';
    }

    function resetFingersToHome() {
        Object.entries(homeKeys).forEach(([fingerId, keyChar]) => {
            setFingerPosition(fingerId, keyChar, false); // false = hover
        });
    }

    function highlightKey(key) {
        const keyLower = key.toLowerCase();
        const keyEl = document.querySelector(`.key[data-key="${keyLower}"]`);
        if (!keyEl) return;

        keyEl.classList.add('highlight');
        
        // Reset all fingers to their base hovering position first.
        resetFingersToHome();

        // Then, move the designated finger to "press" the target key.
        const fingerId = fingerMap[keyLower];
        if (fingerId && fingerId !== 'thumb') {
            setFingerPosition(fingerId, keyLower, true); // true = press
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

        if (currentMode === 'chars') {
            const randomIndex = Math.floor(Math.random() * russian.chars.length);
            rawText = russian.chars[randomIndex];
        } else if (currentMode === 'words') {
            const keys = Object.keys(russian.words);
            const randomIndex = Math.floor(Math.random() * keys.length);
            rawText = keys[randomIndex];
            translation = russian.words[rawText];
            translationDisplay.textContent = translation;
            translationDisplay.style.display = 'block';
        } else if (currentMode === 'short-sentences') {
            const keys = Object.keys(russian.shortSentences);
            const randomIndex = Math.floor(Math.random() * keys.length);
            rawText = keys[randomIndex];
            translation = russian.shortSentences[rawText];
            translationDisplay.textContent = translation;
            translationDisplay.style.display = 'block';
        } else if (currentMode === 'long-sentences') {
            const keys = Object.keys(russian.longSentences);
            const randomIndex = Math.floor(Math.random() * keys.length);
            rawText = keys[randomIndex];
            translation = russian.longSentences[rawText];
            longTranslationContent.textContent = translation;
            longTranslationContainer.style.display = 'block';
        }

        practiceText = rawText;
        practiceTextForComparison = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        textDisplay.innerHTML = practiceText.split('').map(char => `<span>${char}</span>`).join('');

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
        keyboardContainer.style.display = 'flex';
        // A short delay ensures the UI is ready before positioning.
        setTimeout(() => {
            nextItem();
        }, 150);
    }

    textInput.addEventListener('input', () => {
        startTimer();
        const typedText = textInput.value;
        
        let html = '';
        let fullyCorrect = true;
        for (let i = 0; i < practiceTextForComparison.length; i++) {
            const originalChar = practiceText[i] || '';
            const comparisonChar = practiceTextForComparison[i];

            if (i < typedText.length) {
                if (typedText[i] === comparisonChar) {
                    html += `<span class="correct">${originalChar}</span>`;
                } else {
                    html += `<span class="incorrect">${originalChar}</span>`;
                    fullyCorrect = false;
                }
            } else {
                html += `<span>${originalChar}</span>`;
                fullyCorrect = false;
            }
        }
        textDisplay.innerHTML = html;

        totalStrokes = typedText.length;
        correctStrokes = (typedText.split('').filter((char, i) => char === practiceTextForComparison[i])).length;
        updateAccuracy();

        if (typedText.length < practiceTextForComparison.length) {
            highlightKey(practiceTextForComparison[typedText.length]);
        } else if (fullyCorrect) {
            setTimeout(nextItem, 200); // Brief pause on success
        } else {
             unhighlightAllKeys(); // If incorrect at the end, just show home position
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
