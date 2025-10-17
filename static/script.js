// static/script.js (full)
// Front-end logic to add slots, parse voice via server endpoint and use an AI chatbot

let slots = []; // { day, start, end, duration }
let tasks = []; // { type, text, priority, duration, day?, start?, end? }

// DOM refs
const slotForm = document.getElementById('slotForm');
const slotsList = document.getElementById('slotsList');
const tasksList = document.getElementById('tasksList');
const parseVoiceBtn = document.getElementById('parseVoiceBtn');
const voiceText = document.getElementById('voiceText');
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const suggestionsOutput = document.getElementById('suggestionsOutput');
const scheduleOutput = document.getElementById('scheduleOutput');

// Chatbot refs
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
// const aiEnable is removed

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function formatSlot(slot) { return `${capitalize(slot.day)} — ${slot.start} → ${slot.end}`; }

function renderSlots() {
    if (!slotsList) return;
    if (slots.length === 0) {
        slotsList.innerHTML = '<p>Aucun créneau ajouté.</p>';
        generateBtn.disabled = true;
        exportBtn.disabled = true;
        return;
    }
    generateBtn.disabled = false;
    exportBtn.disabled = false;
    let html = '<ul>' + slots.map((s, idx) => `\n<li>${formatSlot(s)} <button data-idx="${idx}" class="remove-slot">Supprimer</button></li>`).join('') + '\n</ul>';
    slotsList.innerHTML = html;
}

function renderTasks() {
    if (!tasksList) return;
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p>Aucune tâche ajoutée.</p>';
        return;
    }
    let html = '<ul>' + tasks.map((t, idx) => `\n<li>${t.type ? capitalize(t.type) : 'Tâche'}${t.day ? ' ('+capitalize(t.day)+')' : ''} — ${t.text || ''} <button data-idx="${idx}" class="remove-task">Supprimer</button></li>`).join('') + '\n</ul>';
    tasksList.innerHTML = html;
}

function calculateDuration(start, end) {
    const s = start.split(':').map(Number);
    const e = end.split(':').map(Number);
    const startDate = new Date(0,0,0,s[0],s[1]);
    const endDate = new Date(0,0,0,e[0],e[1]);
    const diffMs = endDate - startDate;
    const minutes = diffMs / 60000;
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

// Add slot form handler
if (slotForm) {
    slotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const day = document.getElementById('day').value;
        const start = document.getElementById('startTime').value;
        const end = document.getElementById('endTime').value;
        if (!day || !start || !end) return alert('Remplissez tous les champs.');
        if (end <= start) return alert("L'heure de fin doit être après l'heure de début.");
        // The server-side will calculate duration and validate time format, but we keep a local one for display/consistency
        const duration = calculateDuration(start, end); 
        const slot = { day: day.toLowerCase(), start, end, duration };
        slots.push(slot);
        renderSlots();
        slotForm.reset();
    });
}

// Remove handlers (delegation)
document.addEventListener('click', (e) => {
    if (e.target && e.target.matches('.remove-slot')) {
        const idx = parseInt(e.target.dataset.idx);
        slots.splice(idx, 1);
        renderSlots();
    }
    if (e.target && e.target.matches('.remove-task')) {
        const idx = parseInt(e.target.dataset.idx);
        tasks.splice(idx, 1);
        renderTasks();
    }
});

// Voice parse: call server endpoint /api/voice-parse
if (parseVoiceBtn) {
    parseVoiceBtn.addEventListener('click', async () => {
        const text = voiceText.value.trim();
        if (!text) return alert('Saisissez du texte vocal ou tapé.');
        try {
            const resp = await fetch('/api/voice-parse', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ text })
            });
            const data = await resp.json();
            if (data.error) return alert('Erreur: ' + data.error);
            
            // Clear tasks before adding parsed ones to prevent duplicates from multiple parses
            tasks = tasks.filter(t => t.day); // Keep only tasks that already have a day assigned manually/previously
            
            if (Array.isArray(data.tasks) && data.tasks.length) {
                // Attach parsed tasks to global tasks array.
                data.tasks.forEach(t => tasks.push(t));
                renderTasks();
                voiceText.value = '';
                alert(`Succès: ${data.tasks.length} tâche(s) analysée(s) et ajoutée(s).`);
            } else {
                alert('Aucune tâche détectée.');
            }
        } catch (err) {
            alert('Erreur lors de l\'analyse vocale: ' + err.message);
        }
    });
}

// Generate Schedule
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        try {
            const resp = await fetch('/api/generate', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ slots, tasks }) // Send current slots and tasks
            });
            const data = await resp.json();
            
            if (data.error) {
                alert('Erreur de génération: ' + data.error);
                return;
            }
            
            // Clear and update the tasks array with the one returned by the server (which includes parsed voice tasks)
            tasks = data.tasks || [];
            renderTasks();
            
            renderSchedule(data.calendar, data.suggestions);
            
        } catch (err) {
            alert('Erreur lors de la génération du planning: ' + err.message);
        }
    });
}

