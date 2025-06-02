import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js';
import {
  getDatabase,
  ref as rtdbRef,
  get,
  set,
  update
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js';
import firebaseConfig from '../firebase/firebase-config.js';
import { setUser, clearUser, updateProfile } from './user-cache.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

let currentAuthUser = null;
// Flag to prevent multiple redirects when login event fires again on new pages
let loginRedirectTriggered = false;

onAuthStateChanged(auth, async (user) => {
  currentAuthUser = user;
  if (user) {
    if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
      setUser({ uid: user.uid, email: user.email, emailVerified: false }, null);
      document.dispatchEvent(new CustomEvent('app:userLoggedIn', {
        detail: { user: { uid: user.uid, email: user.email, emailVerified: false }, profile: null, needsVerification: true }
      }));
      return;
    }

    try {
      const userProfilePath = `users/${user.uid}`;
      const adminStatusPath = `admins/${user.uid}`;

      const [profileSnapshot, adminStatusSnapshot] = await Promise.all([
        get(rtdbRef(rtdb, userProfilePath)),
        get(rtdbRef(rtdb, adminStatusPath))
      ]);

      let profileData;

      if (profileSnapshot.exists()) {
        profileData = profileSnapshot.val();
      } else {
        profileData = { name: "default", lastName: "default", ftue: false, profilePictureURL: "" };
        await set(rtdbRef(rtdb, userProfilePath), profileData);
      }

      profileData.isAdmin = adminStatusSnapshot.exists() && adminStatusSnapshot.val() === 'a';

      setUser({ uid: user.uid, email: user.email, emailVerified: user.emailVerified }, profileData);
      
      document.dispatchEvent(new CustomEvent('app:userLoggedIn', {
        detail: {
          user: { uid: user.uid, email: user.email, emailVerified: user.emailVerified },
          profile: profileData
        }
      }));      

    } catch (error) {
      console.error("Error in onAuthStateChanged (fetching profile/admin status):", error);
      clearUser();
      document.dispatchEvent(new CustomEvent('app:userLoggedIn', {
        detail: {
          user: { uid: user.uid, email: user.email, emailVerified: user.emailVerified },
          profile: null,
          error: "Failed to load user profile"
        }
      }));
    }
  } else {
    clearUser();
    document.dispatchEvent(new CustomEvent('app:userLoggedOut'));    
  }
});

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user.providerData.some(p => p.providerId === 'password') && !userCredential.user.emailVerified) {
      return { success: false, code: 'auth/email-not-verified', message: 'Verifica tu correo antes de continuar.' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, code: error.code, message: error.message };
  }
}

async function signupUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const defaultProfile = {
      name: "default",
      lastName: "default",
      ftue: false,
      profilePictureURL: ""
    };
    await set(rtdbRef(rtdb, `users/${user.uid}`), defaultProfile);
    await sendEmailVerification(user);
    return { success: true, message: 'Registro exitoso. Por favor verifica tu correo.' };
  } catch (error) {
    return { success: false, code: error.code, message: error.message };
  }
}

