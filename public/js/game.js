/* ==========================================================================
   💖 KUCHU-MUCHU COUPLE GAMES LOGIC 💖
   ========================================================================== */

// 1. GAME DATABASES
const QUIZ_QUESTIONS = [
    {
        question: "Where would be our absolute dream vacation spot?",
        options: ["Cozy Alpine Cabin ❄️", "Sun-kissed Tropical Island 🏝️", "Bustling Historic City 🏰", "Wild Safari Camping ⛺"]
    },
    {
        question: "What is our favorite cozy activity together?",
        options: ["Binge-watching shows 🍿", "Cooking a new recipe 🍳", "Cuddling & talking for hours 💬", "Playing games/boardgames 🎮"]
    },
    {
        question: "Who is more likely to fall asleep first during a movie night?",
        options: ["Definitely Me! 😴", "Definitely my Partner! 💤", "Both of us (we're tired) 🥱", "Neither (we watch to the end) 🎬"]
    },
    {
        question: "What's our ideal romantic dinner?",
        options: ["Fancy candlelight restaurant 🍷", "Homemade cooked dinner 🍝", "Street food & late night drive 🍔", "Breakfast in bed for dinner 🥞"]
    },
    {
        question: "What's the best love language we share?",
        options: ["Physical Touch (Cuddles) 🤗", "Words of Affirmation (Sweet notes) ✍️", "Quality Time (Being together) ⏱️", "Acts of Service (Doing favors) 🛠️"]
    }
];

const TRUTH_PROMPTS = [
    "What was the exact moment you first realized you were falling in love with me?",
    "What is a silly habit of mine that you secretly find absolutely adorable?",
    "If we could freeze time for a whole day, what would you want us to do?",
    "What's your absolute favorite physical feature of mine?",
    "What is a dream about our future that you haven't told me yet?",
    "What song reminds you of me the most, and why?"
];

const DARE_PROMPTS = [
    "Sing a romantic love song for 30 seconds using a funny baby/cartoon voice!",
    "Stare deeply into my eyes for 15 seconds without blinking or smiling!",
    "Blow me three different styles of kisses: a cute pop, a dramatic wind-blown, and a passionate wink-kiss!",
    "Give me a detailed description of your dream date night with me, starting from the second you pick me up.",
    "Do your best and funniest impression of how I talk when I'm hungry or sleepy!",
    "Say 'I love you' in 3 different foreign languages right now!"
];

const WYR_PROMPTS = [
    {
        optionA: "Spend a weekend in a cozy log cabin with no internet 🏕️",
        optionB: "Spend a weekend in a luxury suite in a bustling city 🏙️"
    },
    {
        optionA: "Always have to brush your partner's hair before bed 💇",
        optionB: "Always have to give your partner foot massages 👣"
    },
    {
        optionA: "Know what your partner is thinking at any moment 🧠",
        optionB: "Know what your partner is dreaming every night 💤"
    },
    {
        optionA: "Cook a complex, delicious 3-course dinner together 👩‍🍳",
        optionB: "Order takeout and build a massive living-room blanket fort 🏰"
    },
    {
        optionA: "Always hold hands when walking outside 🤝",
        optionB: "Always match colors or outfits when going out 👕"
    }
];

