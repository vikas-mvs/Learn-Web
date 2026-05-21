/* ==========================================================================
   AXL CodeX Chat - Premium App logic and Interactive Engine
   ========================================================================== */

// Modern Firebase Web SDK v10 CDN Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration Block (Hybrid Mode: Falls back to local offline mode if placeholder)
const firebaseConfig = {
  apiKey: "AIzaSyCSOT-dO83Ol7PN6KqnApiiYoRWxCzNmPg",
  authDomain: "chat-app-2385c.firebaseapp.com",
  projectId: "chat-app-2385c",
  storageBucket: "chat-app-2385c.firebasestorage.app",
  messagingSenderId: "562675719989",
  appId: "1:562675719989:web:dce944634d0f3c6860367c",
  measurementId: "G-V7NH3F5RST"
};

let db = null;
let auth = null;
let isFirebaseOnline = false;
let unsubscribeGlobal = null;
let isInitialLoad = true;

// Utility to verify if user has replaced placeholder credentials
function isConfigPlaceholder(config) {
    return !config.apiKey || config.apiKey.includes("YOUR_") || config.apiKey.includes("placeholder");
}

try {
    if (!isConfigPlaceholder(firebaseConfig)) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isFirebaseOnline = true;
        console.log("Firebase initialized successfully! Running in Real-Time Live Mode.");
    } else {
        console.warn("Firebase config has placeholders. Running in Simulated Offline mode.");
    }
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
}

// Initial Simulated Contact Database
const INITIAL_CONTACTS = [
    {
        id: "axl-bot",
        name: "AXL CodeX Bot",
        initials: "AC",
        color: "linear-gradient(135deg, #00b4db, #0083b0)",
        status: "online",
        unread: 0,
        messages: [
            { sender: "them", text: "Hello! Welcome to AXL CodeX Chat! 👋", time: "14:00", status: "read" },
            { sender: "them", text: "Main ek AI Simulated Bot hoon. Aap mujhse WhatsApp jaisa app banane ke baare mein, ya kisi bhi code ke baare mein baat kar sakte hain!", time: "14:01", status: "read" },
            { sender: "them", text: "Kuchh bhi poochhein! Main aapko detailed guide aur code examples ke saath samjhaunga. 🚀", time: "14:01", status: "read" }
        ]
    },
    {
        id: "vikas-notes",
        name: "Vikas (You)",
        initials: "VY",
        color: "linear-gradient(135deg, #7f00ff, #e100ff)",
        status: "Message yourself",
        unread: 0,
        messages: [
            { sender: "me", text: "Make list of things to study tonight:", time: "10:30", status: "read" },
            { sender: "me", text: "1. Advanced Flexbox & CSS Grid\n2. JavaScript Promises & Async/Await\n3. LocalStorage persistence APIs", time: "10:32", status: "read" }
        ]
    },
    {
        id: "jane-designer",
        name: "Jane (UI/UX Designer)",
        initials: "JD",
        color: "linear-gradient(135deg, #f12711, #f5af19)",
        status: "online",
        unread: 1,
        messages: [
            { sender: "them", text: "Hey! What do you think about the glassmorphic layouts?", time: "11:15", status: "delivered" }
        ]
    },
    {
        id: "coding-group",
        name: "Coding Squad 🚀",
        initials: "CS",
        color: "linear-gradient(135deg, #11998e, #38ef7d)",
        status: "Global Live Chat",
        unread: 0,
        messages: [
            { sender: "them", text: "Welcome to our live global chat! Connect Firebase config to see messages from anyone online in real-time.", time: "09:00", status: "read" }
        ]
    }
];

// App State Management
let contacts = [];
let activeContactId = null;

