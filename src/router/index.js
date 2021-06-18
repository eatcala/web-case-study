import { renderRoutes } from 'react-router-config';

import Homepage from '../views/Homepage';

const Root = ({ route }) => renderRoutes(route.routes);

const routes = [
  {
    component: Root,
    routes: [
      {
        path: '/',
        exact: true,
        component: Homepage
      }
    ]
  }
];

export default routes;
