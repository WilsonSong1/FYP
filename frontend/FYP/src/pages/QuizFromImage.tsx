import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonSpinner,
  IonText,
  useIonRouter,
} from "@ionic/react";
import "./PageTheme.css";

interface Question {
  question: string;
  options: { [key: string]: string };
  correct_answer: string;
}

interface QuizResultItem {
  question: string;
  selectedAnswerKey: string;
  selectedAnswerText: string;
  correctAnswerKey: string;
  correctAnswerText: string;
  isCorrect: boolean;
  wrongAnswer?: string;
}

const QuizFromImage: React.FC = () => {
  const ionRouter = useIonRouter();
  // PDF file selected by the user.
  const [file, setFile] = useState<File | null>(null);
  // File name shown in the UI.
  const [fileName, setFileName] = useState("");
  // Quiz questions returned by backend.
  const [questions, setQuestions] = useState<Question[]>([]);
  // User answers keyed by question index.
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  // True after quiz is submitted.
  const [submitted, setSubmitted] = useState(false);
  // Score and per-question results.
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuizResultItem[]>([]);
  // Loading and saving states.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasSavedResult, setHasSavedResult] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setQuestions([]);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setResults([]);
      setSaveMessage("");
      setHasSavedResult(false);
    }
  };

  const generateQuiz = async () => {
    if (!file) {
      alert("Please select a PDF file first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/generate-quiz-from-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to generate quiz from PDF");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setResults([]);
      setSaveMessage("");
      setHasSavedResult(false);
    } catch (error) {
      console.error("Error generating quiz from PDF:", error);
      alert(error instanceof Error ? error.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    if (questions.length === 0) {
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting!");
      return;
    }

    let correctCount = 0;
    const quizResults = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;

      return {
        question: q.question,
        selectedAnswerKey: userAnswer,
        selectedAnswerText: q.options[userAnswer] || "Not answered",
        correctAnswerKey: q.correct_answer,
        correctAnswerText: q.options[q.correct_answer],
        isCorrect,
        wrongAnswer: isCorrect ? undefined : q.options[userAnswer] || "Not answered",
      };
    });

    setScore(correctCount);
    setResults(quizResults);
    setSubmitted(true);
    setSaveMessage("");
    setHasSavedResult(false);
  };

  const saveResultToProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in to save quiz results.");
      ionRouter.push("/login");
      return;
    }

    setSaving(true);
    try {
      const quizResultPayload = {
        topic: fileName || "PDF Quiz",
        level: "PDF",
        score,
        total_questions: questions.length,
        questions: results.map((result) => ({
          question: result.question,
          selected_answer_key: result.selectedAnswerKey,
          selected_answer_text: result.selectedAnswerText,
          correct_answer_key: result.correctAnswerKey,
          correct_answer_text: result.correctAnswerText,
          is_correct: result.isCorrect,
          wrong_answer: result.wrongAnswer ?? null,
        })),
      };

      const response = await fetch("http://127.0.0.1:8000/save-quiz-result-to-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizResultPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to save quiz result");
      }

      setHasSavedResult(true);
      setSaveMessage("Quiz result saved to your profile.");
    } catch (error) {
      console.error("Error saving quiz result:", error);
      setSaveMessage("Could not save quiz result. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetQuiz = () => {
    setFile(null);
    setFileName("");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setResults([]);
    setSaveMessage("");
    setHasSavedResult(false);
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
            routerLink="/quiz"
            routerDirection="back"
          >
            Back
          </IonButton>
          <IonTitle className="ion-text-center">Generate Quiz From PDF</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding light-content">
        {!submitted && (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="pdf-input"
                style={{
                  display: "block",
                  padding: "15px",
                  backgroundColor: "rgba(41, 187, 245, 0.92)",
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
                  e.currentTarget.style.backgroundColor = "rgba(41, 187, 245, 0.92)";
                }}
              >
                {fileName ? (
                  <IonText>
                    <p>
                      <strong>Selected:</strong> {fileName}
                    </p>
                  </IonText>
                ) : (
                  <IonText>
                    <p style={{ color: "#000000", fontWeight: "500" }}>
                      Click to select a PDF file
                    </p>
                  </IonText>
                )}
              </label>
              <input
                id="pdf-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <IonButton
              className="light-primary-button"
              expand="block"
              onClick={generateQuiz}
              disabled={loading || !file}
            >
              {loading ? "Generating..." : "Generate Quiz"}
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
                  Generating your quiz...
                </p>
              </div>
            )}

            {questions.length > 0 && !loading && (
              <>
                <IonList>
                  {questions.map((q, i) => (
                    <IonItem key={i}>
                      <IonLabel>
                        <h2>
                          {i + 1}. {q.question}
                        </h2>
                        <IonRadioGroup
                          value={answers[i]}
                          onIonChange={(e) => setAnswers({ ...answers, [i]: e.detail.value })}
                        >
                          {Object.entries(q.options).map(([key, opt]) => (
                            <IonItem key={key}>
                              <IonRadio value={key} />
                              <IonLabel>{opt}</IonLabel>
                            </IonItem>
                          ))}
                        </IonRadioGroup>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
                <IonButton className="light-primary-button" expand="block" onClick={submitQuiz}>
                  Submit Quiz
                </IonButton>
              </>
            )}
          </>
        )}

        {submitted && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h1>Quiz Results</h1>
              <h2 style={{ color: score / questions.length >= 0.7 ? "green" : "red" }}>
                Score: {score} / {questions.length}
              </h2>
              <p>{((score / questions.length) * 100).toFixed(1)}%</p>
            </div>

            <IonList>
              {questions.map((q, i) => (
                <IonItem
                  key={i}
                  style={{
                    borderLeft: `5px solid ${results[i].isCorrect ? "green" : "red"}`,
                    paddingLeft: "10px",
                  }}
                >
                  <IonLabel>
                    <h2>
                      {i + 1}. {q.question}
                    </h2>
                    <p>
                      <strong>Your answer:</strong> {results[i].selectedAnswerText}
                    </p>
                    {!results[i].isCorrect && (
                      <p style={{ color: "green" }}>
                        <strong>Correct answer:</strong> {results[i].correctAnswerText}
                      </p>
                    )}
                    <p
                      style={{
                        marginTop: "10px",
                        fontWeight: "bold",
                        color: results[i].isCorrect ? "green" : "red",
                      }}
                    >
                      {results[i].isCorrect ? "Correct" : "Incorrect"}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>

            <IonButton className="light-primary-button" expand="block" onClick={resetQuiz}>
              Take Another Quiz
            </IonButton>

            <IonButton
              className="light-primary-button"
              expand="block"
              onClick={saveResultToProfile}
              disabled={saving || hasSavedResult}
            >
              {saving ? "Saving..." : hasSavedResult ? "Saved to Profile" : "Save Result to Profile"}
            </IonButton>

            {saveMessage && (
              <p style={{ textAlign: "center", marginTop: "12px", fontWeight: 500 }}>
                {saveMessage}
              </p>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default QuizFromImage;