// DOM Selectors
const DOM = {
    chatsList: document.getElementById('chats-list'),
    searchInput: document.getElementById('search-input'),
    welcomeScreen: document.getElementById('welcome-screen'),
    activeChat: document.getElementById('active-chat'),
    chatContactName: document.getElementById('chat-contact-name'),
    chatContactStatus: document.getElementById('chat-contact-status'),
    chatHeaderInfo: document.getElementById('chat-header-info'),
    messagesWindow: document.getElementById('messages-window'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    themeToggle: document.getElementById('theme-toggle'),
    backBtn: document.getElementById('chat-back-btn'),
    newChatBtn: document.getElementById('btn-new-chat'),
    appWrapper: document.querySelector('.app-wrapper'),
    chatAvatarWrapper: document.querySelector('.chat-avatar-wrapper'),
    
    // Username Modal Selectors
    usernameModal: document.getElementById('username-modal'),
    usernameForm: document.getElementById('username-form'),
    usernameInputField: document.getElementById('username-input-field'),
    currentUserAvatar: document.getElementById('current-user-avatar'),
    currentUserName: document.getElementById('current-user-name')
};

// ==========================================================================
// Web Audio API Synthesizer (WhatsApp-like Chimes)
// ==========================================================================
function playMessageSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (type === 'sent') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        } else if (type === 'received') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
            osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.08); // C6
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch (e) {
        console.warn('Audio synthesizing is pending user interaction approval.', e);
    }
}

// ==========================================================================
// Core Utilities & User Session Management
// ==========================================================================

// Helper to get formatted current time (HH:MM)
function getCurrentTimeFormatted() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Save database state to localStorage
function saveState() {
    localStorage.setItem('axl_codex_chat_contacts', JSON.stringify(contacts));
}

// Load database state
function loadState() {
    const saved = localStorage.getItem('axl_codex_chat_contacts');
    if (saved) {
        try {
            contacts = JSON.parse(saved);
        } catch (e) {
            contacts = [...INITIAL_CONTACTS];
        }
    } else {
        contacts = [...INITIAL_CONTACTS];
        saveState();
    }
}

// Initialize User Credentials & Modal Session
function initUserSession() {
    if (isFirebaseOnline) {
        // Authenticated Live Session Listener
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const displayName = user.displayName || "User";
                updateCurrentUserUI(displayName);
                DOM.usernameModal.style.display = 'none';
            } else {
                DOM.usernameModal.style.display = 'flex';
                DOM.usernameInputField.focus();
            }
        });

        // Register new user on submit
        DOM.usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = DOM.usernameInputField.value.trim();
            if (!username) return;

            const submitBtn = DOM.usernameForm.querySelector('button');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Connecting <i class="fa-solid fa-circle-notch fa-spin"></i>';

            try {
                const userCredential = await signInAnonymously(auth);
                await updateProfile(userCredential.user, { displayName: username });
                updateCurrentUserUI(username);
                DOM.usernameModal.style.display = 'none';
                playMessageSound('received');
            } catch (err) {
                console.error("Firebase auth failed, falling back to simulated session:", err);
                fallbackToSimulatedAuth(username);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    } else {
        // Simulated Local Session Handler
        const savedUsername = localStorage.getItem('axl_chat_username');
        if (savedUsername) {
            updateCurrentUserUI(savedUsername);
            DOM.usernameModal.style.display = 'none';
        } else {
            DOM.usernameModal.style.display = 'flex';
            DOM.usernameInputField.focus();

            DOM.usernameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = DOM.usernameInputField.value.trim();
                if (!username) return;

                localStorage.setItem('axl_chat_username', username);
                updateCurrentUserUI(username);
                DOM.usernameModal.style.display = 'none';
                playMessageSound('received');
            });
        }
    }
}

function fallbackToSimulatedAuth(username) {
    isFirebaseOnline = false;
    localStorage.setItem('axl_chat_username', username);
    updateCurrentUserUI(username);
    DOM.usernameModal.style.display = 'none';
}

