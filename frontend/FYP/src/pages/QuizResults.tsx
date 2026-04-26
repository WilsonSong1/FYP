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
  IonList,
  IonItem,
  IonLabel,
  useIonViewWillEnter,
  useIonRouter,
} from "@ionic/react";
import React, { useState } from "react";
import "./PageTheme.css";

interface QuizQuestionResult {
  question: string;
  selected_answer_key: string;
  selected_answer_text: string;
  correct_answer_key: string;
  correct_answer_text: string;
  is_correct: boolean;
  wrong_answer?: string;
}

interface QuizResult {
  _id: string;
  username: string;
  topic: string;
  level: string;
  score: number;
  total_questions: number;
  questions: QuizQuestionResult[];
  created_at: string;
  updated_at: string;
}

const QuizResults: React.FC = () => {
  const ionRouter = useIonRouter();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizResults = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      ionRouter.push("/signup");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:8000/get-quiz-results", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz results");
      }

      const data = await response.json();
      setQuizResults(data.quiz_results);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading quiz results");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchQuizResults();
  });

  const deleteQuizResult = async (quizResultId: string) => {
    if (!window.confirm("Delete this quiz result?")) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      ionRouter.push("/signup");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/delete-quiz-result/${quizResultId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete quiz result");
      }

      setQuizResults((currentResults) => currentResults.filter((result) => result._id !== quizResultId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting quiz result");
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  return (
    <IonPage className="light-page">
      <IonHeader>
        <IonToolbar className="light-toolbar">
          <IonButton
            slot="start"
            className="light-link-button"
            fill="clear"
            size="large"
            routerLink="/profile"
            routerDirection="back"
          >
            Back
          </IonButton>
          <IonTitle className="ion-text-center">Past Quiz Results</IonTitle>
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

        {!loading && quizResults.length === 0 && (
          <IonText>
            <p>No quiz results saved yet. Complete a quiz and save it from the results screen.</p>
          </IonText>
        )}

        {quizResults.map((result) => (
          <IonCard key={result._id} className="saved-text-card">
            <IonCardContent>
              <div style={{ marginBottom: "10px" }}>
                <small style={{ color: "#999" }}>Saved on {formatDate(result.created_at)}</small>
              </div>
              <h2 style={{ marginBottom: "8px" }}>
                {result.topic} - {result.level}
              </h2>
              <p style={{ marginBottom: "16px", fontWeight: 600 }}>
                Score: {result.score} / {result.total_questions}
              </p>

              <IonButton
                size="small"
                fill="outline"
                color="danger"
                onClick={() => deleteQuizResult(result._id)}
                style={{ marginBottom: "14px" }}
              >
                Delete Result
              </IonButton>

              <IonList>
                {result.questions.map((question, index) => (
                  <IonItem key={`${result._id}-${index}`} lines="full">
                    <IonLabel>
                      <h3>
                        {index + 1}. {question.question}
                      </h3>
                      <p>
                        <strong>Your answer:</strong> {question.selected_answer_text}
                      </p>
                      <p>
                        <strong>Correct answer:</strong> {question.correct_answer_text}
                      </p>
                      <p style={{ fontWeight: 600, color: question.is_correct ? "green" : "red" }}>
                        {question.is_correct ? "Correct" : "Incorrect"}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default QuizResults;