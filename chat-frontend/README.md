# Chat Application Frontend

This is the frontend for the Chat Application, built with React, TypeScript, and Socket.IO client for real-time communication.

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- The backend server should be running (see instructions below)

## Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Create a `.env` file in the root directory with the following content (adjust URLs as needed):

```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=http://localhost:3000/chat
```

## Running the Application

1. Make sure the backend server is running first (chat-api directory):

```bash
cd ../chat-api
npm run start
```

2. Start the frontend development server:

```bash
npm start
# or
yarn start
```

This will open the application in your browser at [http://localhost:3000](http://localhost:3000).

## Features

- User authentication (login/register)
- Create and join chat rooms
- Real-time messaging
- View room members
- Responsive design

## Usage

1. Register a new account or login with existing credentials
2. Create a new room or select an existing one
3. Start chatting in real-time with other users

## Built With

- React
- TypeScript
- Socket.IO client
- Axios for API calls
- TailwindCSS for styling