async function logoutUser() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function updateUserProfileDetails(uid, profileUpdateData, profilePicFile) {
  if (!uid) return { success: false, message: "User ID is required for profile update." };

  let updatesToUserProfile = { ...profileUpdateData };
  if (profileUpdateData.name !== undefined || profileUpdateData.lastName !== undefined) {
    updatesToUserProfile.ftue = true;
  }

  try {
    const userProfileRef = rtdbRef(rtdb, `users/${uid}`);
    const adminStatusRef = rtdbRef(rtdb, `admins/${uid}`);

    if (profilePicFile) {
      const picStoragePath = `profile_pictures/${uid}/${profilePicFile.name}`;
      const picStorageRefInstance = storageRef(storage, picStoragePath);
      await uploadBytes(picStorageRefInstance, profilePicFile);
      updatesToUserProfile.profilePictureURL = await getDownloadURL(picStorageRefInstance);
    } else if (profileUpdateData.profilePictureURL !== undefined) {
      updatesToUserProfile.profilePictureURL = profileUpdateData.profilePictureURL;
    }

    await update(userProfileRef, updatesToUserProfile);

    const [updatedProfileSnapshot, adminStatusSnapshot] = await Promise.all([
        get(userProfileRef),
        get(adminStatusRef)
    ]);

    if (updatedProfileSnapshot.exists()) {
      const newProfile = updatedProfileSnapshot.val();
      newProfile.isAdmin = (adminStatusSnapshot.exists() && adminStatusSnapshot.val() === 'a');

      updateProfile(newProfile);
      document.dispatchEvent(new CustomEvent('app:profileUpdated', {
        detail: { profile: newProfile }
      }));

      return { success: true, profile: newProfile };
    } else {
      throw new Error("Updated profile node does not exist after update.");
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

document.addEventListener('app:requestProfileUpdate', async (event) => {
  const { uid, data, file } = event.detail;
  if (uid) {
    await updateUserProfileDetails(uid, data, file);
  } else {
    console.error("app:requestProfileUpdate event is missing UID.");
  }
});

document.addEventListener('app:requestLogout', async () => {
  await logoutUser();
});

// Expose functions needed by UI, could be done more selectively if preferred
window.authService = {
  loginUser,
  signupUser,
  logoutUser, // Exposing logout if other parts of UI might call it
  updateUserProfileDetails // Exposing if other UI parts call it
};


// --- UI Logic for login.html ---
// This function will set up the UI event listeners for the login page
function initializeLoginUI() {
    // Login Elements
    const loginWidget = document.getElementById('loginWidget');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const signInButton = document.getElementById('signInButton');
    const showSignUpLink = document.getElementById('showSignUp');
    const loginPasswordToggle = loginWidget?.querySelector('.toggle-password'); // Added optional chaining
    const loginEyeImg = document.getElementById('loginEyeImg');

    // Sign Up Elements
    const signUpWidget = document.getElementById('signUpWidget');
    const signUpEmailInput = document.getElementById('signUpEmail');
    const signUpPasswordInput = document.getElementById('signUpPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signUpButton = document.getElementById('signUpButton');
    const showLoginLink = document.getElementById('showLogin');
    const signUpPasswordToggle = signUpWidget?.querySelector('.toggle-password'); // Added optional chaining
    const signUpEyeImg = document.getElementById('signUpEyeImg');

    // Check if we are on the login page by looking for a key element
    if (!loginWidget && !signUpWidget) {
        // Not on the login/signup page, so don't try to set up UI listeners
        return;
    }
    
    const eyeIconPath = '../assets/png/eye.png';
    const eyeSlashIconPath = '../assets/png/eye-slash.png';

    function togglePasswordVisibility(passwordInput, eyeImg) {
        if (!passwordInput || !eyeImg) return; // Guard clause
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeImg.src = eyeSlashIconPath;
        } else {
            passwordInput.type = 'password';
            eyeImg.src = eyeIconPath;
        }
    }

    if (showSignUpLink) {
        showSignUpLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginWidget && signUpWidget) {
                loginWidget.classList.add('hidden');
                signUpWidget.classList.remove('hidden');
            }
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signUpWidget && loginWidget) {
                signUpWidget.classList.add('hidden');
                loginWidget.classList.remove('hidden');
            }
        });
    }

    if (loginPasswordToggle) {
        loginPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(loginPasswordInput, loginEyeImg);
        });
    }

    if (signUpPasswordToggle) {
        signUpPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(signUpPasswordInput, signUpEyeImg);
        });
    }
    
    if (signInButton) {
        signInButton.addEventListener('click', async () => {
            if (!loginEmailInput || !loginPasswordInput) return;
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value;

            if (!email || !password) {
                popupNotifier.error('Por favor ingresa correo y contraseña.', 'Credenciales faltantes');
                return;
            }
            signInButton.disabled = true;
            signInButton.textContent = 'Iniciando sesión...';
            const result = await loginUser(email, password); // Calls the loginUser function from above
            if (!result.success) {
                popupNotifier.error('Autenticación fallida: correo o contraseña incorrectos.', 'Inicio de sesión fallido');
            }
            signInButton.disabled = false;
            signInButton.textContent = 'Ingresar';
        });
    }

    if (signUpButton) {
        signUpButton.addEventListener('click', async () => {
            if(!signUpEmailInput || !signUpPasswordInput || !confirmPasswordInput) return;
            const email = signUpEmailInput.value.trim();
            const password = signUpPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!email || !password || !confirmPassword) {
                popupNotifier.error('Por favor completa todos los campos para registrarte.', 'Campos faltantes');
                return;
            }
            if (password.length < 6) {
                popupNotifier.error('La contraseña debe tener al menos 6 caracteres.', 'Contraseña débil');
                return;
            }
            if (password !== confirmPassword) {
                popupNotifier.error('Las contraseñas no coinciden.', 'Contraseñas distintas');
                return;
            }
            signUpButton.disabled = true;
            signUpButton.textContent = 'Registrando...';
            const result = await signupUser(email, password); // Calls the signupUser function from above
            if (result.success) {
                popupNotifier.success('Registro exitoso. Verifica tu correo.', 'Registro exitoso');
                if (signUpWidget && loginWidget) {
                    signUpWidget.classList.add('hidden');
                    loginWidget.classList.remove('hidden');
                }
                signUpEmailInput.value = '';
                signUpPasswordInput.value = '';
                confirmPasswordInput.value = '';
            } else {
                popupNotifier.error(result.message || result.code, 'Error de registro');
            }
            signUpButton.disabled = false;
            signUpButton.textContent = 'Registrarse';
        });
    }
}

// Global event listeners for app state changes
document.addEventListener('app:userLoggedIn', (event) => {
    const { user, profile, needsVerification, error } = event.detail;
   // console.log('User logged in (UI event):', user, profile);
    if (error) {
        console.error("Login/Profile fetch error reported to UI:", error);
        // Potentially show this error on the login page if it's still visible
    } else if (needsVerification) {
         popupNotifier.info('Revisa tu correo para verificar tu cuenta antes de iniciar sesión.', 'Verificar correo');
    } else if (user && user.emailVerified && window.location.pathname.startsWith('/auth/login') && !loginRedirectTriggered) {
        popupNotifier.success('¡Inicio de sesión exitoso! Redirigiendo...', 'Inicio exitoso');
        loginRedirectTriggered = true;
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirect || '/inicio/landing.html';
    }
});

document.addEventListener('app:userLoggedOut', () => {
    console.log('User logged out (UI event)');
    // If current page is not login.html and requires auth, redirect to login
    if (!window.location.pathname.endsWith('/auth/login.html') && !window.location.pathname.endsWith('/login.html')) {
        // Add logic here to check if current page requires authentication
        // For simplicity, this example doesn't do that check.
    }
});


// --- Initialize UI elements when the DOM is ready ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginUI);
} else {
    // DOMContentLoaded has already fired
    initializeLoginUI();
}