import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import { useState } from "react";
import { useHistory, useLocation } from "react-router";

const ResetPassword: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const emailFromQuery = params.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    setInfo(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || "Could not reset password.");
      return;
    }

    setInfo(data.message || "Password updated successfully.");
    // Optionally redirect to login after success
    setTimeout(() => history.push("/login"), 1500);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {info && <IonText color="success"><p>{info}</p></IonText>}

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            onIonChange={(e) => setEmail(e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">6-digit code</IonLabel>
          <IonInput
            value={code}
            onIonChange={(e) => setCode(e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">New password</IonLabel>
          <IonInput
            type="password"
            value={newPassword}
            onIonChange={(e) => setNewPassword(e.detail.value || "")}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Confirm new password</IonLabel>
          <IonInput
            type="password"
            value={confirmPassword}
            onIonChange={(e) => setConfirmPassword(e.detail.value || "")}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top" onClick={handleReset}>
          Reset password
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
