import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { trash, copy } from "ionicons/icons";
import "./PageTheme.css";

interface SavedText {
  _id: string;
  username: string;
  text: string;
  created_at: string;
  updated_at: string;
}

const SavedTexts: React.FC = () => {
  const history = useHistory();
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      history.push("/signup");
      return;
    }

    const fetchSavedTexts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/get-saved-texts", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch saved texts");
        }

        const data = await response.json();
        setSavedTexts(data.saved_texts);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading saved texts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTexts();
  }, [history]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const deleteText = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this text?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://127.0.0.1:8000/delete-saved-text/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSavedTexts(savedTexts.filter((text) => text._id !== id));
        } else {
          alert("Failed to delete text");
        }
      } catch (err) {
        console.error("Error deleting text:", err);
        alert("Error deleting text");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
            onClick={() => history.push("/profile")}
          >
            Back
          </IonButton>
          <IonTitle className="ion-text-center">Saved Texts</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {!loading && savedTexts.length === 0 && (
          <IonText>
            <p>No saved texts yet. Save texts from the chatbot to see them here!</p>
          </IonText>
        )}

        {savedTexts.map((savedText) => (
          <IonCard key={savedText._id} className="saved-text-card">
            <IonCardContent>
              <div style={{ marginBottom: "10px" }}>
                <small style={{ color: "#999" }}>
                  Saved on {formatDate(savedText.created_at)}
                </small>
              </div>
              <p style={{ margin: "10px 0", lineHeight: "1.6" }}>
                {savedText.text}
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => copyToClipboard(savedText.text)}
                >
                  <IonIcon icon={copy} slot="start" />
                  Copy
                </IonButton>
                <IonButton
                  size="small"
                  fill="outline"
                  color="danger"
                  onClick={() => deleteText(savedText._id)}
                >
                  <IonIcon icon={trash} slot="start" />
                  Delete
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default SavedTexts;
