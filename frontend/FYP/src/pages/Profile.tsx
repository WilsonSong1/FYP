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
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useIonRouter } from "@ionic/react";
import { useEffect, useState } from "react";
import "./PageTheme.css";

const THEME_PREFERENCE_KEY = "themePreference";

const Profile: React.FC = () => {
  const ionRouter = useIonRouter();
  // Username shown on profile page.
  const [username, setUsername] = useState("");
  // Dark mode toggle state.
  const [darkMode, setDarkMode] = useState(false);
  // Quiz performance summary.
  const [quizAverage, setQuizAverage] = useState<number | null>(null);
  const [quizCount, setQuizCount] = useState(0);

  const applyTheme = (enabled: boolean) => {
    // Add or remove dark-mode class on body.
    document.body.classList.toggle("dark-mode", enabled);
  };

  const handleThemeChange = (enabled: boolean) => {
    // Save theme choice and apply it.
    setDarkMode(enabled);
    localStorage.setItem("darkMode", String(enabled));
    localStorage.setItem(THEME_PREFERENCE_KEY, enabled ? "dark" : "light");
    applyTheme(enabled);
  };

  const handleLogout = () => {
    // Clear user session and reset theme.
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.setItem("darkMode", "false");
    setDarkMode(false);
    applyTheme(false);
    ionRouter.push("/home");
    window.location.reload();
  };

  useEffect(() => {
    // Load saved theme when page opens.
    const savedThemePreference = localStorage.getItem(THEME_PREFERENCE_KEY);
    const savedDarkMode =
      savedThemePreference === "dark" ||
      (savedThemePreference === null && localStorage.getItem("darkMode") === "true");

    setDarkMode(savedDarkMode);
    applyTheme(savedDarkMode);

    const token = localStorage.getItem("token");

    // If not logged in, go to signup.
    if (!token) {
      ionRouter.push("/signup");
      return;
    }

    const loadProfile = async () => {
      try {
        // Get username from backend.
        const response = await fetch("http://127.0.0.1:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          ionRouter.push("/signup");
          return;
        }

        const data = await response.json();
        setUsername(data.username);
        localStorage.setItem("username", data.username);

        const quizResultsResponse = await fetch("http://127.0.0.1:8000/get-quiz-results", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (quizResultsResponse.ok) {
          const quizResultsData = await quizResultsResponse.json();
          setQuizCount(quizResultsData.count || 0);

          const totalScore = quizResultsData.quiz_results.reduce(
            (sum: number, result: { score: number }) => sum + (result.score || 0),
            0
          );
          const totalQuestions = quizResultsData.quiz_results.reduce(
            (sum: number, result: { total_questions: number }) => sum + (result.total_questions || 0),
            0
          );

          setQuizAverage(totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : null);
        } else {
          setQuizAverage(null);
          setQuizCount(0);
        }
      } catch {
        // If request fails, go to signup.
        ionRouter.push("/signup");
      }
    };

    loadProfile();
  }, [ionRouter]);

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            routerLink="/home"
            routerDirection="back"
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

        <IonCard className="saved-text-card">
          <IonCardContent>
            <IonText>
              <h2 style={{ marginTop: 0 }}>Quiz Performance</h2>
              {quizAverage === null ? (
                <p>No quiz results yet.</p>
              ) : (
                <>
                  <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>
                    Average result: {quizAverage.toFixed(1)}%
                  </p>
                  <p style={{ margin: 0 }}>Based on {quizCount} saved quiz result{quizCount === 1 ? "" : "s"}.</p>
                </>
              )}
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonButton className="ion-margin-top" expand="block" onClick={() => ionRouter.push("/saved-texts")}>
          View Saved Texts
        </IonButton>

        <IonButton className="ion-margin-top" expand="block" onClick={() => ionRouter.push("/quiz-results")}>
          View Past Quiz Results
        </IonButton>

        <IonButton className="ion-margin-top" expand="block" onClick={handleLogout}>
          Logout
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
