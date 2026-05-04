# PlayTrace Backend

This is the Node.js + Express backend for PlayTrace, designed to store session and decision data in MongoDB.

## Tech Stack
- Node.js
- Express
- MongoDB (via Mongoose)

## Prerequisites
- Node.js installed
- MongoDB running locally (default: `mongodb://localhost:27017`) or a remote MongoDB cluster.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

## Running the Server

- For development (with auto-reload):
  ```bash
  npm run dev
  ```

- For production:
  ```bash
  npm start
  ```

## Frontend Integration

The backend runs on `http://localhost:3001` by default. 

To connect the PlayTrace frontend:
1. When starting a game, make a `POST /api/sessions` call with `profileType` and `character`. Save the returned `sessionId`.
2. For each decision, make a `POST /api/sessions/:sessionId/decisions` call.
3. When the game ends, make a `PATCH /api/sessions/:sessionId` call with the final metrics and state.
