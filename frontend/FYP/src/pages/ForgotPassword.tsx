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
import { useIonRouter } from "@ionic/react";
import "./PageTheme.css";

const ForgotPassword: React.FC = () => {
  const ionRouter = useIonRouter();
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (ionRouter.canGoBack()) {
      ionRouter.goBack();
      return;
    }

    ionRouter.push("/login");
  };

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);

    const response = await fetch("http://127.0.0.1:8000/forgot-password/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.detail || "Something went wrong.");
      return;
    }

    setInfo(data.message || "If that email exists, a code has been sent.");

    ionRouter.push(`/resetpass?email=${encodeURIComponent(email)}`);
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
            onClick={handleBack}
          >
            Back
          </IonButton>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {info && <IonText color="success"><p>{info}</p></IonText>}

        <IonItem className="light-item">
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            onIonChange={(e) => setEmail(e.detail.value || "")}
          />
        </IonItem>

        <IonButton expand="block" className="ion-margin-top light-primary-button" onClick={handleSubmit}>
          Send reset code
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;