## APP DESCRIPTION - "Card Game App"
A project for a two-player online card game.

# RULES 
- The game starts with a card shuffle, then each player receives 5 cards, with the 11th card from the deck placed on the game table;
- Each player must alternately place a card on the table that has the same value or the same suit as the last played card;
- If a 2 is played, the next player in the sequence must pick up 2 cards unless they have a 2, in which case they will add this to the original 2 and the next player in the sequence must pick up 4 cards and so on; the same goes with 3;
- If a 4 or Ace is played, the next player in the sequence must miss a go, unless they have a 4 or an Ace (if Ace was played), in which case they will add this to the original 4 or Ace (if Ace was played) and the next player in the sequence misses 2 goes.
- The game ends when one player has played all his cards.

# SETTING UP THE ENVIRONMENT
To install and run the project, you must have the following:
- Visual Studio Code;
- Node.js (Preferably v18.16.0);  
- Bitbucket account;
- A browser and access to the internet;
- For testing, make sure you have jest installed (if not, use `npm install --save jest @testing-library/react @testing-library/jest-dom`).


## HOW TO INSTALL AND RUN THE PROJECT
- To install the project, open a terminal, navigate to the path you want it to be, and type the command:
### `git clone https://CostinRaduIonut@bitbucket.org/radup-ensemble/tech-test-ionut-costin.git`

- To run the project, you must open a new terminal, navigate to the project's directory, and run the following:
### `npm i`
### `npm start`
The app will run in development mode. Open `http://localhost:3000` to view it in your browser.

# TESTING
- The project contains 1 unit test, "GetDeck.test.js," that tests whether the deck is received.
- To launch the test runner in interactive watch mode, use the command:
### `npm test`

FAVE FUN!