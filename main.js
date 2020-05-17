// Get document element
const textDisplay = document.querySelector('#text-display');
const inputField = document.querySelector('#input-field');
const canvas = document.createElement('canvas');
const favicon = document.querySelector('#favicon');
const redoButton = document.querySelector('#redo-button');
const barLanguage = document.querySelector("#barLanguage");
const barPunctuation = document.querySelector("#barPunctuation");
const barRWMP = document.querySelector("#barRWPM");
let ctx = canvas.getContext("2d");

// Initialize typing mode variables
let typingMode = 'wordcount';
let wordCount;
let timeCount;

// Initialize dynamic variables
let randomWords = [];
let wordList = [];
let currentWord = 0;
let correctKeys = 0;
let startDate = 0;
let timer;
let timerActive = false;
let punctuation = false;
let realTime = false;
let resultTimeout = null;

// Initialize favicon canvas
canvas.width = 64;
canvas.height = 64;
canvas.style.position = "absolute";
canvas.style.visibility = "hidden";
ctx.font = "Bold 56px Roboto Mono";
ctx.textAlign = "center";
ctx.textBaseline = "middle"

// Get cookies
getCookie('theme') === '' ? setTheme('light') : setTheme(getCookie('theme'));
getCookie('language') === '' ? setLanguage('english') : setLanguage(getCookie('language'));
getCookie('wordCount') === '' ? setWordCount(50) : setWordCount(getCookie('wordCount'));
getCookie('timeCount') === '' ? setTimeCount(60) : setTimeCount(getCookie('timeCount'));
getCookie('typingMode') === '' ? setTypingMode('wordcount') : setTypingMode(getCookie('typingMode'));
getCookie('punctuation') === '' ? setPunctuation('false') : setPunctuation(getCookie('punctuation'));
getCookie('realTime') === '' ? setRealTime('false') : setRealTime(getCookie('realTime'));



// Find a list of words and display it to textDisplay
function setText(e) {
	e = e || window.event;
	var keepWordList = e && e.shiftKey;

	// Reset
	if (!keepWordList) {
		wordList = [];
	}
	currentWord = 0;
	correctKeys = 0;
	inputField.value = '';
	timerActive = false;
	clearTimeout(timer);
	textDisplay.style.display = 'block';
	inputField.className = '';

	switch (typingMode) {
		case 'wordcount':
			textDisplay.style.height = 'auto';
			textDisplay.innerHTML = '';
			wordList = [];
			if (getCookie('language') === 'dots') {
				// initialize array of dots
				wordList = [...new Array(Number(wordCount))].map(() => randomWords[0]);
			} else {
				while (wordList.length < wordCount) {
					const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
					if (wordList[wordList.length - 1] !== randomWord || wordList[wordList.length - 1] === undefined) {
						if (!keepWordList) {
							wordList = [];
							while (wordList.length < wordCount) {
								const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
								if (wordList[wordList.length - 1] !== randomWord || wordList[wordList.length - 1] === undefined || getCookie('language') === 'dots') {
									wordList.push(randomWord);
								}
							}
						}
					}
				}
			}
			break;

		case 'time':
			textDisplay.style.height = '3.2rem';
			document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
			textDisplay.innerHTML = '';
			if (!keepWordList) {
				wordList = [];
				for (i = 0; i < 500; i++) {
					let n = Math.floor(Math.random() * randomWords.length);
					wordList.push(randomWords[n]);
				}
			}
	}

	if (punctuation) addPunctuations();
	showText();
	inputField.focus();
}

