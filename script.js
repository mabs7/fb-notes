// ==========================================
// 1. FIREBASE INITIALIZATION & CLOUD DATABASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDoUu8zcJ33oIPeRqGd-pxV9FpFOVlDDYc",
  authDomain: "fb-notes-fe3c2.firebaseapp.com",
  projectId: "fb-notes-fe3c2",
  storageBucket: "fb-notes-fe3c2.firebasestorage.app",
  messagingSenderId: "1093786032671",
  appId: "1:1093786032671:web:d5526748afd28e28b9132a",
  measurementId: "G-WL231S9B4Q"
};

// Initialize the Cloud connection exactly ONE time
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global State to hold our cloud data
let state = {
    classes: [],
    subjects: [],
    notes: [],
    team: []
};

// Fetch everything from Firebase before rendering the site
async function loadCloudDatabase() {
    try {
        // We fetch all 4 collections at the exact same time for maximum speed
        const [classesSnap, subjectsSnap, notesSnap, teamSnap] = await Promise.all([
            getDocs(collection(db, "classes")),
            getDocs(collection(db, "subjects")),
            getDocs(collection(db, "notes")),
            getDocs(collection(db, "team"))
        ]);

        // Unpack the Firebase data into our state arrays
        state.classes = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        state.subjects = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        state.notes = notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        state.team = teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort notes by date (newest first)
        state.notes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
    } catch (error) {
        console.error("Error connecting to Firebase:", error);
    }
}

// Apple-style color tints
const colorTints = ['tint-blue', 'tint-green', 'tint-orange', 'tint-purple', 'tint-pink', 'tint-yellow'];

