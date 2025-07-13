// Firebase Configuration for Moroccan Dama Online Multiplayer
// 
// 🔧 SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Click "Create a project" 
// 3. Name it "dama-multiplayer" (or any name you prefer)
// 4. Enable Google Analytics (optional)
// 5. After project is created, click the Web icon (</>)
// 6. Register your app name as "Dama Game"
// 7. Copy the firebaseConfig object and replace the values below
// 8. Go to "Firestore Database" in the left menu
// 9. Click "Create Database" and choose your region
// 10. Start in "test mode" for now
//
// 💡 The values below are placeholders - replace them with YOUR actual values!

// 🔽 YOUR ACTUAL FIREBASE CONFIG (Updated):
const firebaseConfig = {
    // IMPORTANT: Do NOT commit real API keys.  Replace the placeholder below with your own key in a private build step or Firebase config.
    apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
    authDomain: "dama-maroc-8bcff.firebaseapp.com",
    databaseURL: "https://dama-maroc-8bcff-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "dama-maroc-8bcff",
    storageBucket: "dama-maroc-8bcff.firebasestorage.app",
    messagingSenderId: "254217635542",
    appId: "1:254217635542:web:4dd685f0fa6517d0276b77",
    measurementId: "G-7BRV9BETGH"
};

// ⚠️ EXAMPLE of what your actual config should look like:
// const firebaseConfig = {
//     apiKey: "AIzaSyC7b2p8Q9X1Y2Z3...",
//     authDomain: "dama-multiplayer-abc123.firebaseapp.com",
//     databaseURL: "https://dama-multiplayer-abc123-default-rtdb.firebaseio.com/",
//     projectId: "dama-multiplayer-abc123",
//     storageBucket: "dama-multiplayer-abc123.appspot.com",
//     messagingSenderId: "123456789012",
//     appId: "1:123456789012:web:abc123def456"
// };

// Initialize Firebase with better error handling
let app;
let database;
let firestore;

try {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Make sure you have internet connection.');
    }

    // Check if config is properly set
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        console.warn('⚠️ Firebase not configured yet!');
        console.log('📋 Follow these steps:');
        console.log('1. Go to https://console.firebase.google.com/');
        console.log('2. Create a new project');
        console.log('3. Add a web app');
        console.log('4. Copy the config and replace the values in firebase-config.js');
        console.log('5. Enable Firestore');
        
        // Show user-friendly message
        document.addEventListener('DOMContentLoaded', () => {
            const onlineOptions = document.querySelectorAll('.online-option, .multiplayer-option.online-option');
            onlineOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('🔧 Firebase Setup Required!\n\n' +
                          '1. Go to https://console.firebase.google.com/\n' +
                          '2. Create a new project\n' +
                          '3. Add a web app and copy the config\n' +
                          '4. Replace the values in firebase-config.js\n' +
                          '5. Enable Firestore\n\n' +
                          'Check the browser console for detailed instructions!');
                });
            });
        });
        
        // Don't initialize Firebase with placeholder values
        throw new Error('Firebase configuration required');
    }

    // Initialize Firebase
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firestore = firebase.firestore();
    
    console.log('✅ Firebase initialized successfully!');
    console.log('🔗 Database URL:', firebaseConfig.databaseURL);
    console.log('🔥 Firestore initialized');
    console.log('🎮 Ready for online multiplayer!');
    
    // Test database connection
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            console.log('🌐 Connected to Firebase Realtime Database');
        } else {
            console.log('📡 Disconnected from Firebase');
        }
    });

} catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    
    if (error.message.includes('configuration required')) {
        console.log('🔧 Please update firebase-config.js with your Firebase project credentials');
    } else {
        console.log('💡 Possible solutions:');
        console.log('- Check your internet connection');
        console.log('- Verify Firebase project is active');
        console.log('- Check if Firestore is enabled');
        console.log('- Ensure all config values are correct');
    }
}

// Export for use in other files
window.firebaseApp = app;
window.firebaseDatabase = database;
window.firestore = firestore;

// Connection state monitoring
let connectionState = {
    isConnected: false,
    lastConnectedTime: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

// Enhanced connection monitoring
if (database) {
    database.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val() === true;
        const wasConnected = connectionState.isConnected;
        connectionState.isConnected = connected;
        
        if (connected) {
            connectionState.lastConnectedTime = Date.now();
            connectionState.reconnectAttempts = 0;
            console.log('🌐 Connected to Firebase');
            
            // Notify online multiplayer of connection restore
            if (!wasConnected && window.onlineMultiplayer) {
                console.log('🔄 Connection restored - refreshing game state');
                window.onlineMultiplayer.handleConnectionRestore();
            }
        } else {
            console.log('📡 Disconnected from Firebase');
            
            // Attempt reconnection if we have an active game
            if (window.onlineMultiplayer && window.onlineMultiplayer.roomCode) {
                console.log('🔄 Attempting to reconnect...');
                attemptReconnection();
            }
        }
        
        // Update UI connection indicator
        updateConnectionIndicator(connected);
    });
}

// Reconnection logic
function attemptReconnection() {
    if (connectionState.reconnectAttempts < connectionState.maxReconnectAttempts) {
        connectionState.reconnectAttempts++;
        const delay = Math.pow(2, connectionState.reconnectAttempts) * 1000; // Exponential backoff
        
        console.log(`🔄 Reconnection attempt ${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (!connectionState.isConnected && database) {
                // Force a connection check
                database.goOnline();
            }
        }, delay);
    } else {
        console.error('❌ Max reconnection attempts reached');
        showConnectionError();
    }
}

// Update connection indicator in UI
function updateConnectionIndicator(connected) {
    const indicators = document.querySelectorAll('.connection-indicator');
    indicators.forEach(indicator => {
        if (connected) {
            indicator.className = 'connection-indicator connected';
            indicator.title = 'Connected to server';
        } else {
            indicator.className = 'connection-indicator disconnected';
            indicator.title = 'Disconnected from server';
        }
    });
}

// Show connection error to user
function showConnectionError() {
    if (window.onlineMultiplayer && window.onlineMultiplayer.roomCode) {
        alert('Lost connection to the game server. Please refresh the page and rejoin the room.');
    }
}

// Helper function to check if Firebase is ready
window.isFirebaseReady = function() {
    return !!(window.firebaseApp && window.firebaseDatabase && connectionState.isConnected);
};

// Helper function to check if Firestore is ready
window.isFirestoreReady = () => {
    return !!(app && firestore);
};

// Enhanced connection test
window.testFirebaseConnection = async () => {
    if (!window.isFirebaseReady()) {
        return { success: false, message: 'Firebase not initialized or not connected' };
    }
    
    try {
        const testRef = database.ref('connection-test');
        await testRef.set({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            test: 'connection successful'
        });
        await testRef.remove();
        return { success: true, message: 'Firebase connection working!' };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Get connection state info
window.getConnectionState = () => {
    return {
        ...connectionState,
        isReady: window.isFirebaseReady()
    };
}; 