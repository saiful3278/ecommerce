import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { GRAPHQL_URL } from "./constants/config";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors && graphQLErrors.length > 0) {
    for (const e of graphQLErrors) {
      const msg = (e as any)?.message ?? "Unknown GraphQL error";
      const path = (e as any)?.path ? ` at ${(e as any).path.join(".")}` : "";
      console.error(`GraphQL Error: ${msg}${path}`);
    }
  }
  if (networkError) {
    const msg = (networkError as any)?.message ?? "Unknown network error";
    console.error(`Network Error: ${msg}`);
  }
});
console.log("GRAPHQL_URL: ", GRAPHQL_URL);
export const initializeApollo = (initialState = null) => {
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
    credentials: "include",
  });

  // Create or reuse Apollo Client instance
  const client = new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Product: {
          fields: {
            variants: {
              merge: true,
            },
          },
        },
      },
    }).restore(initialState || {}),
  });

  return client;
};

export default initializeApollo(); // Default export for client-side usage
