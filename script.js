const state = {
    notes: JSON.parse(localStorage.getItem('notes')) || [],
    view: 'notes',
    displayMode: 'grid',
    selectedColor: '#ffffff',
    searchTerm: '',
    editingNoteId: null
};


const quill = new Quill('.quill-editor', {
    theme: 'snow',
    placeholder: 'Take a note...',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link']
        ]
    }
});

const menuToggle = document.getElementById('menuToggle');
const viewToggle = document.getElementById('viewToggle');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const addNoteContainer = document.querySelector('.add-note');
const titleInput = document.querySelector('.note-title-input');
const searchInput = document.getElementById('search-input');
const notesContainer = document.querySelector('.notes-container');
const addBtn = document.querySelector('.add-btn');

menuToggle.addEventListener('click', toggleSidebar);
viewToggle.addEventListener('click', toggleView);
titleInput.addEventListener('click', expandNoteInput);
document.querySelector('.close-btn').addEventListener('click', closeNoteInput);
addBtn.addEventListener('click', handleAddOrUpdateNote);
searchInput.addEventListener('input', handleSearch);

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        state.selectedColor = option.dataset.color;
        document.querySelectorAll('.color-option').forEach(opt =>
            opt.classList.toggle('selected', opt === option)
        );
    });
});

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.view = item.dataset.view;
        renderNotes();
    });
});

function toggleSidebar() {
    sidebar.classList.toggle('active');
    document.body.classList.toggle('sidebar-active');
}

function toggleView() {
    state.displayMode = state.displayMode === 'grid' ? 'list' : 'grid';
    viewToggle.innerHTML = `<i class="fas fa-${state.displayMode === 'grid' ? 'th' : 'list'}"></i>`;
    notesContainer.classList.toggle('list-view', state.displayMode === 'list');
}

function expandNoteInput() {
    addNoteContainer.classList.add('expanded');
}

function closeNoteInput() {
    addNoteContainer.classList.remove('expanded');
    titleInput.value = '';
    quill.setText('');
    state.selectedColor = '#ffffff';
    state.editingNoteId = null;
    addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Note';
    updateColorSelection();
}

document.addEventListener("DOMContentLoaded", function () {
    const colorPalette = document.querySelector(".color-palette");
    const colorOptions = document.querySelector(".color-options");

    let isHovered = false;

    colorPalette.addEventListener("mouseenter", function () {
        colorOptions.style.display = "grid";
    });

    colorPalette.addEventListener("mouseleave", function () {
        setTimeout(() => {
            if (!isHovered) {
                colorOptions.style.display = "none";
            }
        }, 50);
    });

    colorOptions.addEventListener("mouseenter", function () {
        isHovered = true;
    });

    colorOptions.addEventListener("mouseleave", function () {
        isHovered = false;
        setTimeout(() => {
            if (!colorPalette.matches(":hover")) {
                colorOptions.style.display = "none";
            }
        }, 50);
    });
});

function editNote(id) {
    const note = state.notes.find(note => note.id === id);
    if (!note) return;

    state.editingNoteId = id;
    addNoteContainer.classList.add('expanded');
    titleInput.value = note.title;
    quill.root.innerHTML = note.content;
    state.selectedColor = note.color;
    updateColorSelection();
    addBtn.innerHTML = '<i class="fas fa-save"></i> Update Note';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function handleAddOrUpdateNote() {
    const title = titleInput.value.trim();
    const content = quill.root.innerHTML.trim();

    if (title || content) {
        if (state.editingNoteId) {

            const noteIndex = state.notes.findIndex(note => note.id === state.editingNoteId);
            if (noteIndex !== -1) {
                const originalNote = state.notes[noteIndex];
                state.notes[noteIndex] = {
                    ...originalNote,
                    title,
                    content,
                    color: state.selectedColor,
                    updated: new Date().toISOString()
                };
            }
        } else {
            const note = {
                id: Date.now(),
                title,
                content,
                color: state.selectedColor,
                pinned: false,
                archived: false,
                trashed: false,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            state.notes.unshift(note);
        }
        saveNotes();
        renderNotes();
        closeNoteInput();
    }
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === state.selectedColor);
    });
}

function togglePin(id) {
    const note = state.notes.find(note => note.id === id);
    if (note) {
        note.pinned = !note.pinned;
        saveNotes();
        renderNotes();
    }
}

function archiveNote(id) {
    const note = state.notes.find(note => note.id === id);
    if (note) {
        note.archived = !note.archived;
        note.pinned = false;
        saveNotes();
        renderNotes();
    }
}

function trashNote(id) {
    const note = state.notes.find(note => note.id === id);
    if (note) {
        note.trashed = true;
        note.pinned = false;
        note.archived = false;
        saveNotes();
        renderNotes();
    }
}

function deleteNotePermanently(id) {
    state.notes = state.notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function restoreNote(id) {
    const note = state.notes.find(note => note.id === id);
    if (note) {
        note.trashed = false;
        note.archived = false;
        saveNotes();
        renderNotes();
    }
}

function handleSearch(e) {
    state.searchTerm = e.target.value.toLowerCase();
    renderNotes();
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(state.notes));
}

function renderNotes() {
    notesContainer.innerHTML = '';

    let filteredNotes = state.notes.filter(note => {
        const matchesSearch = (note.title + note.content).toLowerCase().includes(state.searchTerm);
        switch (state.view) {
            case 'archive':
                return note.archived && !note.trashed && matchesSearch;
            case 'trash':
                return note.trashed && matchesSearch;
            default:
                return !note.archived && !note.trashed && matchesSearch;
        }
    });

    if (state.view === 'notes') {
        const pinnedNotes = filteredNotes.filter(note => note.pinned);
        const unpinnedNotes = filteredNotes.filter(note => !note.pinned);

        if (pinnedNotes.length > 0) {
            renderSection('PINNED', pinnedNotes);
            if (unpinnedNotes.length > 0) {
                renderSection('OTHERS', unpinnedNotes);
            }
        } else {
            renderNotesList(filteredNotes);
        }
    } else {
        renderNotesList(filteredNotes);
    }
}

function renderSection(title, notes) {
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'section-title';
    sectionTitle.innerHTML = `<i class="fas fa-thumbtack"></i> ${title}`;
    notesContainer.appendChild(sectionTitle);
    renderNotesList(notes);
}

function renderNotesList(notes) {
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.style.backgroundColor = note.color;
        noteElement.addEventListener('dblclick', () => editNote(note.id));

        const noteContent = `
            <button class="icon-button pin-button" onclick="event.stopPropagation(); togglePin(${note.id})">
                <i class="fas fa-thumbtack ${note.pinned ? 'pinned' : ''}"></i>
            </button>
            <div class="note-title">${note.title}</div>
            <div class="note-text">${note.content}</div>
            
            <div class="note-footer">
                ${state.view === 'trash' ? `
                    <button class="icon-button" onclick="event.stopPropagation(); restoreNote(${note.id})">
                        <i class="fas fa-trash-restore"></i>
                    </button>
                    <button class="icon-button" onclick="event.stopPropagation(); deleteNotePermanently(${note.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : `
                    <button class="icon-button" onclick="event.stopPropagation(); archiveNote(${note.id})">
                        <i class="fas fa-archive"></i>
                    </button>
                    <button class="icon-button" onclick="event.stopPropagation(); trashNote(${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                `}
            </div>
        `;

        noteElement.innerHTML = noteContent;
        notesContainer.appendChild(noteElement);
    });
}

renderNotes();