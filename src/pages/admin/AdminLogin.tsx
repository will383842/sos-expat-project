import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, Shield } from 'lucide-react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  // SECURITY FIX: Removed hardcoded credentials - 2025-12-23
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email admin autorisé (seul cet email peut accéder à l'admin)
  const ADMIN_EMAIL = 'williamsjullin@gmail.com';

  // Check if user is already logged in and is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const isAdminEmail = user.email?.toLowerCase() === ADMIN_EMAIL;

          if (isAdminEmail) {
            navigate('/admin/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Activer la persistance pour la session
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is admin
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      console.log('i am here');
      console.log(userDoc.exists(), " : userDoc.exists()");
      console.log(userDoc.data(), " : userDoc data");
      
      // Vérifier que c'est l'email admin autorisé
      const isAdminEmail = user.email?.toLowerCase() === ADMIN_EMAIL;

      if (!isAdminEmail) {
        // Email non autorisé - refuser l'accès
        console.log('[AdminLogin] Accès refusé - email non autorisé:', user.email);
        setError('Accès non autorisé. Seul l\'administrateur peut se connecter.');
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error signing out:', error);
        }
        return;
      }

      // Email admin autorisé - créer ou mettre à jour le document
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          uid: user.uid,
          email: user.email,
          role: 'admin',
          isActive: true,
          isApproved: true,
          preferredLanguage: 'fr',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } else {
        // Mettre à jour lastLoginAt
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          isActive: true
        }, { merge: true });
      }

      console.log('[AdminLogin] Accès autorisé pour:', user.email);
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou mot de passe incorrect';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre internet';
      default:
        return 'Une erreur est survenue. Veuillez réessayer';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-600 p-3 rounded-full">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Console d'administration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Accès réservé aux administrateurs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">
                      Erreur de connexion
                    </h3>
                    <div className="mt-2 text-sm text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Adresse email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn size={20} className="mr-2" />
                    <span>Connexion administrateur</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-gray-300">
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

