/**
 * SkyNotes Logic Engine
 * Focus: GSAP Draggable, LocalStorage Persistence, & Glassmorphic UI
 */

// --- 1. INITIALIZATION & STATE ---
gsap.registerPlugin(Draggable);

let notes = JSON.parse(localStorage.getItem('skyNotesData')) || [];
let tasks = JSON.parse(localStorage.getItem('skyTasksData')) || [];

const NOTE_COLORS = ['#fef3c7', '#dcfce7', '#e0f2fe', '#fce7f3', '#f3e8ff'];

window.addEventListener('DOMContentLoaded', () => {
    // Initial Page Entrance
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.2 } });
    tl.from("header", { y: -50, opacity: 0 })
      .from("aside", { x: 50, opacity: 0 }, "-=0.8")
      .from("#canvas", { scale: 0.9, opacity: 0 }, "-=1");

    renderNotes();
    renderTasks();
    initCalculator();
});

// --- 2. STICKY NOTES MODULE ---
const canvas = document.getElementById('canvas');

/**
 * Renders all notes from localStorage
 */
function renderNotes() {
    canvas.innerHTML = '';
    notes.forEach(note => createNoteUI(note));
}

/**
 * Logic to create a new Note Object
 */
document.getElementById('add-note').onclick = () => {
    const newNote = {
        id: Date.now(),
        x: 50 + Math.random() * 50,
        y: 50 + Math.random() * 50,
        content: "",
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
    };
    notes.push(newNote);
    saveData();
    createNoteUI(newNote);
};

/**
 * Injects Note into DOM and initializes GSAP Draggable
 */
function createNoteUI(note) {
    const div = document.createElement('div');
    div.id = `note-${note.id}`;
    div.className = 'note glass p-5 rounded-[1.5rem]';
    div.style.backgroundColor = note.color;
    
    // Position using GSAP for smoother initial placement
    gsap.set(div, { x: note.x, y: note.y });

    div.innerHTML = `
        <div class="flex justify-between items-center mb-3 opacity-30 hover:opacity-100 transition-opacity cursor-default">
            <span class="text-[10px] font-bold tracking-widest uppercase text-sky-900">Sticky</span>
            <button onclick="deleteNote(${note.id})" class="text-rose-500 hover:scale-125 transition-transform">✕</button>
        </div>
        <textarea oninput="updateNoteText(${note.id}, this.value)" 
            class="bg-transparent w-full h-32 resize-none outline-none text-sky-900 font-medium leading-relaxed"
            placeholder="Type a thought...">${note.content}</textarea>
    `;

    canvas.appendChild(div);

    // Entrance Animation
    gsap.from(div, { scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(1.7)" });

    // Enable Dragging
    Draggable.create(div, {
        bounds: canvas,
        onDragEnd: function() {
            const targetNote = notes.find(n => n.id === note.id);
            if (targetNote) {
                targetNote.x = this.x;
                targetNote.y = this.y;
                saveData();
            }
        }
    });
}

/**
 * Global helpers for Notes
 */
window.deleteNote = (id) => {
    gsap.to(`#note-${id}`, { 
        scale: 0.5, 
        opacity: 0, 
        duration: 0.3, 
        onComplete: () => {
            notes = notes.filter(n => n.id !== id);
            document.getElementById(`note-${id}`).remove();
            saveData();
        }
    });
};

window.updateNoteText = (id, text) => {
    const note = notes.find(n => n.id === id);
    if (note) note.content = text;
    saveData();
};

// --- 3. TO-DO MODULE ---
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

document.getElementById('add-todo').onclick = () => {
    const text = todoInput.value.trim();
    if (!text) return;

    const task = { id: Date.now(), text, done: false };
    tasks.push(task);
    todoInput.value = '';
    renderTasks();
    saveData();
};

function renderTasks() {
    todoList.innerHTML = tasks.map(t => `
        <li class="flex items-center justify-between bg-white/40 p-3 rounded-2xl group hover:bg-white/60 transition-colors">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})" 
                    class="w-5 h-5 accent-sky-400 cursor-pointer">
                <span class="${t.done ? 'line-through opacity-40' : 'font-medium'} text-sky-800">${t.text}</span>
            </div>
            <button onclick="deleteTask(${t.id})" class="text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </li>
    `).join('');
}

window.toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
    renderTasks();
    saveData();
};

window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    saveData();
};

// --- 4. CALCULATOR MODULE ---
let calcExpression = "0";

function initCalculator() {
    const grid = document.getElementById('calc-grid');
    const display = document.getElementById('calc-display');
    const buttons = [
        'C', '(', ')', '/', 
        '7', '8', '9', '*', 
        '4', '5', '6', '-', 
        '1', '2', '3', '+', 
        '0', '.', 'DEL', '='
    ];

    grid.innerHTML = buttons.map(b => {
        let style = "bg-white/50 text-sky-700 hover:bg-sky-100";
        if (b === '=') style = "bg-sky-400 text-white hover:bg-sky-500";
        if (b === 'C') style = "bg-rose-100 text-rose-500 hover:bg-rose-200";
        
        return `<button class="h-12 rounded-xl font-bold transition-all active:scale-90 ${style}" 
                onclick="handleCalc('${b}')">${b}</button>`;
    }).join('');

    window.handleCalc = (val) => {
        if (val === 'C') calcExpression = "0";
        else if (val === 'DEL') {
            calcExpression = calcExpression.length > 1 ? calcExpression.slice(0, -1) : "0";
        }
        else if (val === '=') {
            try { 
                // Using Function instead of eval for a slightly safer calculation
                calcExpression = String(new Function(`return ${calcExpression}`)()); 
            } catch { calcExpression = "Error"; }
        } else {
            calcExpression === "0" ? calcExpression = val : calcExpression += val;
        }
        display.innerText = calcExpression;
    };
}

// --- 5. PERSISTENCE ---
function saveData() {
    localStorage.setItem('skyNotesData', JSON.stringify(notes));
    localStorage.setItem('skyTasksData', JSON.stringify(tasks));
}