function renderSchedule(calendar, suggestions) {
    // Render Suggestions
    if (suggestionsOutput) {
        if (suggestions.length === 0) {
            suggestionsOutput.innerHTML = '<p>Aucune suggestion d\'horaire pour les tâches restantes.</p>';
        } else {
            let html = '<h3>Suggestions IA:</h3><ul>' + 
                suggestions.map(s => {
                    const slot = s.suggested_time;
                    return `<li><strong>${capitalize(s.task)}</strong>: ${capitalize(slot.day)} ${slot.start} → ${slot.end} (${s.reason})</li>`;
                }).join('') + '</ul>';
            suggestionsOutput.innerHTML = html;
        }
    }

    // Render Calendar
    if (scheduleOutput) {
        let html = '';
        const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        daysOrder.forEach(dayKey => {
            const dayEvents = calendar[dayKey];
            if (dayEvents && dayEvents.length > 0) {
                html += `<h4>${capitalize(dayKey)}</h4><ul class="schedule-day">`;
                dayEvents.forEach(event => {
                    let className = event.type === 'free' ? 'slot-free' : 'slot-task';
                    let text = event.title;
                    if (event.type === 'task') {
                        text = `✅ ${event.title} - ${event.start || ''}${event.start && event.end ? ' → ' + event.end : ''}`;
                        if (event.reason) {
                            text += ` <span class="small">(${event.reason})</span>`;
                        } else if (event.text) {
                            text = `📌 ${event.title} - ${event.text}`;
                        }
                    } else {
                        text = `⏱️ ${event.title} (${event.start} → ${event.end})`;
                    }
                    html += `<li class="${className}">${text}</li>`;
                });
                html += '</ul>';
            }
        });
        
        if (html === '') {
             scheduleOutput.innerHTML = '<p>Le planning généré est vide. Veuillez ajouter des créneaux libres et des tâches.</p>';
        } else {
             scheduleOutput.innerHTML = html;
        }
    }
}


// Export JSON
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const payload = { slots, tasks, exported_at: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Chatbot UI toggle
if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        chatbotPanel.style.display = chatbotPanel.style.display === 'block' ? 'none' : 'block';
        chatInput.focus();
    });
}

// Removed: chatbotLocalRespond function (now fully AI-powered)

function addChatEntry(text, who) {
    const div = document.createElement('div');
    div.className = 'chat-entry ' + (who === 'user' ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (who === 'user' ? 'user' : '');
    bubble.innerText = text;
    div.appendChild(bubble);
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Chat send handler (AI only)
if (chatSend) {
    chatSend.addEventListener('click', async () => {
        const q = chatInput.value.trim();
        if (!q) return;
        
        addChatEntry(q, 'user');
        chatInput.value = ''; // Clear input immediately
        
        // Call server AI endpoint
        try {
            // Note: Sending ALL current slots and tasks to give the AI full context
            const resp = await fetch('/api/ai-assist', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ question: q, slots, tasks })
            });
            const data = await resp.json();

            if (data.error) {
                addChatEntry('❌ Erreur AI: ' + data.error, 'bot');
            } else if (data.reply) {
                const rep = data.reply; // expected {summary, items}
                let display = '';
                
                // Start with the summary, which is the main response
                if (rep.summary) display += rep.summary + '\n';
                
                // Add structured items if present
                if (Array.isArray(rep.items) && rep.items.length) {
                    display += '\n--- Détails ---\n';
                    rep.items.forEach(it => {
                        if (it.type === 'slot') {
                            display += `• Créneau (libre) — ${it.day ? capitalize(it.day) + ': ' : ''}${it.start || ''}${it.start && it.end ? ' → ' + it.end : ''}${it.text ? ' — ' + it.text : ''}\n`;
                        } else {
                            // Tasks can have start/end times if fixed
                            let time = it.start ? `${it.start}${it.end ? ' → ' + it.end : ''}` : '';
                            display += `• Tâche (${it.type ? capitalize(it.type) : 'Général'}) — ${it.day ? capitalize(it.day) + ': ' : ''}${time} ${it.text || ''}\n`;
                        }
                    });
                }
                
                addChatEntry(display.trim() || 'L\'IA n\'a retourné aucun contenu structuré.', 'bot');
            } else {
                addChatEntry('L\'IA n\'a retourné aucune réponse.', 'bot');
            }
        } catch (err) {
            addChatEntry('Erreur de connexion au serveur AI: ' + err.message, 'bot');
        }
    });

    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); chatSend.click(); } });
}

// Initial render
renderSlots();
renderTasks();