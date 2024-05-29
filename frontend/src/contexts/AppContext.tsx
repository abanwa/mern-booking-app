import React, { useContext, useState } from "react";
import Toast from "../components/Toast";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";

type ToastMessage = {
  message: string;
  type: "SUCCESS" | "ERROR";
};
// the first thing is to define the type. this will hold lal the properties we are going ro expose to our App. All the things that components can access
type AppContext = {
  showToast: (ToastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
};

// we will default it to undefine. whenever the app loads for the first time, the context will always be undefined
// this is our context
const AppContext = React.createContext<AppContext | undefined>(undefined);

// This is our provider. Provider is what wraps our components and give our components access to all the things in the context
// we will export this to our main.tsx and the use it to wrap our App component
export const AppContextProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  // we want to declare state object which holds the state of the toast
  const [toast, setToast] = useState<ToastMessage | undefined>(undefined);

  //this will call the validateToken enpoint in our aoiClient and it will return 200 0r 401. if it's 401, that means user is not logged in
  // This RUNS When an ACTION causes the APP to RERENDER OR RENDER. example whenever we refresh the page or change the route
  // we will invalidate this query ("validateToken") when we logout
  const { isError } = useQuery("validateToken", apiClient.validateToken, {
    retry: false
  });

  return (
    // the showToast is a function that accepts an object as an argument
    // the setToast to undefined will close the toast;
    // if error is false, user is logged in else if error is true, user is not logged in
    <AppContext.Provider
      value={{
        showToast: (toastMessage) => {
          //   console.log("appContext toastMessage", toastMessage);
          setToast(toastMessage);
        },
        isLoggedIn: !isError
      }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(undefined)}
        />
      )}
      {children}
    </AppContext.Provider>
  );
};

// we will create a hook that lets our components easily access our context provider
export const useAppContext = () => {
  const context = useContext(AppContext);
  return context as AppContext;
};
