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

import { useHistory } from "react-router";
import { useState } from "react";
import "./PageTheme.css";

const Login: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginUser = async () => {
    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail);
      return;
    }

    localStorage.setItem("token", data.access_token);

    history.push("/home");
  };

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton slot="start" className="light-link-button" fill="clear" size="large" onClick={() => history.push("/home")} >Home</IonButton>
          <IonTitle className="ion-text-center">Login</IonTitle>
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
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top light-primary-button" onClick={loginUser}>
          Login
        </IonButton>

        <IonButton className="light-link-button" expand="block" fill="clear" onClick={() => history.push("/forgotpass")}>
          Forgot password?
        </IonButton>

        <IonButton className="light-link-button" expand="block" fill="clear" onClick={() => history.push("/signup")}>
          Don't have an account? Sign Up
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;