# Monster Battle API & Frontend 👾

This project implements a RESTful API and a real-time frontend application for turn-based monster battles, developed as a case study for a Software Engineering position. Players can register, get assigned a monster, and battle against another player in a simple arena setting with real-time updates using WebSockets.

## Features

* **Player Management:** Register new players. (Deletion endpoint exists but might not be implemented in frontend).
* **Monster Management:** Backend support for creating and listing monsters with distinct stats (HP, Attack, Defense, Speed, Special Ability).
* **Random Monster Assignment:** Players are automatically assigned a random monster upon joining.
* **Real-time Battles:** Turn-based combat using WebSockets (Socket.IO) for instant updates on actions, HP changes, turn progression, and game end state.
* **Battle Actions:** Players can choose to Attack, Defend (reduces incoming damage), use a unique Special ability (with cooldown), or Forfeit.
* **Turn Logic:** Turn resolution considers both players' actions, with attack priority potentially influenced by monster speed.
* **Simple Arena:** A single implicit battle arena accommodating two players.
* **Basic Frontend:** React interface to register players and participate in the real-time battle, displaying monster stats and action buttons.

## Tech Stack

* **Backend:**
    * Node.js
    * Express.js
    * PostgreSQL (Database)
    * Prisma (ORM)
    * Socket.IO (WebSockets)
* **Frontend:**
    * React
    * Socket.IO Client
    * React Router DOM
    * React Hook Form / Yup (for player registration form)
    * Axios (for API communication from frontend)
    * Tailwind CSS (likely, based on `className` usage)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

* [Node.js](https://nodejs.org/) (v18.x or later recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [PostgreSQL](https://www.postgresql.org/download/) Server (Make sure it's running)
* [Git](https://git-scm.com/)

## Installation & Setup

Follow these steps to get the project running locally:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Lucas-I-Marciano/MonsterBattle-API
    ```

2.  **Database Setup:**
    * Connect to your PostgreSQL instance (using `psql`, pgAdmin, or another tool).
    * Create a new database for this project (e.g., `monster_battle_db`).
    * Navigate to the backend directory (assuming it's named `backend`):
        ```bash
        cd backend
        ```
    * Create a `.env` file in the `backend` directory by copying the example (if one exists) or creating it manually. Add your database connection URL:
        ```dotenv
        # .env (in backend/)
        DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/monster_battle_db?schema=public"
        ```
        *(Replace `YOUR_DB_USER`, `YOUR_DB_PASSWORD`, and adjust host/port/db name if necessary)*
    * Install backend dependencies:
        ```bash
        npm install
        # or
        # yarn install
        ```
    * Apply database migrations using Prisma:
        ```bash
        npx prisma migrate dev --name init
        ```
        *(This will create the necessary tables based on your `schema.prisma` file)*
    * (Optional) If you have a seed script defined in `package.json` or `prisma/seed.js`, run it:
        ```bash
        npx prisma db seed
        ```
        *(This might populate the `Monster` table with initial data)*

3.  **Frontend Setup:**
    * Navigate to the frontend directory (assuming it's named `frontend`):
        ```bash
        # From the root project directory:
        cd ../frontend
        # Or if you are in backend/: cd ../frontend
        ```
    * Install frontend dependencies:
        ```bash
        npm install
        # or
        # yarn install
        ```
    * (Optional) Create a `.env` file in the `frontend` directory if you need to configure environment variables (e.g., the backend API/Socket URL, although it might be hardcoded currently).

## Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminals.

1.  **Start the Backend Server:**
    * Navigate to the `backend` directory:
        ```bash
        cd path/to/your/project/backend
        ```
    * Run the development server (check your `package.json` for the exact command, `dev` is common):
        ```bash
        npm run dev
        # or
        # npm start
        ```
    * The backend server should start, typically on `http://localhost:3000`. Look for a log message confirming this.

2.  **Start the Frontend Development Server:**
    * Open a **new terminal window**.
    * Navigate to the `frontend` directory:
        ```bash
        cd path/to/your/project/frontend
        ```
    * Run the development server (check your `package.json`, `dev` is common for Vite/CRA):
        ```bash
        npm run dev
        # or
        # npm start
        ```
    * The frontend server should start, typically on `http://localhost:5173` (or another port like 3000/3001 depending on your setup).

3.  **Access the Application:**
    * Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

## How to Play

1.  **Register:** Open the application in your browser. Enter a unique player name and click "Entrar na Batalha".
2.  **Monster Assignment:** You will be automatically assigned a random monster available in the database.
3.  **Wait for Opponent:** The application will wait until a second player registers and joins the battle.
4.  **Battle Starts:** Once two players are ready, the battle screen will load, showing your monster and your opponent's monster.
5.  **Take Turns:** When it's your turn (indicated on screen), choose an action:
    * **Attack:** Deals damage based on your Attack and the opponent's Defense.
    * **Defend:** Reduces damage taken from the opponent's next attack.
    * **Special:** Uses your monster's unique ability (if the cooldown is ready).
    * **Forfeit:** Immediately lose the battle.
6.  **Win Condition:** The battle ends when one player's monster HP reaches 0.
7.  **Play Again:** After the battle ends, click "Jogar Novamente" to return to the home screen and start a new game.

## API Endpoints (Overview)

The backend provides RESTful endpoints (primarily for player/monster management) and relies on WebSockets for real-time battle interaction.

* `POST /players`: Register a new player.
* `DELETE /players/:id`: Delete a player (requires ID).
* `POST /monsters`: Add a new monster type (requires stats).
* `GET /monsters`: List available monsters.
* `POST /arenas`: (Defined in spec, likely simplified/unused in current implementation).
* `POST /arenas/:id/join`: (Defined in spec, logic now handled via WebSocket `userJoinRoom`).
* `POST /arenas/:id/leave`: (Defined in spec, likely simplified/unused).

*(Battle actions like attack, defend, etc., are handled via WebSocket events, not REST endpoints).*

## WebSocket Events (Overview)

Real-time communication uses the following key events:

**Client -> Server:**

* `userJoinRoom { playerId: number }`: Sent when a player registers and wants to join the battle queue/arena.
* `userAction { action: string }`: Sent when a player chooses an action (attack, defend, special, forfeit) during their turn.

**Server -> Client:**

* `connect`: Standard Socket.IO event when connection is established.
* `disconnect`: Standard Socket.IO event when connection is lost.
* `status_update { message: string }`: General status messages (e.g., waiting for player).
* `join_error { message: string }`: If there's an error processing the join request.
* `room_full_error { message: string }`: If a player tries to join when the battle is full/active.
* `battle_start { message: string, yourPlayerId: string, initialState: object }`: Sent to both players when the battle begins, includes the full initial `battleState`.
* `battle_update { battleState: object }`: Sent after each turn or significant state change, includes the updated `battleState`.
* `battle_end { finalResult: object }`: Sent when the battle finishes, includes winner info and final state/log.
* `action_error { message: string }`: If a player attempts an invalid action (e.g., special on cooldown).
* `battle_abort { message: string, finalState: object }`: If the battle ends unexpectedly (e.g., double disconnect).

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.
