import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  split,
  ApolloLink,
  Observable,
  HttpLink
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { onError } from '@apollo/client/link/error';
import dayjs from 'dayjs';
import WeekOfYear from 'dayjs/plugin/weekOfYear';

import fr from 'dayjs/locale/fr';
import App from './App';
import * as serviceWorker from './serviceWorker';

import './styles/index.css';

dayjs.locale(fr);
dayjs.extend(WeekOfYear);

const { REACT_APP_BACKOFFICE_URL, REACT_APP_API_HTTP_URL, REACT_APP_API_WS_URL } = process.env;

const httpLink = new HttpLink({
  uri: `${REACT_APP_API_HTTP_URL}/graphql`
});

const wsLink = new WebSocketLink({
  uri: `${REACT_APP_API_WS_URL}/graphql`,
  options: {
    reconnect: true
  }
});

const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink
);

const request = async operation => {
  const token = localStorage.getItem('token');
  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : ''
    }
  });
};

const requestLink = new ApolloLink(
  (operation, forward) =>
    new Observable(observer => {
      let handle;
      Promise.resolve(operation)
        .then(oper => request(oper))
        .then(() => {
          handle = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer)
          });
        })
        .catch(observer.error.bind(observer));

      return () => {
        if (handle) handle.unsubscribe();
      };
    })
);

const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) => {
          if (
            [
              'Context creation failed: Your session expired. Sign in again.',
              'Not authenticated as user.',
              'Your session expired. Sign in again.'
            ].includes(message)
          ) {
            localStorage.clear();
            window.location.replace(`${REACT_APP_BACKOFFICE_URL}/signin`);
          } else {
            console.log(`
            Message: ${message}
            Locations: ${JSON.stringify(locations, null, 2)}
            path: ${path}
            `);
          }
          return { message };
        });
      }
      if (networkError) {
        console.log(`[Network Error] ${networkError}`);
      }
    }),
    requestLink,
    link
  ]),
  cache: new InMemoryCache()
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
