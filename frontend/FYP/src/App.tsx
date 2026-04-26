import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect } from 'react';
import Home from './pages/Home';
import Login from "./pages/Login";
import Signup from "./pages/Signup"
import ChatBot from "./pages/ChatBot"
import ForgotPass from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword'
import Quiz from './pages/Quiz'
import QuizGenerate from './pages/QuizGenerate'
import QuizFromImage from './pages/QuizFromImage'
import Profile from './pages/Profile'
import SavedTexts from './pages/SavedTexts'
import QuizResults from './pages/QuizResults'
import FriendsPage from './pages/FriendsPage'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    localStorage.setItem('darkMode', 'false');
    localStorage.setItem('themePreference', 'light');
    document.body.classList.remove('dark-mode');
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>

          <Route exact path="/chatbot">
            <ChatBot />
          </Route>

          <Route exact path="/login">
            <Login />
          </Route>

          <Route exact path="/forgotpass">
            <ForgotPass />
          </Route>

          <Route exact path="/resetpass">
            <ResetPassword />
          </Route>

          <Route exact path="/signup">
            <Signup />
          </Route>

          <Route exact path="/quiz">
            <Quiz />
          </Route>

          <Route exact path="/quiz/generate">
            <QuizGenerate />
          </Route>

          <Route exact path="/quiz/image">
            <QuizFromImage />
          </Route>

          <Route exact path="/profile">
            <Profile />
          </Route>

          <Route exact path="/saved-texts">
            <SavedTexts />
          </Route>

          <Route exact path="/quiz-results">
            <QuizResults />
          </Route>

          <Route exact path="/friends">
            <FriendsPage />
          </Route>

          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