export class GameController {
    constructor(peerManager, app) {
        this.peerManager = peerManager;
        this.app = app;
        
        // Game States
        this.currentQuizIdx = 0;
        this.localQuizAnswer = null;
        this.remoteQuizAnswer = null;

        this.currentWyrIdx = 0;
        this.localWyrAnswer = null;
        this.remoteWyrAnswer = null;

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        // Main Panels
        this.gamesMenu = document.getElementById('games-menu');
        this.quizSession = document.getElementById('quiz-session');
        this.truthSession = document.getElementById('truth-session');
        this.wyrSession = document.getElementById('wyr-session');

        // Main Entry Buttons
        this.startQuizBtn = document.getElementById('start-quiz-btn');
        this.startTruthBtn = document.getElementById('start-truth-btn');
        this.startWyrBtn = document.getElementById('start-wyr-btn');

        // Back Buttons
        this.backQuizBtn = document.getElementById('back-to-games-quiz');
        this.backTruthBtn = document.getElementById('back-to-games-truth');
        this.backWyrBtn = document.getElementById('back-to-games-wyr');

        // Game UI Elements: Quiz
        this.quizQuestionText = document.getElementById('quiz-question-text');
        this.quizQNum = document.getElementById('quiz-q-num');
        this.quizOptionsContainer = document.getElementById('quiz-options-container');
        this.quizResultsPanel = document.getElementById('quiz-results-panel');
        this.localQuizChoice = document.getElementById('local-quiz-choice');
        this.remoteQuizChoice = document.getElementById('remote-quiz-choice');
        this.quizVerdict = document.getElementById('quiz-verdict');
        this.nextQuizBtn = document.getElementById('next-quiz-btn');

        // Game UI Elements: Truth/Dare
        this.todChoiceScreen = document.getElementById('tod-choice-screen');
        this.todContentScreen = document.getElementById('tod-content-screen');
        this.todTruthBtn = document.getElementById('tod-truth-btn');
        this.todDareBtn = document.getElementById('tod-dare-btn');
        this.todBadge = document.getElementById('tod-badge');
        this.todPromptText = document.getElementById('tod-prompt-text');
        this.todDoneBtn = document.getElementById('tod-done-btn');

        // Game UI Elements: Would You Rather
        this.wyrOptionA = document.getElementById('wyr-option-a');
        this.wyrOptionB = document.getElementById('wyr-option-b');
        this.wyrResultsPanel = document.getElementById('wyr-results-panel');
        this.wyrLocalPick = document.getElementById('wyr-local-pick');
        this.wyrRemotePick = document.getElementById('wyr-remote-pick');
        this.wyrMatchIndicator = document.getElementById('wyr-match-indicator');
        this.nextWyrBtn = document.getElementById('next-wyr-btn');
    }

    bindEvents() {
        // Navigation clicks
        this.startQuizBtn.addEventListener('click', () => this.switchGame('quiz'));
        this.startTruthBtn.addEventListener('click', () => this.switchGame('truth'));
        this.startWyrBtn.addEventListener('click', () => this.switchGame('wyr'));

        this.backQuizBtn.addEventListener('click', () => this.exitGame());
        this.backTruthBtn.addEventListener('click', () => this.exitGame());
        this.backWyrBtn.addEventListener('click', () => this.exitGame());

        // Quiz interactions
        this.nextQuizBtn.addEventListener('click', () => {
            this.currentQuizIdx = (this.currentQuizIdx + 1) % QUIZ_QUESTIONS.length;
            this.peerManager.sendData({ type: 'quiz-next', idx: this.currentQuizIdx });
            this.loadQuizQuestion(this.currentQuizIdx);
        });

        // Truth or dare interactions
        this.todTruthBtn.addEventListener('click', () => this.selectTod('truth'));
        this.todDareBtn.addEventListener('click', () => this.selectTod('dare'));
        this.todDoneBtn.addEventListener('click', () => {
            this.peerManager.sendData({ type: 'tod-done' });
            this.resetTod();
        });

        // Would You Rather interactions
        this.wyrOptionA.addEventListener('click', () => this.selectWyr('A'));
        this.wyrOptionB.addEventListener('click', () => this.selectWyr('B'));
        this.nextWyrBtn.addEventListener('click', () => {
            this.currentWyrIdx = (this.currentWyrIdx + 1) % WYR_PROMPTS.length;
            this.peerManager.sendData({ type: 'wyr-next', idx: this.currentWyrIdx });
            this.loadWyrPrompt(this.currentWyrIdx);
        });
    }

    /**
     * Toggles visibility of game session panels
     */
    showMenuOnly() {
        this.gamesMenu.style.display = 'block';
        this.quizSession.style.display = 'none';
        this.truthSession.style.display = 'none';
        this.wyrSession.style.display = 'none';
    }

