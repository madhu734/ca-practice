import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { pb, USERS_COLLECTION, type User } from "./pb";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: FormData | Record<string, unknown>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (
    token: string,
    password: string,
    passwordConfirm: string,
  ) => Promise<void>;
  updateProfile: (data: FormData | Record<string, unknown>) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const m = pb.authStore.record;
      setUser(m ? { id: m.id, email: m.email, name: m.name, avatar: m.avatar } : null);
    };
    sync();

    if (pb.authStore.isValid && pb.authStore.token) {
      pb.collection(USERS_COLLECTION)
        .authRefresh()
        .then(() => {
          sync();
          setLoading(false);
        })
        .catch(() => {
          pb.authStore.clear();
          sync();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const unsub = pb.authStore.onChange(sync);
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await pb.collection(USERS_COLLECTION).authWithPassword(email, password);
  };

  const register = async (data: FormData | Record<string, unknown>) => {
    await pb.collection(USERS_COLLECTION).create(data);
    // Auto-login after signup
    const email =
      data instanceof FormData ? String(data.get("email") ?? "") : String(data.email ?? "");
    const password =
      data instanceof FormData ? String(data.get("password") ?? "") : String(data.password ?? "");
    if (email && password) {
      await pb.collection(USERS_COLLECTION).authWithPassword(email, password);
    }
  };

  const requestPasswordReset = async (email: string) => {
    await pb.collection(USERS_COLLECTION).requestPasswordReset(email);
  };

  const confirmPasswordReset = async (
    token: string,
    password: string,
    passwordConfirm: string,
  ) => {
    await pb.collection(USERS_COLLECTION).confirmPasswordReset(token, password, passwordConfirm);
  };

  const updateProfile = async (data: FormData | Record<string, unknown>) => {
    const id = pb.authStore.record?.id;
    if (!id) throw new Error("Not signed in");
    await pb.collection(USERS_COLLECTION).update(id, data);
    // refresh local auth record
    await pb.collection(USERS_COLLECTION).authRefresh().catch(() => {});
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        register,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        logout,
      }}
    >

      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
