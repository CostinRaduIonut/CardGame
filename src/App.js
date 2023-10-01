import { useEffect, useState } from 'react'
import './App.css'
import { GameStatus, GameWinner, PlayerTurn, cardsMatch, isSkipcard, isWildcard } from './Utils'

function App() {

  const [playerOneCards, setPlayerOneCards] = useState([]);
  const [playerTwoCards, setPlayerTwoCards] = useState([]);

  const [playerOneError, setPlayerOneError] = useState('');
  const [playerTwoError, setPlayerTwoError] = useState('');

  const [turn, setTurn] = useState(PlayerTurn.PlayerOne);

  const [gameStatus, setGameStatus] = useState(GameStatus.NotStarted);
  const [gameWinner, setGameWinner] = useState(null);

  const [discardPile, setDiscardPile] = useState([]);

  const [whoPlayedLastWildCard, setWhoPlayedLastWildCard] = useState(null);

  const [deckID, setDeckID] = useState(null);
  const [remainingCards, setRemainingCards] = useState();

  const [loadingDrawing, setLoadingDrawing] = useState(false);

  const [statusBar, setStatusBar] = useState('Pending...');

  const [goesAgain, setGoesAgain] = useState(0);
  // Get the deck
  useEffect(() => {
    async function fetchAPI() {
      const deckOfCardsAPI = "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1";
      setLoadingDrawing(true);
      const fetchAPI = await fetch(deckOfCardsAPI);


      if (!fetchAPI) {
        window.alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      const data = await fetchAPI.json();
      const success = data["success"];
      if (!success) {
        window.alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      setDeckID(data["deck_id"]);
      setRemainingCards(data["remaining"]);
      setLoadingDrawing(false);
    }

    fetchAPI();
  }, []);

  useEffect(() => {
    // console.log(`playerOneCards.length: ${playerOneCards.length}`);
    // console.log(`gameStatus: ${gameStatus}`);
    if (playerOneCards.length === 0 && gameStatus === GameStatus.InProgress) {
      playerWinEx(1);
    }
  }, [playerOneCards, gameStatus]);

  useEffect(() => {
    // console.log(`playerTwoCards.length: ${playerTwoCards.length}`);
    // console.log(`gameStatus: ${gameStatus}`);
    if (playerTwoCards.length === 0 && gameStatus === GameStatus.InProgress) {
      playerWinEx(2);
    }
  }, [playerTwoCards, gameStatus]);

  const setError = (player, error) => {
    if (player === 1) setPlayerOneError(error);
    else setPlayerTwoError(error);
  }
  // See who won and clean 
  const playerWinEx = (player) => {
    setGameStatus(GameStatus.Finished);
    if (player === 1) {
      setStatusBar('Player ONE wins');
      setGameWinner(GameWinner.PlayerOne);
    }
    else {
      setStatusBar('Player TWO wins');
      setGameWinner(GameWinner.PlayerTwo);
    }
    setPlayerOneCards([]);
    setPlayerTwoCards([]);
    setDiscardPile([]);
  }

  const discardPlayerCardEx = (player, index) => {
    if (player === 1) {
      const card = playerOneCards[index];
      const newPlayerOneCards = playerOneCards.filter((_card, i) => i !== index);
      setPlayerOneCards(newPlayerOneCards);
      setDiscardPile(discardPile => [...discardPile, card]);
    } else {
      const card = playerTwoCards[index];
      const newPlayerTwoCards = playerTwoCards.filter((_card, i) => i !== index);
      setPlayerTwoCards(newPlayerTwoCards);
      setDiscardPile(discardPile => [...discardPile, card]);
    }
  }
  // Logic for played cards
  const handlePlayCard = (player, index) => {
    if (gameStatus !== GameStatus.InProgress) {
      setError(player, 'No game in progress');
      return;
    }

    // Can't play if it's not your turn
    if (player !== turn) {
      setError(player, 'Not your turn');
      return;

    }

    const card = player === 1 ? playerOneCards[index] : playerTwoCards[index];

    if (discardPile.length > 0) {
      const topCard = discardPile[discardPile.length - 1];

      // If top card is a wild card and player has played the last wild card, then check if top and played cards match value or suit
      if (isWildcard(topCard)) {
        if (whoPlayedLastWildCard === player) {
          // console.log(`Player ${player} played the last wild card`);
          // Card is playable if value or suit matches
          if (!cardsMatch(card, topCard)) {
            return setError(player, `You must play a ${topCard["value"]}-ranked or a ${topCard["suit"]}-suited card if you have any`);
          }
          setWhoPlayedLastWildCard(null);
        }
        else {
          if (whoPlayedLastWildCard === null) {
            // Card is playable if value or suit matches
            if (!cardsMatch(card, topCard)) {
              return setError(player, `You must play a ${topCard["value"]}-ranked or a ${topCard["suit"]}-suited card if you have any`);
            }
          }
          // Card is unplayable if top card is a Two or Three and ranks don't match
          else if (isWildcard(topCard) && !cardsMatch(card, topCard, { rank: true })) {
            return setError(player, `You must play a ${topCard["value"]}-ranked card if you have any`);
          }
        }
      }

      // Card is playable if value or suit matches
      if (!cardsMatch(card, topCard)) {
        return setError(player, `You must play a ${topCard["value"]}-ranked or a ${topCard["suit"]}-suited card if you have any`);
      }
    }

    // Handle remove card
    discardPlayerCardEx(player, index);


    // Handle wild card
    if (isWildcard(card)) {
      setWhoPlayedLastWildCard(player);
      // console.log(`Player ${player} played Wild Card: ${card["value"]}`);
    }

    // if the played card is a Four/Ace, they get to go again
    let goesAgainCount = goesAgain;
    if (isSkipcard(card)) {
      goesAgainCount = goesAgainCount <= 0 ? 1 : goesAgainCount + 1;

      if (card["value"] === "ACE") {
        // if the other player has an Ace or a Four in hand, automatically play it for them
        if (player === 1) {
          const index = playerTwoCards.findIndex(card => card["value"] === "ACE" || card["value"] === "4");
          if (index !== -1) {
            setLoadingDrawing(true);
            setTimeout(() => {
              // remove the card from player 2's hand and add it to the discard pile
              discardPlayerCardEx(2, index);

              // it's player 2's turn now, and they go twice
              setTurn(PlayerTurn.PlayerTwo);
              setGoesAgain(1);
              setStatusBar(`Player TWO auto-played their ${playerTwoCards[index]["value"]} of ${playerTwoCards[index]["suit"]} and may go twice`);

              setLoadingDrawing(false);
              // console.log(`Player TWO auto-played a ${playerTwoCards[index]["value"]}`);
              return;
            }, 750);
          }
        }
        else {
          const index = playerOneCards.findIndex(card => card["value"] === "ACE" || card["value"] === "4");
          if (index !== -1) {
            setLoadingDrawing(true);
            setTimeout(() => {
              // remove the card from player 1's hand and add it to the discard pile
              discardPlayerCardEx(1, index);

              // it's player 1's turn now, and they go twice
              setTurn(PlayerTurn.PlayerOne);
              setGoesAgain(1);
              setStatusBar(`Player ONE auto-played their ${playerOneCards[index]["value"]} of ${playerOneCards[index]["suit"]} and may go twice`);

              setLoadingDrawing(false);
              // console.log(`Player ONE auto-played a ${playerOneCards[index]["value"]}`);
              return;
            }, 750);
          }
        }
      }

      // console.log(`Player ${player} played a ${card["value"]} and may go again`);
      setStatusBar(`Player ${player === 1 ? 'ONE' : 'TWO'} goes again`);
    }
    // Handle turn change
    if (goesAgainCount < 1) {
      goesAgainCount = 0; // safety margin
      if (turn === PlayerTurn.PlayerOne) {
        setTurn(PlayerTurn.PlayerTwo);
        setStatusBar('Player TWO\'s turn');
      }
      else {
        setTurn(PlayerTurn.PlayerOne);
        setStatusBar('Player ONE\'s turn');
      }
    }
    else {
      goesAgainCount--;
      setStatusBar(`Player ${player === 1 ? 'ONE' : 'TWO'} goes again`);
    }
    setGoesAgain(goesAgainCount);

    setPlayerOneError('');
    setPlayerTwoError('');
  }

  const handleDrawCard = async (playerTurn) => {
    if (remainingCards === 0) {
      const shuffleDeckAPI = `https://deckofcardsapi.com/api/deck/${deckID}/shuffle/`;
      setLoadingDrawing(true);
      const fetchAPI = await fetch(shuffleDeckAPI);

      if (!fetchAPI.ok) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      const data = await fetchAPI.json();

      const success = data["success"];
      if (!success) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      setRemainingCards(data["remaining"]);
      setLoadingDrawing(false);
    }

    let numberOfTwos = 0;
    let numberOfThrees = 0;

    // Count number of consecutive Two's from top of discard pile
    if (discardPile.length > 0) {
      let index = discardPile.length - 1;
      while (index >= 0) {
        if (discardPile[index]["value"] === "2" && discardPile[index]["ignoredByWildcardRule"] !== true) {
          numberOfTwos++;
          index--;
        } else {
          // console.log(discardPile[index]["ignoredByWildcardRule"]);
          if (discardPile[index]["value"] !== "2") console.log(`Discard pile index ${index} is not a Two`);
          if (discardPile[index]["ignoredByWildcardRule"] === true) console.log(`Discard pile index ${index} is ignored by wildcard rule`);
          break;
        }
      }
    }
    if (numberOfTwos === 0) {
      // Count number of consecutive Three's from top of discard pile
      if (discardPile.length > 0) {
        let index = discardPile.length - 1;
        while (index >= 0) {
          if (discardPile[index]["value"] === "3" && discardPile[index]["ignoredByWildcardRule"] !== true) {
            numberOfThrees++;
            index--;
          } else {
            break;
          }
        }
      }
    }

    let cardsToDraw = 1;
    // if this player played the last wild card, then they only draw 1 card
    if (whoPlayedLastWildCard === playerTurn || whoPlayedLastWildCard === null) {
      // console.log(`setting cardsToDraw to 1`);
      cardsToDraw = 1;
      setWhoPlayedLastWildCard(null);
    }
    else if (numberOfTwos > 0) cardsToDraw = numberOfTwos * 2;
    else if (numberOfThrees > 0) cardsToDraw = numberOfThrees * 3;


    // Draw cards for the current player
    for (let i = 0; i < cardsToDraw; i++)
      await drawCards(1, playerTurn);
    if (cardsToDraw > 1) {
      if (playerTurn === 1)
        setStatusBar(`Player ONE draws ${cardsToDraw} cards`);
      else
        setStatusBar(`Player TWO draws ${cardsToDraw} cards`);
    }

    let goesAgainCount = goesAgain;
    // Handle turn change
    if (goesAgainCount < 1) {
      goesAgainCount = 0;
      if (playerTurn === 1) {
        setTurn(PlayerTurn.PlayerTwo);
        setStatusBar('Player TWO\'s turn');
      } else {
        setTurn(PlayerTurn.PlayerOne);
        setStatusBar('Player ONE\'s turn');
      }
    }
    else {
      goesAgainCount--;
      setStatusBar(`Player ${playerTurn === 1 ? 'ONE' : 'TWO'} goes again`);
    }
    setGoesAgain(goesAgainCount);

    // Set last 5 cards in discard pile to ignoredByWildcardRule
    if (discardPile.length > 0) {
      let index = discardPile.length - 1;
      let count = 0;
      while (index >= 0 && count < 5) {
        (discardPile[index])["ignoredByWildcardRule"] = true;
        index--;
        count++;
      }
    }

    setPlayerOneError('');
    setPlayerTwoError('');
  }

  const drawCards = async (drawCount = 1, playerTurn = 1) => {
    if (!deckID) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const drawCardAPI = `https://deckofcardsapi.com/api/deck/${deckID}/draw/?count=${drawCount}`;
    setLoadingDrawing(true);
    const fetchAPI = await fetch(drawCardAPI);

    if (!fetchAPI.ok) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const data = await fetchAPI.json();

    const success = data["success"];
    if (!success) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const remaining = data["remaining"];
    if (remaining === 0) {
      const shuffleDeckAPI = `https://deckofcardsapi.com/api/deck/${deckID}/shuffle/`;
      setLoadingDrawing(true);
      const fetchAPI = await fetch(shuffleDeckAPI);

      if (!fetchAPI.ok) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      const data = await fetchAPI.json();

      const success = data["success"];
      if (!success) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      setRemainingCards(data["remaining"]);
      setLoadingDrawing(false);
    }

    const cards = data["cards"];

    // console.log(cards);

    if (playerTurn === 1) setPlayerOneCards(playerOneCards => [...playerOneCards, ...cards]);
    else setPlayerTwoCards(playerTwoCards => [...playerTwoCards, ...cards]);

    const playerCardsContainer = document.querySelector(`.player-${playerTurn}-cards-container`);
    if (playerCardsContainer) {
      setTimeout(() => {
        playerCardsContainer.scrollTo({
          left: playerCardsContainer.scrollWidth,
          behavior: 'smooth'
        });
      }, 255)
    }

    setRemainingCards(remaining);
    setLoadingDrawing(false);
  }

  const revealCard = async (drawCount = 1) => {
    if (!deckID) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const drawCardAPI = `https://deckofcardsapi.com/api/deck/${deckID}/draw/?count=${drawCount}`;
    setLoadingDrawing(true);
    const fetchAPI = await fetch(drawCardAPI);

    if (!fetchAPI.ok) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const data = await fetchAPI.json();

    const success = data["success"];
    if (!success) {
      alert('Error fetching deck of cards API. Refresh the page and try again.');
      return;
    }

    const remaining = data["remaining"];
    if (remaining === 0) {
      const shuffleDeckAPI = `https://deckofcardsapi.com/api/deck/${deckID}/shuffle/`;
      setLoadingDrawing(true);
      const fetchAPI = await fetch(shuffleDeckAPI);

      if (!fetchAPI.ok) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      const data = await fetchAPI.json();

      const success = data["success"];
      if (!success) {
        alert('Error fetching deck of cards API. Refresh the page and try again.');
        return;
      }

      setRemainingCards(data["remaining"]);
      setLoadingDrawing(false);
    }

    const cards = data["cards"];

    // console.log(cards);

    cards.forEach((card) => {
      (card)["ignoredByWildcardRule"] = true;
    });

    setDiscardPile(discardPile => [...discardPile, ...cards]);

    setRemainingCards(remaining);
    setLoadingDrawing(false);
  }


  return (
    <>
      {/* overlay */}
      <div className="start-game-overlay" style={{ display: (gameStatus !== GameStatus.NotStarted && gameStatus !== GameStatus.Finished) ? "none" : "initial" }}>
        <div className="start-game-overlay-content" style={{ display: (gameStatus !== GameStatus.NotStarted && gameStatus !== GameStatus.Finished) ? "none" : "initial" }}>
          {gameWinner === GameWinner.PlayerOne && <h1>PLAYER ONE WINS</h1>}
          {gameWinner === GameWinner.PlayerTwo && <h1>PLAYER TWO WINS</h1>}

          {gameStatus === GameStatus.NotStarted && <h1>CARD GAME</h1>}
          <button
            onClick={async () => {
              setGameStatus(GameStatus.DealingCards);
              setStatusBar('Dealing 5 cards');
              let index = 0;
              while (index < 5) {
                await drawCards(1, PlayerTurn.PlayerOne);
                await drawCards(1, PlayerTurn.PlayerTwo);
                index++;
              }
              setStatusBar('Revealing first card');
              await revealCard(1);
              setGameStatus(GameStatus.InProgress);
              setTurn(PlayerTurn.PlayerOne);
              // console.log(playerOneCards);
              // console.log('-----------');
              // console.log(playerTwoCards);
              setStatusBar('Player ONE starts the game');
            }}
          >
            {gameStatus === GameStatus.Finished &&
              <>Rematch</>
            }
            {gameStatus === GameStatus.NotStarted &&
              <>Play</>
            }
          </button>
        </div>
      </div>

      {/* status bar */}
      <div className='status-bar'>
        <div className='status-bar-info'>
          <h3>{statusBar}</h3>
        </div>
      </div>

      {/* div for player 1 cards (horizontal) */}
      <div className='player-area'>
        {!playerOneError && gameStatus !== GameStatus.Finished && <h1 style={{ color: turn === PlayerTurn.PlayerOne ? 'yellow' : '' }}>Player one</h1>}
        {playerOneError && gameStatus !== GameStatus.Finished && <h1 className='error'>{playerOneError}</h1>}
        {gameStatus === GameStatus.Finished && <h1>&nbsp;</h1>}
        <div className='player-info'>
          <div className="player-1-cards-container">
            {playerOneCards.map((card, index) => {
              return (
                <div className='player-card' key={index} onClick={() => handlePlayCard(1, index)}>
                  <img src={card["images"]["png"]} alt={`${card["value"].toLowerCase()} of ${card["suit"].toLowerCase()}`} />
                </div>
              )
            })}
          </div>
          <div className='player-count'>
            <div className='glove-svg'>
              <img src='https://deckofcardsapi.com/static/img/back.png' height='100px' />
              <h1>{playerOneCards.length}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="playing-area">
        <div className="draw-button">
          <button
            disabled={loadingDrawing || gameStatus !== GameStatus.InProgress}
            onClick={() => handleDrawCard(turn === PlayerTurn.PlayerOne ? 1 : 2)}
          >
            <img src='https://deckofcardsapi.com/static/img/back.png' height='170px' />
          </button>
        </div>
        <div className="discard-pile">
          {discardPile.slice(-5).map((card, index) => {
            let activeClassname = 'active-wildcard';
            if (card["value"] !== "2" && card["value"] !== "3") {
              activeClassname = ''
              // console.log('this isnt a 2 or a 3');
            }
            else if (card["ignoredByWildcardRule"] === true) {
              activeClassname = ''
              // console.log('this card is ignored by wildcard rule');
            }
            return (
              <div className='discarded-card' key={index}>
                <img className={activeClassname} src={card["images"]["png"]} alt={`${card["value"].toLowerCase()} of ${card["suit"].toLowerCase()}`} />
              </div>
            )
          })}
        </div>
      </div>

      {/* div for player 2 cards (horizontal) */}
      <div className='player-area'>
        {!playerTwoError && gameStatus !== GameStatus.Finished && <h1 style={{ color: turn === PlayerTurn.PlayerTwo ? 'yellow' : '' }}>Player two</h1>}
        {playerTwoError && gameStatus !== GameStatus.Finished && <h1 className='error'>{playerTwoError}</h1>}
        {gameStatus === GameStatus.Finished && <h1>&nbsp;</h1>}
        <div className='player-info'>
          <div className="player-2-cards-container">
            {playerTwoCards.map((card, index) => {
              return (
                <div className='player-card' key={index} onClick={() => handlePlayCard(2, index)}>
                  <img src={card["images"]["png"]} alt={`${card["value"].toLowerCase()} of ${card["suit"].toLowerCase()}`} />
                </div>
              )
            })}
          </div>
          <div className='player-count'>
            <div className='glove-svg'>
              <img src='https://deckofcardsapi.com/static/img/back.png' height='100px' />
              <h1>{playerTwoCards.length}</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