    switchGame(gameType, remoteAction = false) {
        if (!remoteAction) {
            // Inform partner that we are starting this activity
            this.peerManager.sendData({ type: 'game-start', game: gameType });
        }

        this.gamesMenu.style.display = 'none';
        this.quizSession.style.display = gameType === 'quiz' ? 'block' : 'none';
        this.truthSession.style.display = gameType === 'truth' ? 'block' : 'none';
        this.wyrSession.style.display = gameType === 'wyr' ? 'block' : 'none';

        if (gameType === 'quiz') {
            this.currentQuizIdx = 0;
            this.loadQuizQuestion(0);
        } else if (gameType === 'truth') {
            this.resetTod();
        } else if (gameType === 'wyr') {
            this.currentWyrIdx = 0;
            this.loadWyrPrompt(0);
        }
    }

    exitGame(remoteAction = false) {
        if (!remoteAction) {
            this.peerManager.sendData({ type: 'game-exit' });
        }
        this.showMenuOnly();
        this.app.showToast("Left the game session.", "info");
    }

    // ==========================================================================
    // GAME MODULE: COUPLE QUIZ
    // ==========================================================================
    loadQuizQuestion(idx) {
        this.currentQuizIdx = idx;
        this.localQuizAnswer = null;
        this.remoteQuizAnswer = null;

        const data = QUIZ_QUESTIONS[idx];
        this.quizQNum.textContent = idx + 1;
        this.quizQuestionText.textContent = data.question;
        
        // Hide result, show options
        this.quizResultsPanel.style.display = 'none';
        this.nextQuizBtn.style.display = 'none';
        this.quizOptionsContainer.style.display = 'flex';
        this.quizOptionsContainer.innerHTML = '';

        data.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => this.selectQuizOption(opt));
            this.quizOptionsContainer.appendChild(btn);
        });
    }

    selectQuizOption(opt) {
        // Disable other buttons immediately
        const buttons = this.quizOptionsContainer.querySelectorAll('.quiz-opt-btn');
        buttons.forEach(b => {
            b.disabled = true;
            if (b.textContent === opt) b.classList.add('selected');
        });

        this.localQuizAnswer = opt;
        this.localQuizChoice.textContent = opt;

        // Notify partner
        this.peerManager.sendData({
            type: 'quiz-answer',
            idx: this.currentQuizIdx,
            answer: opt
        });

        this.checkQuizMatch();
    }

    checkQuizMatch() {
        if (this.localQuizAnswer !== null) {
            // Toggle view of result panel partially
            this.quizResultsPanel.style.display = 'flex';
            
            if (this.remoteQuizAnswer === null) {
                this.remoteQuizChoice.textContent = "Waiting for partner... ⏳";
                this.quizVerdict.textContent = "";
            } else {
                this.remoteQuizChoice.textContent = this.remoteQuizAnswer;
                
                // Compare choices
                if (this.localQuizAnswer === this.remoteQuizAnswer) {
                    this.quizVerdict.innerHTML = "Match! 💖 Double Heartbeat!";
                    this.app.triggerHeartbeatEffect(true); // Local trigger
                } else {
                    this.quizVerdict.innerHTML = "A perfect mismatch! 💕 Ask them why!";
                }
                this.nextQuizBtn.style.display = 'block';
            }
        }
    }

    // ==========================================================================
    // GAME MODULE: TRUTH OR DARE
    // ==========================================================================
    resetTod() {
        this.todChoiceScreen.style.display = 'block';
        this.todContentScreen.style.display = 'none';
    }

    selectTod(category, remotePrompt = null) {
        let selectedPrompt = remotePrompt;
        
        if (!selectedPrompt) {
            const list = category === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
            selectedPrompt = list[Math.floor(Math.random() * list.length)];
            
            // Broadcast the prompt
            this.peerManager.sendData({
                type: 'tod-pick',
                category: category,
                prompt: selectedPrompt
            });
        }

        this.todChoiceScreen.style.display = 'none';
        this.todContentScreen.style.display = 'flex';
        
        this.todBadge.textContent = category === 'truth' ? 'Truth 💬' : 'Dare 😈';
        this.todBadge.style.background = category === 'truth' ? 'var(--color-secondary)' : 'var(--color-love)';
        
        this.todPromptText.textContent = selectedPrompt;
    }

    // ==========================================================================
    // GAME MODULE: WOULD YOU RATHER
    // ==========================================================================
    loadWyrPrompt(idx) {
        this.currentWyrIdx = idx;
        this.localWyrAnswer = null;
        this.remoteWyrAnswer = null;

        const prompt = WYR_PROMPTS[idx];
        this.wyrOptionA.textContent = prompt.optionA;
        this.wyrOptionB.textContent = prompt.optionB;

        this.wyrOptionA.disabled = false;
        this.wyrOptionB.disabled = false;
        this.wyrOptionA.classList.remove('selected');
        this.wyrOptionB.classList.remove('selected');

        this.wyrResultsPanel.style.display = 'none';
    }

    selectWyr(pick) {
        this.localWyrAnswer = pick;
        this.wyrOptionA.disabled = true;
        this.wyrOptionB.disabled = true;

        if (pick === 'A') {
            this.wyrOptionA.classList.add('selected');
            this.wyrLocalPick.textContent = this.wyrOptionA.textContent;
        } else {
            this.wyrOptionB.classList.add('selected');
            this.wyrLocalPick.textContent = this.wyrOptionB.textContent;
        }

        // Notify partner
        this.peerManager.sendData({
            type: 'wyr-choice',
            idx: this.currentWyrIdx,
            choice: pick
        });

        this.checkWyrMatch();
    }

    checkWyrMatch() {
        if (this.localWyrAnswer !== null) {
            this.wyrResultsPanel.style.display = 'flex';

            if (this.remoteWyrAnswer === null) {
                this.wyrRemotePick.textContent = "Waiting for partner... ⏳";
                this.wyrMatchIndicator.textContent = "";
            } else {
                const prompt = WYR_PROMPTS[this.currentWyrIdx];
                this.wyrRemotePick.textContent = this.remoteWyrAnswer === 'A' ? prompt.optionA : prompt.optionB;

                if (this.localWyrAnswer === this.remoteWyrAnswer) {
                    this.wyrMatchIndicator.textContent = "Great minds think alike! 💖";
                    this.app.triggerHeartbeatEffect(true);
                } else {
                    this.wyrMatchIndicator.textContent = "Opposites attract! ✨ Explain your choice!";
                }
            }
        }
    }

    // ==========================================================================
    // NETWORK INPUT RECEIVER
    // ==========================================================================
    handleIncomingGamePacket(packet) {
        console.log("[GameController] Incoming packet:", packet);

        switch (packet.type) {
            case 'game-start':
                this.switchGame(packet.game, true);
                this.app.showToast(`Partner started a game of ${packet.game}!`, "love");
                break;
            case 'game-exit':
                this.exitGame(true);
                break;
            
            // Quiz
            case 'quiz-answer':
                if (packet.idx === this.currentQuizIdx) {
                    this.remoteQuizAnswer = packet.answer;
                    this.checkQuizMatch();
                }
                break;
            case 'quiz-next':
                this.currentQuizIdx = packet.idx;
                this.loadQuizQuestion(packet.idx);
                break;
            
            // Truth or Dare
            case 'tod-pick':
                this.selectTod(packet.category, packet.prompt);
                break;
            case 'tod-done':
                this.resetTod();
                this.app.showToast("Partner completed the card!", "love");
                break;
            
            // Would You Rather
            case 'wyr-choice':
                if (packet.idx === this.currentWyrIdx) {
                    this.remoteWyrAnswer = packet.choice;
                    this.checkWyrMatch();
                }
                break;
            case 'wyr-next':
                this.currentWyrIdx = packet.idx;
                this.loadWyrPrompt(packet.idx);
                break;
        }
    }
}