function updateCurrentUserUI(username) {
    if (DOM.currentUserName) DOM.currentUserName.innerText = username;
    if (DOM.currentUserAvatar) {
        DOM.currentUserAvatar.innerText = username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
}

// Render Sidebar Chats List
function renderContacts(searchTerm = '') {
    DOM.chatsList.innerHTML = '';
    const term = searchTerm.toLowerCase().trim();
    
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(term)
    );

    if (filteredContacts.length === 0) {
        DOM.chatsList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">
                No chats found
            </div>
        `;
        return;
    }

    filteredContacts.forEach(contact => {
        const lastMsgObj = contact.messages[contact.messages.length - 1];
        const lastMsgText = lastMsgObj ? lastMsgObj.text : 'No messages yet';
        const lastMsgTime = lastMsgObj ? lastMsgObj.time : '';
        const isTyping = contact.status === 'typing...';
        
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${contact.id === activeContactId ? 'active' : ''}`;
        chatItem.dataset.id = contact.id;
        
        chatItem.innerHTML = `
            <div class="chat-item-avatar" style="background: ${contact.color}">
                ${contact.initials}
            </div>
            <div class="chat-item-details">
                <div class="chat-item-meta">
                    <span class="chat-item-name">${contact.name}</span>
                    <span class="chat-item-time">${lastMsgTime}</span>
                </div>
                <div class="chat-item-body">
                    <span class="chat-item-lastmsg ${isTyping ? 'typing' : ''}">
                        ${isTyping ? 'typing...' : lastMsgText}
                    </span>
                    ${contact.unread > 0 && !isTyping ? `<span class="chat-item-unread">${contact.unread}</span>` : ''}
                </div>
            </div>
        `;
        
        chatItem.addEventListener('click', () => selectContact(contact.id));
        DOM.chatsList.appendChild(chatItem);
    });
}

// Select a Chat Conversation
function selectContact(contactId) {
    activeContactId = contactId;
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Reset unread count
    contact.unread = 0;
    saveState();
    
    // UI Transitions
    DOM.welcomeScreen.style.display = 'none';
    DOM.activeChat.style.display = 'flex';
    DOM.appWrapper.classList.add('show-chat'); // Slides in chat on mobile

    // Populate Contact Information
    DOM.chatContactName.innerText = contact.name;
    DOM.chatContactStatus.innerText = contact.status;
    DOM.chatContactStatus.className = `chat-contact-status ${contact.status === 'online' || contact.status === 'typing...' || contact.status.includes('members') || contact.status.includes('Live') ? 'online' : ''}`;
    
    // Create Header Avatar
    DOM.chatAvatarWrapper.innerHTML = `
        <div class="avatar" style="background: ${contact.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; width: 40px; height: 40px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
            ${contact.initials}
        </div>
    `;

    // Manage Real-time Subscriptions
    if (contactId === 'coding-group' && isFirebaseOnline) {
        subscribeToGlobalChat();
    } else {
        if (unsubscribeGlobal) {
            unsubscribeGlobal();
            unsubscribeGlobal = null;
        }
        renderMessages();
    }

    renderContacts(DOM.searchInput.value);
    DOM.messageInput.focus();
}

