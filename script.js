// CPS Test JavaScript
class CPSTest {
    constructor() {
        this.isActive = false;
        this.timeLeft = 10;
        this.selectedTime = 10;
        this.clickCount = 0;
        this.cps = 0;
        this.bestScore = this.loadBestScore();
        this.isFinished = false;
        this.showResults = false;
        this.cooldownTime = 0;
        this.showBlinkingMessage = false;
        this.intervalRef = null;
        this.cooldownRef = null;
        this.clickHistory = [];
        
        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        // Time selection buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTime(parseInt(e.target.dataset.time));
            });
        });

        // Click button
        document.getElementById('clickButton').addEventListener('click', () => {
            this.handleClick();
        });

        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetTest();
        });
    }

    loadBestScore() {
        const saved = localStorage.getItem('bestCPS');
        return saved ? parseFloat(saved) : 0;
    }

    saveBestScore() {
        localStorage.setItem('bestCPS', this.bestScore.toString());
    }

    playStartSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    startTimer() {
        this.intervalRef = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.finishTest();
            }
        }, 1000);
    }

    startCooldown() {
        this.cooldownTime = 3;
        this.showBlinkingMessage = false;
        this.updateDisplay();
        
        this.cooldownRef = setInterval(() => {
            this.cooldownTime--;
            this.updateDisplay();
            
            if (this.cooldownTime <= 0) {
                this.showBlinkingMessage = true;
                clearInterval(this.cooldownRef);
                this.updateDisplay();
            }
        }, 1000);
    }

    handleClick() {
        if (this.isFinished && this.cooldownTime > 0) {
            return; // Button is disabled during cooldown
        }
        
        if (this.isFinished && this.cooldownTime === 0) {
            this.resetTest();
            return;
        }
        
        if (!this.isActive && this.timeLeft === this.selectedTime) {
            // Start the test
            this.playStartSound();
            this.isActive = true;
            this.clickCount = 1;
            this.clickHistory = [Date.now()];
            this.isFinished = false;
            this.showResults = false;
            this.showBlinkingMessage = false;
            this.cooldownTime = 0;
            this.startTimer();
        } else if (this.isActive) {
            // Continue clicking
            this.clickCount++;
            this.clickHistory.push(Date.now());
        }
        
        this.updateDisplay();
    }

    finishTest() {
        this.isActive = false;
        this.isFinished = true;
        this.showResults = true;
        
        clearInterval(this.intervalRef);
        
        // Calculate CPS
        this.cps = this.clickCount / this.selectedTime;
        
        // Update best score
        if (this.cps > this.bestScore) {
            this.bestScore = this.cps;
            this.saveBestScore();
        }
        
        // Start cooldown
        this.startCooldown();
        
        this.updateDisplay();
    }

    resetTest() {
        this.isActive = false;
        this.timeLeft = this.selectedTime;
        this.clickCount = 0;
        this.cps = 0;
        this.isFinished = false;
        this.showResults = false;
        this.cooldownTime = 0;
        this.showBlinkingMessage = false;
        this.clickHistory = [];
        
        clearInterval(this.intervalRef);
        clearInterval(this.cooldownRef);
        
        this.updateDisplay();
    }

    changeTime(time) {
        this.selectedTime = time;
        this.resetTest();
        
        // Update time button styles
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.className = 'time-btn p-3 rounded-lg border-2 transition-all border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-800/50';
        });
        
        document.querySelector(`[data-time="${time}"]`).classList.add('active');
        document.querySelector(`[data-time="${time}"]`).className = 'time-btn p-3 rounded-lg border-2 transition-all border-green-500 bg-green-500/20 text-green-300 active';
    }

    getPerformanceRating(cpsValue) {
        if (cpsValue >= 12) return { text: 'Legendary', class: 'rating-legendary' };
        if (cpsValue >= 10) return { text: 'Excellent', class: 'rating-excellent' };
        if (cpsValue >= 8) return { text: 'Very Good', class: 'rating-very-good' };
        if (cpsValue >= 6) return { text: 'Good', class: 'rating-good' };
        if (cpsValue >= 4) return { text: 'Average', class: 'rating-average' };
        return { text: 'Below Average', class: 'rating-below-average' };
    }

    updateDisplay() {
        // Update time left
        document.getElementById('timeLeft').textContent = `${this.timeLeft}s`;
        
        // Update click count
        document.getElementById('clickCount').textContent = this.clickCount;
        
        // Update best score
        document.getElementById('bestScore').textContent = this.bestScore.toFixed(2);
        
        // Update states
        document.getElementById('readyState').classList.toggle('hidden', this.isActive || this.isFinished);
        document.getElementById('activeState').classList.toggle('hidden', !this.isActive);
        document.getElementById('finishedState').classList.toggle('hidden', !this.isFinished);
        document.getElementById('currentCPS').classList.toggle('hidden', !this.isActive);
        document.getElementById('resultsSection').classList.toggle('hidden', !this.showResults);
        
        // Update current CPS during test
        if (this.isActive) {
            const currentCPS = this.clickCount / (this.selectedTime - this.timeLeft) || 0;
            document.getElementById('currentCPSValue').textContent = currentCPS.toFixed(2);
        }
        
        // Update finished state
        if (this.isFinished) {
            document.getElementById('finalCPS').textContent = this.cps.toFixed(2);
            
            const performance = this.getPerformanceRating(this.cps);
            const ratingElement = document.getElementById('performanceRating');
            ratingElement.textContent = performance.text;
            ratingElement.className = `px-4 py-2 rounded-full font-semibold text-sm inline-block ${performance.class}`;
            
            // Update cooldown message
            document.getElementById('cooldownMessage').classList.toggle('hidden', this.cooldownTime <= 0);
            document.getElementById('cooldownTime').textContent = this.cooldownTime;
            
            // Update blinking message
            document.getElementById('blinkingMessage').classList.toggle('hidden', !this.showBlinkingMessage);
        }
        
        // Update click button
        const clickButton = document.getElementById('clickButton');
        clickButton.disabled = this.isFinished && this.cooldownTime > 0;
        
        let buttonText = 'START TEST';
        let buttonClass = 'w-80 h-32 rounded-xl text-white font-bold text-xl transition-all transform border-2 border-green-500/50 hover:shadow-xl hover:shadow-green-500/30';
        
        if (this.isFinished && this.cooldownTime > 0) {
            buttonText = `WAIT ${this.cooldownTime}S`;
            buttonClass += ' bg-gray-600 cursor-not-allowed opacity-50';
        } else if (this.isActive) {
            buttonText = 'CLICK!';
            buttonClass += ' bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95 shadow-lg shadow-green-500/20';
        } else if (this.isFinished) {
            buttonText = 'CLICK TO RESTART';
            buttonClass += ' bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 shadow-lg shadow-blue-500/20';
        } else {
            buttonClass += ' bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:scale-95 shadow-lg shadow-green-500/20';
        }
        
        clickButton.textContent = buttonText;
        clickButton.className = buttonClass;
        
        // Update results section
        if (this.showResults) {
            document.getElementById('totalClicks').textContent = this.clickCount;
            document.getElementById('testDuration').textContent = `${this.selectedTime}s`;
            document.getElementById('yourCPS').textContent = this.cps.toFixed(2);
            document.getElementById('bestScoreResult').textContent = this.bestScore.toFixed(2);
            
            const performanceResult = this.getPerformanceRating(this.cps);
            const ratingResultElement = document.getElementById('performanceRatingResult');
            ratingResultElement.textContent = performanceResult.text;
            ratingResultElement.className = `px-6 py-3 rounded-full font-bold text-lg mb-4 border border-green-500/20 ${performanceResult.class}`;
            
            // Update performance bar
            const percentage = Math.min((this.cps / 15) * 100, 100);
            document.getElementById('performanceBar').style.width = `${percentage}%`;
            document.getElementById('performanceText').textContent = this.cps.toFixed(2);
        }
    }
}

// Initialize the CPS Test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CPSTest();
});