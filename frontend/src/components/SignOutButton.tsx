import { useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useAppContext } from "../contexts/AppContext";

const SignOutButton = () => {
  const queryClient = useQueryClient();
  /// we will get our toastShow from AppContext
  const { showToast } = useAppContext();

  // we are using useMutation because we want to make an API call to the backend
  // whenever we click on the sign out button, this mutation will run and call the signout api. it will give or set the auth token to be empty and the queryClient will force the "validateToken" to run again. the "validateToken" is the key for the "apiClient.validateToken" endpoint
  const mutation = useMutation(apiClient.signOut, {
    onSuccess: async () => {
      // this "validateToken" key/property is set in the app Context to use to check whether user is logged in or logged out
      await queryClient.invalidateQueries("validateToken");
      // showToast
      showToast({ message: "Signed Out!", type: "SUCCESS" });
    },
    onError: (error: Error) => {
      // show toast
      showToast({ message: error.message, type: "ERROR" });
    }
  });

  const handleClick = () => {
    mutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 px-3 font-bold bg-white hover:bg-gray-100"
    >
      Sign Out
    </button>
  );
};

export default SignOutButton;
