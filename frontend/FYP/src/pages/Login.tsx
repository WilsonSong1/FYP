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
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill="clear" size="large" onClick={() => history.push("/home")} >Chat Room</IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {error && <IonText color="danger">{error}</IonText>}

        <IonItem>
          <IonLabel position="stacked">Username</IonLabel>
          <IonInput
            value={username}
            onIonChange={(e) => setUsername(e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top" onClick={loginUser}>
          Login
        </IonButton>

        <IonButton expand="block" fill="clear" onClick={() => history.push("/forgotpass")}>
          Forgot password?
        </IonButton>

        <IonButton expand="block" fill="clear" onClick={() => history.push("/signup")}>
          Don't have an account? Sign Up
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;