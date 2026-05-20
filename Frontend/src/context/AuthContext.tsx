import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import { requestFcmToken } from "../firebase";
import { usuarioService } from "../services/usuarioService";
import type { LoginRequest, RegisterRequest, User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithToken: (tokenValue: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  verify: (correo: string, codigo: string) => Promise<void>;
  registrationEmail: string | null;
  setRegistrationEmail: (email: string | null) => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      try {
        const parsed = JSON.parse(stored) as User;
        if (!parsed.idUsuario || !parsed.nombres) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          return null;
        }
        return parsed;
      } catch {
        localStorage.removeItem("user");
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined") return null;
    try {
      const parsed = JSON.parse(stored) as User;
      if (!parsed.idUsuario || !parsed.nombres) return null;
    } catch {
      return null;
    }
    return localStorage.getItem("token");
  });
  const [isLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(
    null,
  );

  const registerFcm = (idUsuario: number) => {
    requestFcmToken().then((fcmToken) => {
      if (fcmToken) {
        usuarioService.registrarFcmToken(idUsuario, fcmToken).catch(() => {});
      }
    });
  };

  // Si el usuario ya está logueado al cargar la app, también intentar
  // registrar el token FCM (por si dieron permiso de notificaciones después
  // del login original).
  useEffect(() => {
    if (user?.idUsuario) registerFcm(user.idUsuario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.idUsuario]);

  const login = async (credentials: LoginRequest) => {
    const { token: jwt, usuario } = await authService.login(credentials);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(usuario));
    setToken(jwt);
    setUser(usuario);
    registerFcm(usuario.idUsuario);
  };

  const loginWithToken = async (tokenValue: string) => {
    const { token: jwt, usuario } = await authService.loginWithToken(tokenValue);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(usuario));
    localStorage.setItem("userToken", tokenValue);
    setToken(jwt);
    setUser(usuario);
    registerFcm(usuario.idUsuario);
    return usuario;
  };

  const register = async (data: RegisterRequest) => {
    await authService.register(data);
    setRegistrationEmail(data.correo);
  };

  const verify = async (correo: string, codigo: string) => {
    await authService.verify(correo, codigo);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: User) => {
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        verify,
        registrationEmail,
        setRegistrationEmail,
        setUser: updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
