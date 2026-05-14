import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Plain JS reference that non-React code (axios interceptors) can import
export const authActions = {
  setUser: null,
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const setUserRef = useCallback((u) => setUser(u), []);

  useEffect(() => {
    authActions.setUser = setUserRef;
    return () => {
      authActions.setUser = null;
    };
  }, [setUserRef]);

  return (
    <AuthContext.Provider value={{ user, setUser: setUserRef }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);