function addPunctuations() {
	if (wordList[0] !== undefined) {
		// Capitalize first word
		wordList[0] = wordList[0][0].toUpperCase() + wordList[0].slice(1);

		// Add comma, fullstop, question mark, exclamation mark, semicolon. Capitalize the next word
		for (i = 0; i < wordList.length; i++) {
			const ran = Math.random();
			if (i < wordList.length - 1) {
				if (ran < 0.03) {
					wordList[i] += ',';
				} else if (ran < 0.05) {
					wordList[i] += '.';
					wordList[i + 1] = wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
				} else if (ran < 0.06) {
					wordList[i] += '?';
					wordList[i + 1] = wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
				} else if (ran < 0.07) {
					wordList[i] += '!';
					wordList[i + 1] = wordList[i + 1][0].toUpperCase() + wordList[i + 1].slice(1);
				} else if (ran < 0.08) {
					wordList[i] += ';';
				}
			}
		}
		wordList[wordList.length - 1] += '.';

		// Add quotation marks
	}
}

// Display text to textDisplay
function showText() {
	wordList.forEach(word => {
		let span = document.createElement('span');
		span.innerHTML = word + ' ';
		textDisplay.appendChild(span);
	});
	textDisplay.firstChild.classList.add('highlight');
}

// Key is pressed in input field
inputField.addEventListener('keydown', e => {
	// Add wrong class to input field
	switch (typingMode) {
		case 'wordcount':
			if (currentWord < wordList.length) inputFieldClass();
		case 'time':
			if (timerActive) inputFieldClass();
	}

	function inputFieldClass() {
		if (e.key >= 'a' && e.key <= 'z' || (e.key === `'` || e.key === ',' || e.key === '.' || e.key === ';')) {
			let inputWordSlice = inputField.value + e.key;
			let currentWordSlice = wordList[currentWord].slice(0, inputWordSlice.length);
			inputField.className = inputWordSlice === currentWordSlice ? '' : 'wrong';
		} else if (e.key === 'Backspace') {
			let inputWordSlice = e.ctrlKey ? '' : inputField.value.slice(0, inputField.value.length - 1);
			let currentWordSlice = wordList[currentWord].slice(0, inputWordSlice.length);
			inputField.className = inputWordSlice === currentWordSlice ? '' : 'wrong';
		} else if (e.key === ' ') {
			inputField.className = '';
		}
	}

	// If it is the first character entered
	if (currentWord === 0 && inputField.value === '' && e.key >= '!' && e.key <= '~' && e.key.length === 1) {
		if (resultTimeout !== null) {
			clearTimeout(resultTimeout);
		}
		(function printResult() {
			if (realTime) {
				showResult();
			}
			if (typingMode !== "time" || (typingMode === "time" && timerActive)) {
				resultTimeout = setTimeout(printResult, 1000);
			}
		})();
		startDate = Date.now();
		switch (typingMode) {
			case 'time':
				if (!timerActive) {
					startTimer(timeCount);
					timerActive = true;
				}

				function startTimer(time) {
					if (time > 0) {
						document.querySelector(`#tc-${timeCount}`).innerHTML = time;
						timer = setTimeout(() => {
							time--;
							startTimer(time);
						}, 1000);
					} else {
						timerActive = false;
						textDisplay.style.display = 'none';
						inputField.className = '';
						document.querySelector(`#tc-${timeCount}`).innerHTML = timeCount;
						end();
						clearTimeout(timer);
					}
				}
		}
	}

	if (wordList[currentWord] !== undefined) {
		if (e.key >= "!" && e.key <= "~") {
			const word = `${inputField.value}${e.key}`;
			if (word[word.length - 1] === wordList[currentWord][word.length - 1]) {
				correctKeys += 1;
			}
		} else if (e.key === " ") {
			if (inputField.value !== wordList[currentWord]) {
				let i = 0;
				while (inputField.value[i] == wordList[currentWord][i]) {
					correctKeys -= 1;
					i += 1;
				}
			} else {
				correctKeys += 1;
			}
		}
	}

	// If it is the space key check the word and add correct/wrong class
	if (e.key === ' ') {
		e.preventDefault();

		if (inputField.value !== '') {
			// Scroll down text when reach new line
			if (typingMode === 'time') {
				const currentWordPosition = textDisplay.childNodes[currentWord].getBoundingClientRect();
				const nextWordPosition = textDisplay.childNodes[currentWord + 1].getBoundingClientRect();
				if (currentWordPosition.top < nextWordPosition.top) {
					for (i = 0; i < currentWord + 1; i++) textDisplay.childNodes[i].style.display = 'none';
				}
			}

			// If it is not the last word increment currentWord,
			if (currentWord < wordList.length - 1) {
				if (inputField.value === wordList[currentWord]) {
					textDisplay.childNodes[currentWord].classList.add('correct');
				} else {
					textDisplay.childNodes[currentWord].classList.add('wrong');
				}
				textDisplay.childNodes[currentWord + 1].classList.add('highlight');
			} else if (currentWord === wordList.length - 1) {
				textDisplay.childNodes[currentWord].classList.add('wrong');
				end();
			}

			inputField.value = '';
			currentWord++;
		}

		// Else if it is the last word and input word is correct show the result
	} else if (currentWord === wordList.length - 1) {
		if (inputField.value + e.key === wordList[currentWord]) {
			textDisplay.childNodes[currentWord].classList.add('correct');
			currentWord++;
			showResult();
			inputField.value += e.key;
			redoButton.focus()
			end();

		}
	}
});