// ==========================================
// 2. HOMEPAGE HERO ANIMATION 
// ==========================================
function initHeroAnimation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    let width, height; let particles = [];

    function resize() {
        width = canvas.parentElement.offsetWidth; height = canvas.parentElement.offsetHeight;
        canvas.width = width; canvas.height = height;
    }
    window.addEventListener('resize', resize); resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width; this.y = Math.random() * height;
            this.size = Math.random() * 2.5 + 0.5; 
            this.vx = (Math.random() - 0.5) * 0.4; this.vy = (Math.random() - 0.5) * 0.4; 
            this.opacity = Math.random() * 0.4 + 0.1; 
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x > width) this.x = 0; if (this.x < 0) this.x = width;
            if (this.y > height) this.y = 0; if (this.y < 0) this.y = height;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 113, 227, ${this.opacity})`; ctx.fill();
        }
    }
    function initParticles() {
        particles = []; const numParticles = Math.floor(width / 18); 
        for (let i = 0; i < numParticles; i++) particles.push(new Particle());
    }
    initParticles();
    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

// ==========================================
// 3. DARK MODE
// ==========================================
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    const currentTheme = localStorage.getItem('theme'); // We keep theme pref in local storage
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.textContent = '☀️'; 
    }
    toggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light'); toggleBtn.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark'); toggleBtn.textContent = '☀️';
        }
    });
}

// ==========================================
// 4. UI RENDER FUNCTIONS (Using Global State)
// ==========================================
function renderHomePage() {
    const classGrid = document.getElementById('dynamic-class-grid');
    if (!classGrid) return; 

    const subjectGrid = document.getElementById('dynamic-subject-grid');
    const teamGrid = document.getElementById('dynamic-team-grid');
    const navClassDropdown = document.getElementById('nav-class-dropdown');
    const navSubjectDropdown = document.getElementById('nav-subject-dropdown');
    const tickerContainer = document.getElementById('dynamic-ticker');
    const searchInput = document.getElementById('main-search');
    const searchDropdown = document.getElementById('search-dropdown-results');

    state.classes.forEach((cls, index) => {
        const url = `class.html?name=${encodeURIComponent(cls.name)}`;
        const tint = colorTints[index % colorTints.length];
        
        const card = document.createElement('a'); card.href = url; card.className = `grid-card ${tint}`; card.textContent = cls.name;
        classGrid.appendChild(card);

        const navItem = document.createElement('a'); navItem.href = url; navItem.className = 'dropdown-item'; navItem.textContent = cls.name;
        navClassDropdown.appendChild(navItem);
    });

    state.subjects.forEach((sub, index) => {
        const url = `subject.html?name=${encodeURIComponent(sub.name)}`;
        const tint = colorTints[(index + 2) % colorTints.length];

        const card = document.createElement('a'); card.href = url; card.className = `grid-card ${tint}`; card.textContent = sub.name;
        subjectGrid.appendChild(card);

        const navItem = document.createElement('a'); navItem.href = url; navItem.className = 'dropdown-item'; navItem.textContent = sub.name;
        navSubjectDropdown.appendChild(navItem);
    });

    if (teamGrid) {
        state.team.forEach(member => {
            const card = document.createElement('div'); card.className = 'team-card';
            card.innerHTML = `<img src="${member.img}" class="team-img"><div class="team-name">${member.name}</div><div class="team-subject">${member.subject}</div>`;
            teamGrid.appendChild(card);
        });
    }

    if (tickerContainer) {
        if (state.notes.length === 0) {
            tickerContainer.innerHTML = '<span>Welcome to FB Notes! Log in to the Admin panel to add content.</span>';
        } else {
            const recentNotes = state.notes.slice(0, 3);
            let tickerHTML = '<strong>Latest Drops:</strong> ';
            recentNotes.forEach(note => {
                const url = `note.html?topic=${encodeURIComponent(note.topic)}&link=${encodeURIComponent(note.driveLink)}`;
                tickerHTML += `<span class="ticker-item"><a href="${url}">${note.className} - ${note.topic}</a></span>`;
            });
            tickerContainer.innerHTML = tickerHTML;
        }
    }

    if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchDropdown.innerHTML = '';
            if (query === '') { searchDropdown.style.display = 'none'; return; }

            const filteredNotes = state.notes.filter(note => 
                note.topic.toLowerCase().includes(query) || note.subject.toLowerCase().includes(query) || note.className.toLowerCase().includes(query)
            );

            if (filteredNotes.length === 0) {
                searchDropdown.innerHTML = '<div style="padding: 15px; color: var(--text-muted); text-align: center;">No notes found matching your search.</div>';
                searchDropdown.style.display = 'flex'; return;
            }

            filteredNotes.forEach(note => {
                const a = document.createElement('a'); a.href = `note.html?topic=${encodeURIComponent(note.topic)}&link=${encodeURIComponent(note.driveLink)}`; a.className = 'search-result-item';
                a.innerHTML = `<span class="search-result-topic">${note.topic}</span><span class="search-result-meta">${note.className} • ${note.subject} • Added ${note.date}</span>`;
                searchDropdown.appendChild(a);
            });
            searchDropdown.style.display = 'flex';
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) searchDropdown.style.display = 'none';
        });
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() !== '') searchDropdown.style.display = 'flex';
        });
    }
}

function renderClassPage() {
    const classListContainer = document.getElementById('dynamic-class-notes');
    if (!classListContainer) return;
    const urlParams = new URLSearchParams(window.location.search);
    const targetClassName = urlParams.get('name');
    if (!targetClassName) { window.location.href = 'index.html'; return; }
    
    document.getElementById('page-title').textContent = `${targetClassName} Notes`;
    document.getElementById('dynamic-class-name').textContent = targetClassName;

    const classNotes = state.notes.filter(note => note.className === targetClassName);
    if (classNotes.length === 0) {
        classListContainer.innerHTML = '<li class="note-item" style="justify-content: center; color: var(--text-muted);">No notes uploaded yet.</li>'; return;
    }
    classNotes.forEach(note => {
        const a = document.createElement('a'); a.className = 'note-item';
        a.href = `note.html?topic=${encodeURIComponent(note.topic)}&link=${encodeURIComponent(note.driveLink)}`;
        a.style.textDecoration = 'none'; a.style.color = 'inherit';
        a.innerHTML = `<span class="date">${note.date}</span><span class="topic">${note.subject}: ${note.topic}</span>`;
        classListContainer.appendChild(a);
    });
}

function renderSubjectPage() {
    const subjectListContainer = document.getElementById('dynamic-subject-notes');
    if (!subjectListContainer) return; 
    const urlParams = new URLSearchParams(window.location.search);
    const targetSubjectName = urlParams.get('name');
    if (!targetSubjectName) { window.location.href = 'index.html'; return; }
    
    document.getElementById('page-title').textContent = `${targetSubjectName} Notes`;
    document.getElementById('dynamic-subject-name').textContent = targetSubjectName;

    let subjectNotes = state.notes.filter(note => note.subject === targetSubjectName);
    if (subjectNotes.length === 0) {
        subjectListContainer.innerHTML = '<li class="note-item" style="justify-content: center; color: var(--text-muted);">No notes uploaded yet.</li>'; return;
    }
    subjectNotes.sort((a, b) => {
        const classNumA = parseInt(a.className.replace(/\D/g, '')) || 0;
        const classNumB = parseInt(b.className.replace(/\D/g, '')) || 0;
        return classNumB - classNumA;
    });
    subjectNotes.forEach(note => {
        const a = document.createElement('a'); a.className = 'note-item';
        a.href = `note.html?topic=${encodeURIComponent(note.topic)}&link=${encodeURIComponent(note.driveLink)}`;
        a.style.textDecoration = 'none'; a.style.color = 'inherit';
        a.innerHTML = `<span class="date">${note.date}</span><span class="topic">${note.className}: ${note.topic}</span>`;
        subjectListContainer.appendChild(a);
    });
}

function renderNotePage() {
    const iframe = document.getElementById('note-iframe');
    if (!iframe) return; 
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');
    let driveLink = urlParams.get('link');

    if (!topic || !driveLink) { window.location.href = 'index.html'; return; }

    document.getElementById('note-title').textContent = topic;
    document.getElementById('page-title').textContent = `${topic} | FB Notes`;
    if (driveLink.includes('/view')) driveLink = driveLink.replace(/\/view.*/, '/preview');
    iframe.src = driveLink;
}

// ==========================================
// 5. ADMIN DASHBOARD CLOUD WRITES
// ==========================================
function initAdminPage() {
    const adminFormNote = document.getElementById('form-add-note');
    if (!adminFormNote) return; 

    const classDropdown = document.getElementById('admin-class-dropdown');
    const subjectDropdown = document.getElementById('admin-subject-dropdown');

    state.classes.forEach(cls => {
        const option = document.createElement('option'); option.value = cls.name; option.textContent = cls.name;
        classDropdown.appendChild(option);
    });
    state.subjects.forEach(sub => {
        const option = document.createElement('option'); option.value = sub.name; option.textContent = sub.name;
        subjectDropdown.appendChild(option);
    });

    // Write Note to Firestore
    adminFormNote.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button');
        submitBtn.textContent = "Publishing to Cloud..."; submitBtn.disabled = true;

        try {
            await addDoc(collection(db, "notes"), {
                topic: document.getElementById('input-topic').value,
                driveLink: document.getElementById('input-drive-link').value,
                className: classDropdown.value,
                subject: subjectDropdown.value,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
            alert(`Note Added to Global Database!`);
            location.reload();
        } catch(err) { alert("Error saving note: " + err.message); submitBtn.disabled = false; }
    });

    // Write Subject to Firestore
    document.getElementById('form-add-subject').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "subjects"), { name: document.getElementById('input-subject-name').value });
            alert(`Subject Added to Cloud!`); location.reload(); 
        } catch(err) { alert("Error: " + err.message); }
    });

    // Write Class to Firestore
    document.getElementById('form-add-class').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "classes"), { name: document.getElementById('input-class-name').value });
            alert(`Class Added to Cloud!`); location.reload();
        } catch(err) { alert("Error: " + err.message); }
    });

    // Write Team Member to Firestore
    document.getElementById('form-add-team').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('input-team-name').value;
        const subject = document.getElementById('input-team-role').value;
        const fileInput = document.getElementById('input-team-img');

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                const imgBase64 = event.target.result; 
                try {
                    await addDoc(collection(db, "team"), { name, subject, img: imgBase64 });
                    alert(`Team member Added to Cloud!`); location.reload();
                } catch(err) { alert("Error: " + err.message); }
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    });

    // Erase Cloud Data (We iterate through our local state array and delete by ID)
    const btnResetDb = document.getElementById('btn-reset-db');
    if (btnResetDb) {
        btnResetDb.addEventListener('click', async () => {
            if (confirm("Are you sure? This will wipe the GLOBAL database for everyone.")) {
                btnResetDb.textContent = "Wiping servers...";
                try {
                    const deletePromises = [];
                    state.classes.forEach(c => deletePromises.push(deleteDoc(doc(db, "classes", c.id))));
                    state.subjects.forEach(s => deletePromises.push(deleteDoc(doc(db, "subjects", s.id))));
                    state.notes.forEach(n => deletePromises.push(deleteDoc(doc(db, "notes", n.id))));
                    state.team.forEach(t => deletePromises.push(deleteDoc(doc(db, "team", t.id))));
                    
                    await Promise.all(deletePromises);
                    alert("Global Database wiped clean."); location.reload(); 
                } catch(err) { alert("Error wiping DB: " + err.message); }
            }
        });
    }
}

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger'); const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) hamburger.addEventListener('click', () => { navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex'; });
}




// ==========================================
// AUTHENTICATION LOGIC (Upgraded)
// ==========================================
function initAuth() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('btn-logout');
    const errorMsg = document.getElementById('login-error');
    
    // Convert URL to lowercase to avoid mismatches
    const currentPath = window.location.href.toLowerCase();

    // THE BOUNCER: Protect the Admin Page
    if (currentPath.includes('admin')) {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Not logged in? Kick them to the login page immediately.
                window.location.replace('login.html');
            }
        });
    }

    // THE BOUNCER: Keep logged-in users away from the Login page
    if (currentPath.includes('login')) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Already logged in? Send them straight to the dashboard.
                window.location.replace('admin.html');
            }
        });
    }

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');
            
            btn.textContent = "Authenticating...";
            btn.disabled = true;
            errorMsg.style.display = 'none';

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // The Bouncer above will auto-redirect them once Firebase confirms the login
            } catch (error) {
                console.error(error);
                errorMsg.textContent = "Invalid email or password. Please try again.";
                errorMsg.style.display = 'block';
                btn.textContent = "Secure Login";
                btn.disabled = false;
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            logoutBtn.textContent = "Logging out...";
            await signOut(auth);
            // The Bouncer above will auto-redirect them to the login page
        });
    }
}




// ==========================================
// 6. ASYNC INITIALIZATION (The Controller)
// ==========================================
// Because we must wait for the cloud data to download before drawing the UI,
// we wrap everything in an async IIFE (Immediately Invoked Function Expression)
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup UI that doesn't need data first
    initHeroAnimation(); 
    initThemeToggle();
    setupMobileMenu();

    initAuth();

    // 2. Wait for Firebase to download the entire database
    await loadCloudDatabase();

    // 3. Render the specific page we are currently on
    renderHomePage();   
    renderClassPage();  
    renderSubjectPage(); 
    renderNotePage();   
    initAdminPage();    
});