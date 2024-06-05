import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import * as apiClient from "../api-client";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import { useAppContext } from "../contexts/AppContext";

const EditHotel = () => {
  // first thing we want to do is to get the hotel id from the url. whenever we go to this page, we parse the hotel id to the URL
  // this hotelId is our parameter when we fetch the fetchMyHotelById api function
  const { hotelId } = useParams();

  const { showToast } = useAppContext();

  // the last option we added {enabled: !!hotelId} means that this query is only going to run if we have a hotelId. the double exclamation mark (!!) means that it should check for a truety value. if hotelId has value, it will return true but if the hotel value is null or undefined, then it will return false
  const { data: hotel } = useQuery(
    "fetchMyHotelById",
    () => apiClient.fetchMyHotelById(hotelId || ""),
    {
      enabled: !!hotelId
    }
  );

  //   console.log("fetch hotel ", hotel);

  //   Here, we will use our useMutation hook to call our request
  const { mutate, isLoading } = useMutation(apiClient.updateMyHotelById, {
    onSuccess: () => {
      showToast({ message: "Hotel Saved!", type: "SUCCESS" });
    },
    onError: () => {
      showToast({ message: "Error Saving Hotel", type: "ERROR" });
    }
  });

  const handleSave = (hotelFormData: FormData) => {
    mutate(hotelFormData);
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;
