/**
 * AINTERCOM COCKPIT - Widget Timer
 * Timer avec START, PAUSE, RESET
 * Affiche 15:00 en gros chiffres digitaux
 */

class CockpitTimer {
    constructor() {
        this.totalSeconds = 15 * 60; // 15 minutes en secondes
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = false;
        this.intervalId = null;
        
        // Éléments DOM
        this.displayElement = document.getElementById('cockpit-timer-display');
        this.startButton = document.getElementById('cockpit-timer-start');
        this.pauseButton = document.getElementById('cockpit-timer-pause');
        this.resetButton = document.getElementById('cockpit-timer-reset');
        
        // Initialiser l'affichage
        this.updateDisplay();
        
        // Ajouter les événements
        this.bindEvents();
    }
    
    /**
     * Formater les secondes en MM:SS
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Mettre à jour l'affichage
     */
    updateDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.remainingSeconds);
            
            // Changer la couleur selon le temps restant
            if (this.remainingSeconds <= 60) {
                // Moins d'une minute : rouge
                this.displayElement.style.color = 'var(--cockpit-danger)';
                this.displayElement.classList.add('cockpit-pulse');
            } else if (this.remainingSeconds <= 300) {
                // Moins de 5 minutes : orange
                this.displayElement.style.color = 'var(--cockpit-warning)';
                this.displayElement.classList.remove('cockpit-pulse');
            } else {
                // Normal : blanc
                this.displayElement.style.color = 'var(--cockpit-text)';
                this.displayElement.classList.remove('cockpit-pulse');
            }
        }
    }
    
    /**
     * Démarrer le timer
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        
        // Mettre à jour les classes CSS
        this.startButton.classList.remove('cockpit-btn-primary');
        this.startButton.classList.add('cockpit-btn-secondary');
        this.pauseButton.classList.remove('cockpit-btn-secondary');
        this.pauseButton.classList.add('cockpit-btn-primary');
        
        // Démarrer l'intervalle
        this.intervalId = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateDisplay();
                
                // Émettre un événement pour les autres composants
                this.emitTimeUpdate();
            } else {
                // Timer terminé
                this.stop();
                this.playFinishSound();
                this.showFinishNotification();
            }
        }, 1000);
        
        console.log('⏱️ Timer démarré');
    }
    
    /**
     * Mettre en pause le timer
     */
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        
        // Mettre à jour les classes CSS
        this.startButton.classList.remove('cockpit-btn-secondary');
        this.startButton.classList.add('cockpit-btn-primary');
        this.pauseButton.classList.remove('cockpit-btn-primary');
        this.pauseButton.classList.add('cockpit-btn-secondary');
        
        // Arrêter l'intervalle
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('⏸️ Timer en pause');
    }
    
    /**
     * Réinitialiser le timer
     */
    reset() {
        this.pause();
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
        
        console.log('🔄 Timer réinitialisé');
    }
    
    /**
     * Arrêter complètement le timer
     */
    stop() {
        this.pause();
        console.log('⏹️ Timer arrêté');
    }
    
    /**
     * Émettre un événement de mise à jour du temps
     */
    emitTimeUpdate() {
        const event = new CustomEvent('cockpit-timer-update', {
            detail: {
                remainingSeconds: this.remainingSeconds,
                formattedTime: this.formatTime(this.remainingSeconds),
                percentage: (this.remainingSeconds / this.totalSeconds) * 100
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Jouer un son de fin
     */
    playFinishSound() {
        try {
            // Créer un contexte audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configurer le son
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            // Jouer le son
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 1);
            
            console.log('🔔 Son de fin joué');
        } catch (error) {
            console.warn('⚠️ Impossible de jouer le son de fin:', error);
        }
    }
    
    /**
     * Afficher une notification de fin
     */
    showFinishNotification() {
        // Créer une notification toast
        const toast = document.createElement('div');
        toast.className = 'cockpit-toast cockpit-toast-warning';
        toast.innerHTML = `
            <div class="cockpit-toast-icon">
                <i class="fas fa-bell"></i>
            </div>
            <div class="cockpit-toast-content">
                <div class="cockpit-toast-title">Timer terminé</div>
                <div class="cockpit-toast-message">Le compte à rebours de 15 minutes est terminé.</div>
            </div>
            <button class="cockpit-toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Ajouter au document
        document.body.appendChild(toast);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
        
        console.log('📢 Notification de fin affichée');
    }
    
    /**
     * Lier les événements aux boutons
     */
    bindEvents() {
        if (this.startButton) {
            this.startButton.addEventListener('click', () => this.start());
        }
        
        if (this.pauseButton) {
            this.pauseButton.addEventListener('click', () => this.pause());
        }
        
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => this.reset());
        }
        
        // Raccourcis clavier
        document.addEventListener('keydown', (event) => {
            // Espace : start/pause
            if (event.code === 'Space' && !event.target.matches('input, textarea, select')) {
                event.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }
            
            // R : reset
            if (event.code === 'KeyR' && event.ctrlKey) {
                event.preventDefault();
                this.reset();
            }
        });
    }
    
    /**
     * Définir un temps personnalisé (en minutes)
     */
    setTime(minutes) {
        this.pause();
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
        
        console.log(`⏱️ Timer défini à ${minutes} minutes`);
    }
    
    /**
     * Obtenir le temps restant
     */
    getRemainingTime() {
        return {
            seconds: this.remainingSeconds,
            formatted: this.formatTime(this.remainingSeconds),
            percentage: (this.remainingSeconds / this.totalSeconds) * 100
        };
    }
    
    /**
     * Vérifier si le timer est en cours
     */
    isActive() {
        return this.isRunning;
    }
}

// Initialiser le timer quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les éléments du timer existent
    if (document.getElementById('cockpit-timer-display')) {
        window.cockpitTimer = new CockpitTimer();
        console.log('✅ Timer cockpit initialisé');
    }
});

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CockpitTimer;
}