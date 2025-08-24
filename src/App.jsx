import { StrictMode } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { Preloader } from "./component/commo"
import PropTypes from "prop-types"

const App = ({ store, persistor }) => {
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<Preloader />} persistor={persistor}>
        <AppRouter />
      </PersistGate>
    </Provider>
  </StrictMode>
};

App.prototype = {
  store: PropTypes.any.isRequired,
  persistor: PropTypes.any.isRequired,
};

export default App;