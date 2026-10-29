import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { KEYS, readJSON, writeJSON } from "../utils/storage";
import { useAuth } from "./AuthContext";

// Cantidad de días disponibles para configurar las alertas.
export type ReminderDays = 7 | 15 | 30;

// Configuración de notificaciones del usuario.
export interface NotificationPreferences {
  warrantyAlertsEnabled: boolean;
  reminderDays: ReminderDays;
}

// Valores predeterminados.
const defaultPreferences: NotificationPreferences = {
  warrantyAlertsEnabled: true,
  reminderDays: 30,
};

interface NotificationPreferencesContextValue {
  preferences: NotificationPreferences;
  loading: boolean;
  updatePreferences: (
    changes: Partial<NotificationPreferences>,
  ) => Promise<void>;
}

const NotificationPreferencesContext = createContext<
  NotificationPreferencesContextValue | undefined
>(undefined);

export function NotificationPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);

  const [loading, setLoading] = useState(true);

  // Cargar las preferencias guardadas del usuario.
  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      setLoading(true);
      setPreferences(defaultPreferences);

      if (!user) {
        setLoading(false);
        return;
      }

      const saved = await readJSON<NotificationPreferences>(
        KEYS.notificationPreferences(user.id),
        defaultPreferences,
      );

      if (active) {
        setPreferences(saved);
        setLoading(false);
      }
    }

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [user?.id]);

  // Actualizar y guardar las preferencias.
  const updatePreferences = useCallback(
    async (changes: Partial<NotificationPreferences>) => {
      if (!user || loading) return;

      const updated = {
        ...preferences,
        ...changes,
      };

      await writeJSON(KEYS.notificationPreferences(user.id), updated);

      setPreferences(updated);
    },
    [user, loading, preferences],
  );

  const value = useMemo(
    () => ({
      preferences,
      loading,
      updatePreferences,
    }),
    [preferences, loading, updatePreferences],
  );

  return (
    <NotificationPreferencesContext.Provider value={value}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

// Hook para acceder a las preferencias desde cualquier pantalla.
export function useNotificationPreferences() {
  const context = useContext(NotificationPreferencesContext);

  if (!context) {
    throw new Error(
      "useNotificationPreferences must be used within NotificationPreferencesProvider",
    );
  }

  return context;
}