// Subscribe to Live Global Chat collection in Firestore
function subscribeToGlobalChat() {
    if (unsubscribeGlobal) unsubscribeGlobal();
    
    DOM.messagesWindow.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); gap: 12px; font-size: 14px;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 20px; color: var(--accent-color);"></i>
            <span>Connecting to live database room...</span>
        </div>
    `;

    isInitialLoad = true;

    const q = query(collection(db, "global_messages"), orderBy("timestamp", "asc"));
    unsubscribeGlobal = onSnapshot(q, (snapshot) => {
        const firestoreMessages = [];
        const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            let timeStr = getCurrentTimeFormatted();
            if (data.timestamp) {
                const date = data.timestamp.toDate();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                timeStr = `${hours}:${minutes}`;
            } else if (data.time) {
                timeStr = data.time;
            }

            const isMe = data.senderId === currentUserId;

            firestoreMessages.push({
                sender: isMe ? "me" : "them",
                text: isMe ? data.text : `${data.senderName}: ${data.text}`,
                time: timeStr,
                status: "read"
            });
        });

        const codingGroup = contacts.find(c => c.id === 'coding-group');
        if (codingGroup) {
            codingGroup.messages = firestoreMessages;
            saveState();

            if (activeContactId === 'coding-group') {
                renderMessages();
                
                // Play notification chime for newly arrived live incoming messages
                if (!isInitialLoad) {
                    const lastMsg = firestoreMessages[firestoreMessages.length - 1];
                    if (lastMsg && lastMsg.sender === 'them') {
                        playMessageSound('received');
                    }
                }
            } else {
                // Background message unread count increment
                if (!isInitialLoad) {
                    codingGroup.unread = (codingGroup.unread || 0) + 1;
                    playMessageSound('received');
                }
            }

            renderContacts(DOM.searchInput.value);
        }

        isInitialLoad = false;
    }, (error) => {
        console.error("Firestore live subscriber failed:", error);
        isFirebaseOnline = false;
        // On error, let local messages show
        renderMessages();
    });
}

// Render Messages inside selected Conversation
function renderMessages() {
    DOM.messagesWindow.innerHTML = '';
    const contact = contacts.find(c => c.id === activeContactId);
    if (!contact) return;

    if (contact.messages.length === 0) {
        DOM.messagesWindow.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); font-size: 13.5px;">
                No messages yet. Say hello! 👋
            </div>
        `;
        return;
    }

    contact.messages.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${msg.sender === 'me' ? 'outgoing' : 'incoming'}`;
        
        let checkmarkHtml = '';
        if (msg.sender === 'me') {
            if (msg.status === 'read') {
                checkmarkHtml = '<i class="fa-solid fa-check-double"></i>';
            } else if (msg.status === 'delivered') {
                checkmarkHtml = '<i class="fa-solid fa-check-double" style="color: var(--text-secondary);"></i>';
            } else {
                checkmarkHtml = '<i class="fa-solid fa-check" style="color: var(--text-secondary);"></i>';
            }
        }

        bubble.innerHTML = `
            <div class="message-text">${escapeHTML(msg.text).replace(/\n/g, '<br>')}</div>
            <div class="message-meta">
                <span class="message-time">${msg.time}</span>
                ${msg.sender === 'me' ? `<span class="message-status">${checkmarkHtml}</span>` : ''}
            </div>
        `;
        DOM.messagesWindow.appendChild(bubble);
    });

    // Auto scroll to bottom
    DOM.messagesWindow.scrollTop = DOM.messagesWindow.scrollHeight;
}

// Prevent HTML injections
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Send Message Flow
function sendMessage(text) {
    if (!activeContactId) return;
    const contact = contacts.find(c => c.id === activeContactId);
    if (!contact) return;

    const time = getCurrentTimeFormatted();
    
    // Play synthesis sent sound immediately
    playMessageSound('sent');

    if (contact.id === 'coding-group' && isFirebaseOnline) {
        // Send directly to the live Firestore Database
        addDoc(collection(db, "global_messages"), {
            senderId: auth.currentUser ? auth.currentUser.uid : "offline-sender",
            senderName: auth.currentUser ? (auth.currentUser.displayName || "Anonymous") : "Anonymous",
            text: text,
            time: time,
            timestamp: serverTimestamp()
        }).catch(err => {
            console.error("Firestore message write failed, writing locally:", err);
            fallbackLocalMessage(contact, text, time);
        });
    } else {
        // Fallback to standard simulated offline behavior
        fallbackLocalMessage(contact, text, time);
    }
}

// Local simulation logic helper
function fallbackLocalMessage(contact, text, time) {
    const newMsg = {
        sender: "me",
        text: text,
        time: time,
        status: "sent"
    };

    contact.messages.push(newMsg);
    saveState();
    renderMessages();
    renderContacts(DOM.searchInput.value);

    // Trigger local double ticks simulated feedback loops
    setTimeout(() => {
        newMsg.status = "delivered";
        saveState();
        renderMessages();
        
        setTimeout(() => {
            newMsg.status = "read";
            saveState();
            renderMessages();
        }, 1000);
    }, 500);

    // Bot Response logic
    if (contact.id === 'axl-bot') {
        simulateBotResponse(text);
    } else if (contact.id === 'jane-designer') {
        simulateJaneResponse(text);
    } else if (contact.id === 'coding-group') {
        simulateGroupResponse(text);
    }
}

// ==========================================================================
// AI / Bot Simulation Auto-responders
// ==========================================================================

// 1. AXL CodeX Main Assistance Bot
function simulateBotResponse(userMsg) {
    const contact = contacts.find(c => c.id === 'axl-bot');
    if (!contact) return;

    setTimeout(() => {
        contact.status = 'typing...';
        if (activeContactId === 'axl-bot') {
            DOM.chatContactStatus.innerText = 'typing...';
            DOM.chatContactStatus.classList.add('online');
        }
        renderContacts(DOM.searchInput.value);

        const lowerMsg = userMsg.toLowerCase().trim();
        let reply = "";

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey') || lowerMsg.includes('namaste')) {
            reply = "Namaste! Main AXL CodeX Bot hoon. Main developers ki madad ke liye design kiya gaya hoon. Bataiye, aaj main aapki kya madad karoon?";
        } else if (lowerMsg.includes('whatsapp') || lowerMsg.includes('chat app') || lowerMsg.includes('clone') || lowerMsg.includes('banaye')) {
            reply = `WhatsApp jaisa chat app banane ke liye primary elements ye hain:
            
