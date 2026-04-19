import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router";
import { useEffect, useState } from "react";
import "./PageTheme.css";

const Profile: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    history.replace("/home");
    window.location.reload();
  };

  useEffect(() => {
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

        <IonButton className="ion-margin-top" expand="block" onClick={handleLogout}>
          Logout
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
