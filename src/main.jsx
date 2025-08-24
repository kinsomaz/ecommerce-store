import ReactDOM from "react-dom/client";
import App from './App.jsx'
import WebFont from 'webfontloader'
import configureStore from '@/redux/store/store'
import 'react-phone-input-2/lib/style.css';
import Preloader from './component/commo/Preloader.jsx';
import '@/styles/style.scss';
import { onAuthStateChanged } from 'firebase/auth';
import { onAuthStateFail, onAuthStateSuccess } from "./redux/actions/authActions.js";

WebFont.load({
  google: {
    families: ['Tajawal']
  }
});

const { store, persistor } = configureStore();
const rootElement = document.getElementById("app")
const root = ReactDOM.createRoot(rootElement);

// Render the preloader on initial load
root.render(<Preloader />);

// wait for Firebase to resolve auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    store.dispatch(onAuthStateSuccess(user));
  } else {
    store.dispatch(onAuthStateFail("Failed to authenticate"));
  }

  // render the app after checking auth state
  root.render(<App store={store} persistor={persistor} />);
});

// ✅ Service Worker registration
if (import.meta.env.MODE === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
