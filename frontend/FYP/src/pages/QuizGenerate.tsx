import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonList,
  IonItem,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonSpinner,
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

const QuizGenerate: React.FC = () => {
  const ionRouter = useIonRouter();
  // Topic and level chosen by user.
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  // Quiz questions from backend.
  const [questions, setQuestions] = useState<Question[]>([]);
  // User answers keyed by question index.
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  // True after quiz is submitted.
  const [submitted, setSubmitted] = useState(false);
  // Final score and per-question results.
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuizResultItem[]>([]);
  // Loading state while quiz is being generated.
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [hasSavedResult, setHasSavedResult] = useState(false);

  const generateQuiz = async () => {
    // Ask backend to create quiz questions.
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
      setResults([]);
      setSaveMessage("");
      setHasSavedResult(false);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    // Make sure all questions are answered.
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting!");
      return;
    }

    // Check each answer and build result list.
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
        topic,
        level,
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
    // Reset page to start a new quiz.
    setTopic("");
    setLevel("");
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
          <IonTitle className="ion-text-center">Generate Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding light-content">
        {!submitted && (
          <>
            <IonInput
              className="light-item"
              placeholder="Enter Quiz Topic"
              value={topic}
              onIonChange={(e) => setTopic(e.detail.value!)}
            />
            <IonSelect
              className="light-item"
              placeholder="Select education level"
              value={level}
              onIonChange={(e) => setLevel(e.detail.value!)}
            >
              <IonSelectOption value="Primary School">Primary School</IonSelectOption>
              <IonSelectOption value="Secondary School">Secondary School</IonSelectOption>
              <IonSelectOption value="University">University</IonSelectOption>
            </IonSelect>

            <IonButton
              className="light-primary-button"
              expand="block"
              onClick={generateQuiz}
              disabled={loading}
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
                          onIonChange={(e) =>
                            setAnswers({ ...answers, [i]: e.detail.value })
                          }
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
                <IonButton
                  className="light-primary-button"
                  expand="block"
                  onClick={submitQuiz}
                >
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
              <h2
                style={{ color: score / questions.length >= 0.7 ? "green" : "red" }}
              >
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

export default QuizGenerate;