1. **Frontend Architecture:** 
   - Responsive UI frame (jaise hamne built kiya hai style.css ke saath).
   - Glassmorphic panels aur theme toggle capabilities.
   
2. **Real-time Sync Backend:**
   - Real-time updates ke liye **WebSockets** (Socket.io) ka use hota hai.
   - Database ke liye **Firebase Firestore** ya SQL Server use kiya jata hai.
   - Setup seekhne ke liye aap humse exact firebase codes poochh sakte hain!`;
        } else if (lowerMsg.includes('theme') || lowerMsg.includes('dark') || lowerMsg.includes('light')) {
            reply = "Aap side panel ke sabse upar bane **Moon/Sun button** 🌙 par click karke Light Mode aur Dark Mode ke beige instant switch kar sakte hain!";
        } else if (lowerMsg.includes('code') || lowerMsg.includes('javascript') || lowerMsg.includes('css')) {
            reply = "Main kisi bhi frontend code, CSS glassmorphic templates aur local storage caching APIs ko design karne me expert hoon. Poochhiye kya code likhna hai? 💻";
        } else {
            reply = `Arrey waah! Aapka message received hua. AXL CodeX Chat fully customized dynamic platform hai jisme:
- Standards-compliant Custom Scrollbars hain (Chromium aur Safari 2025/2026 specifications matching).
- CSS Variables custom properties active live theme switching hai.
- Web Audio API pure synth waves sound engines embedded hain.
 