function end() {
	if (resultTimeout !== null) {
		clearTimeout(resultTimeout);
	}
	resultTimeout = null;
	showResult();
}

// Calculate and display result
function showResult() {
	let minute, acc;
	let totalKeys = wordList.length === currentWord ? -1 : inputField.value.length;
	const wpm = Math.floor(correctKeys / 5 / ((Date.now() - startDate) / 1000 / 60));
	switch (typingMode) {
		case 'wordcount':
			minute = (Date.now() - startDate) / 1000 / 60;
			wordList.some((e, index) => {
				if (currentWord === index) {
					return true;
				}
				totalKeys += e.length + 1;
				return false;
			});
			acc = Math.floor((correctKeys / totalKeys) * 100);
			break;

		case 'time':
			minute = timeCount / 60;
			wordList.some((e, index) => {
				if (currentWord === index) {
					return true;
				}
				totalKeys += e.length + 1;
				return false;
			});
			acc = Math.min(Math.floor((correctKeys / totalKeys) * 100), 100);
	}
	document.querySelector('#wpmacc').innerHTML = `WPM: ${wpm || 0} / ACC: ${acc || 0}`;
}

// Command actions
document.addEventListener('keydown', e => {
	// Modifiers Windows: [Alt], Mac: [Cmd + Ctrl]
	if (e.altKey || (e.metaKey && e.ctrlKey)) {
		// [mod + t] => Change the theme
		if (e.key === 't') {
			setTheme(inputField.value);
		}
		// [mod + l] => Change the language
		if (e.key === 'l') {
			setLanguage(inputField.value);
		}

		// [mod + m] => Change the typing mode
		if (e.key === 'm') {
			setTypingMode(inputField.value);
		}

		// [mod + p] => Change punctuation active
		if (e.key === 'p') {
			setPunctuation(inputField.value);
		}

		// [mod + r] => Real time stats
		if (e.key === 'r') {
			setRealTime(inputField.value);
		}
	} else if (!document.querySelector('#theme-center').classList.contains('hidden') ||
		!document.querySelector('#language-center').classList.contains('hidden')) {
		if (e.key === 'Escape') {
			hideThemeCenter();
			hideLanguageCenter();
			inputField.focus();
		}
	} else if (e.key === 'Escape') {
		setText(e);
	}
});

function setTheme(_theme) {
	const theme = _theme.toLowerCase();
	fetch(`themes/${theme}.css`)
		.then(response => {
			if (response.status === 200) {
				response
					.text()
					.then(css => {
						setCookie('theme', theme, 90);
						document.querySelector('#theme').setAttribute('href', `themes/${theme}.css`);
						setText();
					})
					.catch(err => console.error(err));
			} else {
				console.log(`theme ${theme} is undefine`);
			}
		})
		.catch(err => console.error(err));
}

