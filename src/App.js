import React from 'react';
import { renderRoutes } from 'react-router-config';
import routes from './router';


const App = () => {
  return (
    <main className="main" key="main">
      {renderRoutes(routes)}
    </main>
  );
};

export default App;
