class SmartPlanifyApp {
    constructor() {
        this.slots = [];
        this.tasks = [];
        this.currentSchedule = null;
        this.recognition = null;
        this.initEventListeners();
        this.initVoiceRecognition();
    }

    initEventListeners() {
        document.getElementById('slotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSlot();
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateSchedule();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportSchedule();
        });

        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        document.getElementById('parseVoiceBtn').addEventListener('click', () => {
            this.parseVoiceInput();
        });
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.lang = 'fr-FR';
            this.recognition.continuous = true;
            this.recognition.interimResults = true;

            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                document.getElementById('voiceText').value = transcript;
            };

            this.recognition.onerror = (event) => {
                console.error('Erreur reconnaissance vocale:', event.error);
                this.stopVoiceRecognition();
            };
        } else {
            document.getElementById('voiceBtn').disabled = true;
            document.getElementById('voiceBtn').textContent = '🚫 Non supporté';
        }
    }

    toggleVoiceRecognition() {
        const btn = document.getElementById('voiceBtn');
        
        if (btn.classList.contains('recording')) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        if (this.recognition) {
            this.recognition.start();
            const btn = document.getElementById('voiceBtn');
            btn.classList.add('recording');
            btn.textContent = '🛑 Arrêter';
        }
    }

    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
            const btn = document.getElementById('voiceBtn');
            btn.classList.remove('recording');
            btn.textContent = '🎤 Parler';
        }
    }

    async parseVoiceInput() {
        const text = document.getElementById('voiceText').value;
        if (!text.trim()) {
            alert('Veuillez saisir ou enregistrer du texte');
            return;
        }

        try {
            const response = await fetch('/api/voice-parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            if (response.ok) {
                this.tasks = data.tasks;
                this.updateTasksList();
                this.updateButtons();
                alert(`${data.tasks.length} tâches détectées par l'IA!`);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert('Erreur analyse IA: ' + error.message);
        }
    }

    addSlot() {
        const day = document.getElementById('day').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        if (!day || !startTime || !endTime) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        if (startTime >= endTime) {
            alert('L\'heure de fin doit être après l\'heure de début');
            return;
        }

        const slot = { day, start: startTime, end: endTime };
        this.slots.push(slot);
        this.updateSlotsList();
        this.clearForm();
        this.updateButtons();
    }

    removeSlot(index) {
        this.slots.splice(index, 1);
        this.updateSlotsList();
        this.updateButtons();
    }

    updateSlotsList() {
        const slotsList = document.getElementById('slotsList');
        
        if (this.slots.length === 0) {
            slotsList.innerHTML = '<p style="color: #a0aec0; font-style: italic;">Aucun créneau libre ajouté</p>';
            return;
        }

        slotsList.innerHTML = '<h3>📅 Créneaux libres:</h3>' + this.slots.map((slot, index) => `
            <div class="slot-item">
                <div class="slot-info">
                    <strong>${slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}</strong>: 
                    ${slot.start} - ${slot.end}
                </div>
                <button class="remove-btn" onclick="app.removeSlot(${index})">Supprimer</button>
            </div>
        `).join('');
    }

    updateTasksList() {
        const tasksList = document.getElementById('tasksList');
        
        if (this.tasks.length === 0) {
            tasksList.innerHTML = '';
            return;
        }

        tasksList.innerHTML = '<h3>🎯 Tâches détectées:</h3>' + this.tasks.map((task, index) => `
            <div class="task-item">
                <div class="task-info">
                    <strong>${task.type.charAt(0).toUpperCase() + task.type.slice(1)}</strong>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        Durée suggérée: ${task.duration} min
                    </div>
                </div>
                <button class="remove-btn" onclick="app.removeTask(${index})">Supprimer</button>
            </div>
        `).join('');
    }

    removeTask(index) {
        this.tasks.splice(index, 1);
        this.updateTasksList();
        this.updateButtons();
    }

    clearForm() {
        document.getElementById('day').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
    }

    updateButtons() {
        const hasSlots = this.slots.length > 0;
        document.getElementById('generateBtn').disabled = !hasSlots;
        document.getElementById('exportBtn').disabled = !this.currentSchedule;
    }

    async generateSchedule() {
        try {
            const voiceInput = document.getElementById('voiceText').value;
            
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    slots: this.slots,
                    tasks: this.tasks,
                    voice_input: voiceInput
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            this.currentSchedule = data;
            this.displaySmartSchedule(data);
            this.updateButtons();

        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }

    displaySmartSchedule(schedule) {
        this.displaySuggestions(schedule.suggestions || []);
        this.displayCalendar(schedule.calendar || {});
        
        const output = document.getElementById('scheduleOutput');
        output.innerHTML = `
            <div class="schedule-info">
                <p><strong>🤖 Planning IA généré:</strong> ${schedule.total_slots} créneaux</p>
                <p><strong>📅 Généré le:</strong> ${new Date(schedule.generated_at).toLocaleString('fr-FR')}</p>
                <p><strong>🧠 Tâches analysées:</strong> ${schedule.tasks?.length || 0}</p>
            </div>
        `;
    }

    displaySuggestions(suggestions) {
        const output = document.getElementById('suggestionsOutput');
        
        if (suggestions.length === 0) {
            output.innerHTML = '';
            return;
        }

        output.innerHTML = `
            <div class="suggestions-section">
                <h3>💡 Suggestions IA</h3>
                ${suggestions.map(suggestion => `
                    <div class="suggestion-item">
                        <div class="suggestion-task">${suggestion.task.charAt(0).toUpperCase() + suggestion.task.slice(1)}</div>
                        <div class="suggestion-time">
                            📍 ${suggestion.suggested_time.day.charAt(0).toUpperCase() + suggestion.suggested_time.day.slice(1)} 
                            ${suggestion.suggested_time.start} - ${suggestion.suggested_time.end}
                        </div>
                        <div class="suggestion-reason">💭 ${suggestion.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayCalendar(calendar) {
        const output = document.getElementById('scheduleOutput');
        const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        const calendarHTML = `
            <div class="schedule-grid">
                ${days.map(day => {
                    const dayItems = calendar[day] || [];
                    return `
                        <div class="day-schedule">
                            <div class="day-title">${day.charAt(0).toUpperCase() + day.slice(1)}</div>
                            ${dayItems.length > 0 
                                ? dayItems.map(item => `
                                    <div class="calendar-item calendar-${item.type}">
                                        <strong>${item.title}</strong><br>
                                        🕐 ${item.start} - ${item.end}
                                        ${item.reason ? `<br><small>💭 ${item.reason}</small>` : ''}
                                    </div>
                                `).join('')
                                : '<div class="empty-day">Journée libre</div>'
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        output.innerHTML += calendarHTML;
    }

    async exportSchedule() {
        if (!this.currentSchedule) {
            alert('Veuillez d\'abord générer un planning');
            return;
        }

        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.currentSchedule)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'export');
            }

            // Download JSON file
            const blob = new Blob([JSON.stringify(this.currentSchedule, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Planning exporté avec succès!');

        } catch (error) {
            alert('Erreur lors de l\'export: ' + error.message);
        }
    }
}

// Initialize the smart app
const app = new SmartPlanifyApp();