function setFavicon() {
	ctx.fillStyle = window.getComputedStyle(document.querySelector("#typing-area"), null).getPropertyValue("background-color");
	ctx.beginPath();
	ctx.arc(32, 32, 32, 0, 2 * Math.PI);
	ctx.fill();
	ctx.fillStyle = window.getComputedStyle(document.querySelector("#text-display"), null).getPropertyValue("color");
	ctx.fillText("t", 32, 32);
	ctx.fillRect(32, 32, 1, 1);

	favicon.href = canvas.toDataURL();
}

function setLanguage(_lang) {
	const lang = _lang.toLowerCase();

	if (!lang) {
		showErrorMessage("please type the language code for example german in the text box");
	}

	fetch('texts/random.json')
		.then(response => response.json())
		.then(json => {
			if (typeof json[lang] !== 'undefined') {
				randomWords = json[lang];
				setCookie('language', lang, 90);
				barLanguage.innerText = lang;

				if (lang === "arabic") {
					textDisplay.style.direction = "rtl"
					inputField.style.direction = "rtl"
				} else {
					textDisplay.style.direction = "ltr"
					inputField.style.direction = "ltr"
				}

				setText();
			} else {
				console.error(`language ${lang} is undefined`);
			}
		})
		.catch(err => console.error(err));
}

function setTypingMode(_mode) {
	if (resultTimeout !== null) {
		clearTimeout(resultTimeout);
		resultTimeout = null;
	}
	const mode = _mode.toLowerCase();
	switch (mode) {
		case 'wordcount':
			typingMode = mode;
			setCookie('typingMode', mode, 90);
			document.querySelector('#word-count').style.display = 'inline';
			document.querySelector('#time-count').style.display = 'none';
			setText();
			break;
		case 'time':
			typingMode = mode;
			setCookie('typingMode', mode, 90);
			document.querySelector('#word-count').style.display = 'none';
			document.querySelector('#time-count').style.display = 'inline';
			setText();
			break;
		default:
			console.error(`mode ${mode} is undefine`);
	}
}

function setPunctuation(_punc) {
	const punc = _punc.toLowerCase();
	if (punc === 'true') {
		punctuation = true;
		setCookie('punctuation', true, 90);
		setText();
	} else if (punc === 'false') {
		punctuation = false;
		setCookie('punctuation', false, 90);
		setText();
	}

	barPunctuation.innerText = booleanToYesNo(punc);
}

function setWordCount(wc) {
	setCookie('wordCount', wc, 90);
	wordCount = wc;
	document.querySelectorAll('#word-count > span').forEach(e => (e.style.borderBottom = ''));
	document.querySelector(`#wc-${wordCount}`).style.borderBottom = '2px solid';
	setText();
}

function setTimeCount(tc) {
	setCookie('timeCount', tc, 90);
	timeCount = tc;
	document.querySelectorAll('#time-count > span').forEach(e => {
		e.style.borderBottom = '';
		e.innerHTML = e.id.substring(3, 6);
	});
	document.querySelector(`#tc-${timeCount}`).style.borderBottom = '2px solid';
	setText();
}

function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	var expires = 'expires=' + d.toUTCString();
	document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function getCookie(cname) {
	var name = cname + '=';
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return '';
}

showAllThemes();

function showAllThemes() {
	fetch(`themes/theme-list.json`)
		.then(response => {
			if (response.status === 200) {
				response
					.text()
					.then(body => {
						let themes = JSON.parse(body);
						let keys = Object.keys(themes);
						let i;
						for (i = 0; i < keys.length; i++) {

							let theme = document.createElement('div');
							theme.setAttribute('class', 'theme-button');
							theme.setAttribute('onClick', `setTheme('${keys[i]}')`);
							theme.setAttribute('id', keys[i]);

							// set tabindex to current theme index + 4 for the test page
							theme.setAttribute('tabindex', i + 5);
							theme.addEventListener('keydown', e => {
								if (e.key === 'Enter') {
									setTheme(theme.id);
									inputField.focus();

								}
							})

							if (themes[keys[i]]['customHTML'] != undefined) {
								theme.style.background = themes[keys[i]]['background'];
								theme.innerHTML = themes[keys[i]]['customHTML']
							} else {
								theme.textContent = keys[i];
								theme.style.background = themes[keys[i]]['background'];
								theme.style.color = themes[keys[i]]['color'];
							}
							document.getElementById('theme-area').appendChild(theme);
						}
					})
					.catch(err => console.error(err));
			} else {
				console.log(`Cant find theme-list.json`);
			}
		})
		.catch(err => console.error(err));
}
// enter to open theme area
document.getElementById('show-themes').addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		showThemeCenter();
		inputField.focus();
	}
});

