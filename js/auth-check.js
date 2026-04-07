/**
 * AINTERCOM Interface - Vérification d'authentification
 * Vérifie la session utilisateur et redirige si non connecté
 */

// Configuration Supabase (mêmes clés que dans index.html)
const SUPABASE_CONFIG = {
    url: 'https://wmbyccbyhtjzvsxxrsbe.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYnljY2J5aHRqenZzeHhyc2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTc0NDQsImV4cCI6MjA5MDM3MzQ0NH0.Pb3C36m05SygQcEhidH4fHXJHMvMw2XN7g5iCFkBGaM'
};

let supabaseClient = null;

/**
 * Initialiser le client Supabase
 */
async function initSupabase() {
    try {
        if (typeof supabase === 'undefined') {
            console.error('❌ SDK Supabase non chargée');
            return false;
        }
        
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('✅ Client Supabase initialisé pour interface');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation Supabase:', error.message);
        return false;
    }
}

/**
 * Vérifier la session utilisateur
 * Retourne l'utilisateur connecté ou null
 */
async function checkUserSession() {
    try {
        // 1. Vérifier session locale
        const localSession = localStorage.getItem('aintercom_session');
        if (localSession) {
            try {
                const session = JSON.parse(localSession);
                // Vérifier expiration (24h)
                if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                    console.log('✅ Session locale valide:', session.email);
                    return session;
                } else {
                    console.log('⚠️ Session locale expirée');
                    localStorage.removeItem('aintercom_session');
                }
            } catch (e) {
                console.warn('⚠️ Session locale invalide');
                localStorage.removeItem('aintercom_session');
            }
        }
        
        // 2. Vérifier session Supabase si client disponible
        if (supabaseClient) {
            const { data: { session: sbSession }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Erreur vérification session Supabase:', error.message);
                return null;
            }
            
            if (sbSession?.user) {
                const user = {
                    id: sbSession.user.id,
                    email: sbSession.user.email,
                    name: sbSession.user.user_metadata?.name || sbSession.user.email.split('@')[0],
                    provider: sbSession.user.app_metadata?.provider || 'email',
                    timestamp: Date.now()
                };
                
                // Sauvegarder en local
                localStorage.setItem('aintercom_session', JSON.stringify(user));
                console.log('✅ Session Supabase valide:', user.email);
                return user;
            }
        }
        
        console.log('⚠️ Aucune session valide trouvée');
        return null;
    } catch (error) {
        console.error('❌ Erreur vérification session:', error.message);
        return null;
    }
}

/**
 * Rediriger vers la page de connexion
 */
function redirectToLogin() {
    console.log('🔒 Redirection vers la page de connexion...');
    // Utiliser le chemin absolu avec /aintercom/ pour GitHub Pages
    const loginUrl = window.location.origin.includes('github.io') 
        ? '/aintercom/index.html'
        : '/index.html';
    
    window.location.href = loginUrl;
}

/**
 * Afficher le nom d'utilisateur dans l'interface
 */
function displayUserName(user) {
    const userName = user.name || user.email.split('@')[0];
    
    // Créer ou mettre à jour l'élément d'affichage du nom
    let userDisplay = document.getElementById('user-display');
    
    if (!userDisplay) {
        // Créer l'élément dans le header
        const header = document.querySelector('header');
        if (header) {
            const userContainer = document.createElement('div');
            userContainer.id = 'user-display';
            userContainer.className = 'flex items-center gap-3';
            userContainer.innerHTML = `
                <div class="flex flex-col items-end">
                    <span class="text-xs font-bold text-blue-400 uppercase">Connecté en tant que</span>
                    <span class="text-sm font-black text-white">${userName}</span>
                </div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                    ${userName.charAt(0).toUpperCase()}
                </div>
                <button id="logout-btn" class="text-xs text-gray-400 hover:text-white transition" title="Déconnexion">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
            
            // Insérer dans le header (à droite)
            const headerRight = header.querySelector('.flex.items-center.gap-6');
            if (headerRight) {
                headerRight.prepend(userContainer);
            } else {
                header.appendChild(userContainer);
            }
            
            // Ajouter événement de déconnexion
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
        }
    } else {
        // Mettre à jour le nom existant
        const nameSpan = userDisplay.querySelector('.text-sm.font-black');
        if (nameSpan) {
            nameSpan.textContent = userName;
        }
    }
    
    console.log('👤 Nom utilisateur affiché:', userName);
}

/**
 * Gérer la déconnexion
 */
async function handleLogout() {
    try {
        // Supprimer session locale
        localStorage.removeItem('aintercom_session');
        
        // Déconnexion Supabase si client disponible
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        
        console.log('👋 Déconnexion réussie');
        
        // Rediriger vers la page d'accueil
        redirectToLogin();
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error.message);
        // Forcer la redirection quand même
        redirectToLogin();
    }
}

/**
 * Initialiser l'authentification
 * Fonction principale appelée au chargement
 */
async function initAuth() {
    console.log('🔐 Initialisation authentification interface...');
    
    // Initialiser Supabase
    const supabaseReady = await initSupabase();
    
    // Vérifier la session
    const user = await checkUserSession();
    
    if (!user) {
        console.log('❌ Utilisateur non authentifié, redirection...');
        redirectToLogin();
        return null;
    }
    
    console.log('✅ Utilisateur authentifié:', user.email);
    
    // Afficher le nom d'utilisateur
    displayUserName(user);
    
    // Configurer la surveillance de la session
    if (supabaseReady && supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Événement auth:', event);
            
            if (event === 'SIGNED_OUT') {
                console.log('⚠️ Déconnexion détectée, redirection...');
                redirectToLogin();
            }
        });
    }
    
    return user;
}

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAuth,
        checkUserSession,
        handleLogout
    };
}