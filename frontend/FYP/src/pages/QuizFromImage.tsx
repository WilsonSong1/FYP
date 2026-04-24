import React from "react";
import { useState } from "react";
import { useIonRouter } from "@ionic/react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonText,
} from "@ionic/react";
import "./PageTheme.css";

interface AnalysisResult {
  filename: string;
  summary: string;
  key_points: string[];
}

const QuizFromImage: React.FC = () => {
  const ionRouter = useIonRouter();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setAnalysis(null);
    }
  };

  const handleExtractAndAnalyze = async () => {
    if (!file) {
      alert("Please select an image file first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/extract-text-from-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileName("");
    setAnalysis(null);
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
            onClick={() => ionRouter.push("/home")}
          >
            Home
          </IonButton>
          <IonTitle className="ion-text-center">Generate Quiz From Image</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        {!analysis && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="image-input"
                style={{
                  display: "block",
                  padding: "15px",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  border: "2px dashed #d8e8f8",
                  borderRadius: "10px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(240, 248, 255, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
                }}
              >
                {fileName ? (
                  <IonText>
                    <p><strong>Selected:</strong> {fileName}</p>
                  </IonText>
                ) : (
                  <IonText>
                    <p style={{ color: "#6f9fcc", fontWeight: "500" }}>
                      Click to select an image file
                    </p>
                  </IonText>
                )}
              </label>
              <input
                id="image-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <IonButton
              className="light-primary-button"
              expand="block"
              onClick={handleExtractAndAnalyze}
              disabled={loading || !file}
            >
              {loading ? "Analyzing..." : "Analyze Image"}
            </IonButton>

            {loading && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "40px",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <IonSpinner name="circles" color="primary" />
                <p style={{ fontSize: "16px", fontWeight: "500" }}>
                  Analyzing image...
                </p>
              </div>
            )}
          </>
        )}

        {analysis && (
          <>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "20px",
                borderLeft: "5px solid #6f9fcc",
              }}
            >
              <IonText>
                <h3>Summary</h3>
                <p>{analysis.summary}</p>
              </IonText>
            </div>

            {analysis.key_points && analysis.key_points.length > 0 && (
              <div
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  padding: "15px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  borderLeft: "5px solid #6f9fcc",
                }}
              >
                <IonText>
                  <h3>Key Points</h3>
                  <ul>
                    {analysis.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </IonText>
              </div>
            )}

            <IonButton className="light-primary-button" expand="block" onClick={resetForm}>
              Analyze Another Image
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default QuizFromImage;