document.querySelector('body').addEventListener('transitionend', function () {
	setFavicon();
});

function setRealTime(value) {
	realTime = value === "true";
	setCookie('realTime', realTime, 90);
	barRWMP.innerText=booleanToYesNo(value);
	setText();
}

//Language change functions
showAllLanguages();

function showAllLanguages() {
	fetch("texts/random.json")
		.then(response => {
			if (response.status === 200) {
				response
					.text()
					.then(body => {
						let languages = JSON.parse(body);
						let keys = Object.keys(languages);
						let i;

						for (i = 0; i < keys.length; i++) {

							let language = document.createElement('div');
							language.setAttribute('class', 'theme-button');
							language.setAttribute('onClick', `setLanguage('${keys[i]}')`);
							language.setAttribute('id', keys[i]);

							language.setAttribute('tabindex', i + 5);
							language.addEventListener('keydown', e => {
								if (e.key === 'Enter') {
									setTheme(language.id);
									inputField.focus();
								}
							})

							language.textContent = keys[i];
							language.style.background = "rgb(250, 250, 250)";
							language.style.color = languages[keys[i]]['color'];
							document.getElementById('language-area').appendChild(language);
						}
					})
					.catch(err => console.error(err));
			} else {
				console.log(`Cant find languages`);
			}
		})
		.catch(err => console.error(err));
}

function showLanguageCenter() {
	document.getElementById('language-center').classList.remove('hidden');
	document.getElementById('theme-center').classList.add('hidden');
	document.getElementById('command-center').classList.add('hidden');
}

function hideLanguageCenter() {
	document.getElementById('language-center').classList.add('hidden');
	document.getElementById('command-center').classList.remove('hidden');
}

function toggleLanguageCenter(){
	if (document.querySelector('#language-center').classList.contains('hidden')) {
		showLanguageCenter();
	} else {
		hideLanguageCenter();
	}
}

function showThemeCenter() {
	document.getElementById('theme-center').classList.remove('hidden');
	document.getElementById('command-center').classList.add('hidden');
	document.getElementById('language-center').classList.add('hidden');
}

function hideThemeCenter() {
	document.getElementById('theme-center').classList.add('hidden');
	document.getElementById('command-center').classList.remove('hidden');
}

function toggleThemeCenter(){
	if (document.querySelector('#theme-center').classList.contains('hidden')) {
		showThemeCenter();
	} else {
		hideThemeCenter();
	}
}

function showErrorMessage(message) {
	if (!message)
		return;

	let element = document.querySelector('#error-message');

	if (element.classList.contains('hidden'))
		element.classList.remove('hidden');

	element.appendChild(document.createTextNode(message));
}

function booleanToYesNo(boolean){
	return boolean == "true"? "on" : "off";
}

function booleanInvert(boolean){
	return boolean == "true"? "false": "true";
}

// mouse actions
document.addEventListener('mouseup', e => {
	if (e.target.nodeName === 'BODY' && (!document.querySelector('#theme-center').classList.contains('hidden'))) {
		hideThemeCenter();
		inputField.focus();
	} else if (e.target.nodeName === 'BODY' && (!document.querySelector('#language-center').classList.contains('hidden'))) {
		hideLanguageCenter();
		inputField.focus();
	}
});

barLanguage.onclick = toggleLanguageCenter;

barPunctuation.onclick = function(){
	setPunctuation(booleanInvert(getCookie("punctuation")));
};

barRWMP.onclick = function(){
	setRealTime(booleanInvert(getCookie("realTime")));
};