Aap next kya improve karna chahenge?`;
        }

        setTimeout(() => {
            contact.status = 'online';
            if (activeContactId === 'axl-bot') {
                DOM.chatContactStatus.innerText = 'online';
            }
            
            contact.messages.push({
                sender: 'them',
                text: reply,
                time: getCurrentTimeFormatted(),
                status: 'read'
            });
            
            saveState();
            renderContacts(DOM.searchInput.value);
            if (activeContactId === 'axl-bot') {
                renderMessages();
            }
            playMessageSound('received');
        }, 1500);

    }, 800);
}

// 2. Jane Designer simulated response
function simulateJaneResponse(userMsg) {
    const contact = contacts.find(c => c.id === 'jane-designer');
    if (!contact) return;

    setTimeout(() => {
        contact.status = 'typing...';
        if (activeContactId === 'jane-designer') {
            DOM.chatContactStatus.innerText = 'typing...';
        }
        renderContacts(DOM.searchInput.value);

        setTimeout(() => {
            contact.status = 'online';
            if (activeContactId === 'jane-designer') {
                DOM.chatContactStatus.innerText = 'online';
            }
            
            contact.messages.push({
                sender: 'them',
                text: "Wow, that looks extremely clean! Let's schedule a Figma walkthrough tomorrow. Can you add custom animations to messages too?",
                time: getCurrentTimeFormatted(),
                status: 'read'
            });
            
            saveState();
            renderContacts(DOM.searchInput.value);
            if (activeContactId === 'jane-designer') {
                renderMessages();
            }
            playMessageSound('received');
        }, 2000);
    }, 1000);
}

// 3. Coding Group chat offline simulator
function simulateGroupResponse(userMsg) {
    const contact = contacts.find(c => c.id === 'coding-group');
    if (!contact) return;

    setTimeout(() => {
        contact.status = 'writing...';
        if (activeContactId === 'coding-group') {
            DOM.chatContactStatus.innerText = 'Harry is typing...';
        }
        renderContacts(DOM.searchInput.value);

        setTimeout(() => {
            contact.status = 'Global Live Chat';
            if (activeContactId === 'coding-group') {
                DOM.chatContactStatus.innerText = 'Global Live Chat';
            }
            
            contact.messages.push({
                sender: 'them',
                text: "Harry: Great progress! I'll test it on my mobile now to verify responsiveness. 📱",
                time: getCurrentTimeFormatted(),
                status: 'read'
            });
            
            saveState();
            renderContacts(DOM.searchInput.value);
            if (activeContactId === 'coding-group') {
                renderMessages();
            }
            playMessageSound('received');
        }, 1800);
    }, 1200);
}

// ==========================================================================
// Event Listeners & Theme Managers
// ==========================================================================

// Theme Switcher Core Logic
function initTheme() {
    const savedTheme = localStorage.getItem('axl_chat_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        DOM.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        DOM.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

DOM.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('axl_chat_theme', isLight ? 'light' : 'dark');
    DOM.themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    playMessageSound('sent'); // Feedback sound
});

// Message Form Submission listener
DOM.messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.messageInput.value.trim();
    if (!text) return;
    sendMessage(text);
    DOM.messageInput.value = '';
});

// Live Contacts Search Filtering listener
DOM.searchInput.addEventListener('input', (e) => {
    renderContacts(e.target.value);
});

// Mobile Back to Sidebar toggle
DOM.backBtn.addEventListener('click', () => {
    DOM.appWrapper.classList.remove('show-chat');
    activeContactId = null;
    renderContacts(DOM.searchInput.value);
});

// New Chat simulator button
DOM.newChatBtn.addEventListener('click', () => {
    const name = prompt("Enter new contact name:");
    if (!name) return;
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const hues = [0, 45, 120, 180, 240, 290];
    const randHue1 = hues[Math.floor(Math.random() * hues.length)];
    const randHue2 = (randHue1 + 120) % 360;
    
    const newContact = {
        id: `custom-${Date.now()}`,
        name: name,
        initials: initials || 'CO',
        color: `linear-gradient(135deg, hsl(${randHue1}, 80%, 40%), hsl(${randHue2}, 80%, 40%))`,
        status: "online",
        unread: 0,
        messages: [
            { sender: 'them', text: `Hi! You added me to AXL CodeX. Nice to meet you! 🎉`, time: getCurrentTimeFormatted(), status: 'read' }
        ]
    };
    
    contacts.unshift(newContact);
    saveState();
    renderContacts(DOM.searchInput.value);
    selectContact(newContact.id);
    playMessageSound('received');
});

// Initial Setup Launch
function init() {
    loadState();
    initTheme();
    initUserSession();
    renderContacts();
}

// Run Startup
init();
