
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShepherd } from 'react-shepherd';
import 'shepherd.js/dist/css/shepherd.css';

const AppTour = () => {
  const tour = useShepherd();
  const navigate = useNavigate();

  useEffect(() => {
    if (!tour.isActive()) {
      tour.addSteps([
        {
          id: 'welcome',
          text: 'Welcome to our platform! Let us show you around.',
          attachTo: {
            element: 'body',
            on: 'center'
          },
          classes: 'shepherd-theme-custom',
          buttons: [
            {
              text: 'Skip',
              action: tour.cancel
            },
            {
              text: 'Start Tour',
              action: tour.next
            }
          ]
        },
        {
          id: 'events',
          text: 'Create and join events with your friends.',
          attachTo: {
            element: '.events-section',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Back',
              action: tour.back
            },
            {
              text: 'Next',
              action: tour.next
            }
          ]
        },
        {
          id: 'challenges',
          text: 'Challenge your friends and compete in various activities.',
          attachTo: {
            element: '.challenges-section',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Back',
              action: tour.back
            },
            {
              text: 'Next',
              action: tour.next
            }
          ]
        },
        {
          id: 'wallet',
          text: 'Manage your wallet, make deposits and withdrawals.',
          attachTo: {
            element: '.wallet-section',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Back',
              action: tour.back
            },
            {
              text: 'Next',
              action: tour.next
            }
          ]
        },
        {
          id: 'chat',
          text: 'Chat with friends and discuss events.',
          attachTo: {
            element: '.chat-section',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Back',
              action: tour.back
            },
            {
              text: 'Finish',
              action: tour.complete
            }
          ]
        }
      ]);

      tour.start();
    }
  }, [tour]);

  return null;
};

export default AppTour;
