# Profile Card Pop-up

The Profile Card pop-up is a component that displays detailed information about a user when hovering over or clicking on their avatar or username. It's used throughout the application to provide quick access to user information without navigating to their full profile page.

## Visual Representation

```
┌─────────────────────────────────────────────┐
│                                         [X] │
│                                             │
│                 ┌─────┐                     │
│                 │     │                     │
│                 │  🧑  │                     │
│                 │     │                     │
│                 └─────┘                     │
│                                             │
│                 User Name                   │
│                 @username                   │
│                                             │
│         [⭐ 1000 Points]  [Level 5]         │
│                                             │
│           This is the user's bio            │
│                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│ │             │ │             │ │          ││
│ │   🏆 10     │ │   👥 250    │ │  📈 $500 ││
│ │ Events Won  │ │  Followers  │ │ Earnings ││
│ │             │ │             │ │          ││
│ └─────────────┘ └─────────────┘ └──────────┘│
│                                             │
│             [      Follow      ]            │
│                                             │
└─────────────────────────────────────────────┘
```

## Key Features

1. **User Identity**
   - Profile picture/avatar
   - User's name
   - Username
   - Level badge based on points

2. **User Stats**
   - Points display
   - Events won
   - Followers count
   - Total earnings

3. **Social Interaction**
   - Follow/Unfollow button
   - Loading states for follow actions

4. **Visual Design**
   - Dark theme background (#242538)
   - Rounded corners
   - Centered layout
   - Responsive width (max-w-md)

## Usage

The ProfileCard component is used in several places:

1. **Chat Messages**: When hovering over a sender's avatar
2. **Event Participants**: When viewing participants in an event
3. **User Mentions**: When hovering over @username mentions
4. **Search Results**: When viewing user search results

## Implementation Details

The ProfileCard component:
- Loads user data if not provided initially
- Handles follow/unfollow actions
- Updates follower counts in real-time
- Shows loading states during data fetching
- Provides a close button for dismissing the card
