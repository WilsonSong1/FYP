import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonItem,
  IonLabel,
  IonToggle,
} from "@ionic/react";
import { useHistory } from "react-router";
import { useEffect, useState } from "react";
import "./PageTheme.css";

const THEME_PREFERENCE_KEY = "themePreference";

const Profile: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const applyTheme = (enabled: boolean) => {
    document.body.classList.toggle("dark-mode", enabled);
  };

  const handleThemeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem("darkMode", String(enabled));
    localStorage.setItem(THEME_PREFERENCE_KEY, enabled ? "dark" : "light");
    applyTheme(enabled);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.setItem("darkMode", "false");
    setDarkMode(false);
    applyTheme(false);
    history.replace("/home");
    window.location.reload();
  };

  useEffect(() => {
    const savedThemePreference = localStorage.getItem(THEME_PREFERENCE_KEY);
    const savedDarkMode =
      savedThemePreference === "dark" ||
      (savedThemePreference === null && localStorage.getItem("darkMode") === "true");

    setDarkMode(savedDarkMode);
    applyTheme(savedDarkMode);

    const token = localStorage.getItem("token");

    if (!token) {
      history.push("/signup");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          history.push("/signup");
          return;
        }

        const data = await response.json();
        setUsername(data.username);
        localStorage.setItem("username", data.username);
      } catch {
        history.push("/signup");
      }
    };

    loadProfile();
  }, [history]);

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            onClick={() => history.push("/home")}
          >
            Home
          </IonButton>
          <IonTitle className="ion-text-center">Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        <IonText>
          <h2>Your Profile</h2>
          <p>Welcome back, {username || localStorage.getItem("username") || "User"}.</p>
        </IonText>

        <IonItem className="light-item theme-toggle-item" lines="none">
          <IonLabel>Dark Mode</IonLabel>
          <IonToggle
            slot="end"
            checked={darkMode}
            onIonChange={(event) => handleThemeChange(event.detail.checked)}
          />
        </IonItem>

        <IonButton className="ion-margin-top" expand="block" onClick={() => history.push("/saved-texts")}>
          View Saved Texts
        </IonButton>

        <IonButton className="ion-margin-top" expand="block" onClick={handleLogout}>
          Logout
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
