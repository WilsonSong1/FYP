import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonText
} from "@ionic/react";

import { useIonRouter } from "@ionic/react";
import { useState } from "react";
import "./PageTheme.css";

const Signup: React.FC = () => {
  const ionRouter = useIonRouter();
  // Form input values.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Error message shown on fail.
  const [error, setError] = useState("");

  const registerUser = async () => {
    // Send signup details to backend.
    const response = await fetch("http://127.0.0.1:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail);
      return;
    }

    // Go to login after successful signup.
    ionRouter.push("/login");
  };

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
          <IonTitle className="ion-text-center">Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        {error && <IonText color="danger">{error}</IonText>}

        <IonItem className="light-item">
          <IonLabel position="stacked">Username</IonLabel>
          <IonInput
            value={username}
            onIonChange={(e) => setUsername(e.detail.value!)}
          />
        </IonItem>

        <IonItem className="light-item">
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>

        <IonItem className="light-item">
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top light-primary-button" onClick={registerUser}>
          Create Account
        </IonButton>

        <IonButton className="light-link-button" expand="block" fill="clear" onClick={() => ionRouter.push("/login")} >
          Already have an account? Login
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Signup;