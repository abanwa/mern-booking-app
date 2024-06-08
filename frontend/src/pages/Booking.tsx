import { useQuery } from "react-query";
import * as apiClient from "./../api-client";
import BookingForm from "../forms/BookingForm/BookingForm";
import { useSearchContext } from "../contexts/SearchContext";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BookingDetailSummary from "../components/BookingDetailSummary";
import { Elements } from "@stripe/react-stripe-js";
import { useAppContext } from "../contexts/AppContext";

const Booking = () => {
  const { stripePromise } = useAppContext();
  // we will get the searched stiuffs out of the search context
  const search = useSearchContext();

  // we will get the hotel id that we want to book base on the url hotel/5663525242hd5rs4s/booking
  // from the router in our App.tsx itnis /hotel/:hotelId/booking .that is why we used hotelId to destructure it
  const { hotelId } = useParams();

  //   we will calculate the number of nights base on the checkIn and checkOut date
  const [numberOfNights, setNumberOfNights] = useState<number>(0);

  useEffect(() => {
    if (search.checkIn && search.checkOut) {
      // this will calculate for the number of nights the user will spend
      const nights =
        Math.abs(search.checkOut.getTime() - search.checkIn.getTime()) /
        (1000 * 60 * 60 * 24);

      setNumberOfNights(Math.ceil(nights));
    }
  }, [search.checkIn, search.checkOut]);

  // THIS IS THE FUNCTION TO MAKE THE STRIPE PAYMENT INTENT FOR TRHE BOOKING WHEN WE CLICK THE BOOK NOW BUTTON
  // this will run when the component loads
  const { data: paymentIntentData } = useQuery(
    "createPaymentIntent",
    () =>
      apiClient.createPaymentIntent(
        hotelId as string,
        numberOfNights.toString()
      ),
    {
      enabled: !!hotelId && numberOfNights > 0
    }
  );

  // console.log("paymentIntentData ", paymentIntentData);

  // we will fetch that particular hotel base on the hotelId
  // this API will run only whne hotelId is a truety value
  // this will run when the component loads
  const { data: hotel } = useQuery(
    "fetchHotelByID",
    () => apiClient.fetchHotelById(hotelId as string),
    {
      enabled: !!hotelId
    }
  );

  // we will use react query to call our endpoint
  // this will run when the component loads
  const { data: currentUser } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser
  );

  //   console.log(currentUser?.email);

  //   if (!currentUser) {
  //     return <></>;
  //   }

  if (!hotel) {
    return <></>;
  }

  return (
    <div className="grid md:grid-cols-[1fr_2fr]">
      <BookingDetailSummary
        checkIn={search.checkIn}
        checkOut={search.checkOut}
        adultCount={search.adultCount}
        childCount={search.childCount}
        numberOfNights={numberOfNights}
        hotel={hotel}
      />
      {currentUser && paymentIntentData && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: paymentIntentData.clientSecret
          }}
        >
          <BookingForm
            currentUser={currentUser}
            paymentIntent={paymentIntentData}
          />
        </Elements>
      )}
    </div>
  );
};

export default Booking;
