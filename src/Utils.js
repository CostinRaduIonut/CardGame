export const PlayerTurn = {
    PlayerOne: 1,
    PlayerTwo: 2,
}

export const GameStatus = {
    NotStarted:0,
    DealingCards:1,
    InProgress:2,
    Finished:3,
}

export const GameWinner = {
    PlayerOne: 1,
    PlayerTwo: 2,
}

// export const Card = {
//     code: null,
//     image: null,
//     images: {
//         svg: null,
//         png: null,
//     },
//     value: null,
//     suit: null,
//     ignoredByWildcardRule: undefined,
// };

// Tipul pentru indicatori de potrivire
export const MatchFlags = {
    rank: undefined,
    suit: undefined,
};

export const isWildcard = (card) => {
    if (typeof card === "string") {
        return ["2", "3"].includes(card);
    }
    return ["2", "3"].includes(card["value"]);
};

export const isSkipcard = (card) => {
    if (typeof card === "string") {
        return ["4", "ACE"].includes(card);
    }
    return ["4", "ACE"].includes(card["value"]);
};

export const cardsMatch = (
    card1,
    card2,
    flags = { rank: false, suit: false }
) => {
    if (flags.rank && card1.value !== card2.value) return false;
    if (flags.suit && card1.suit !== card2.suit) return false;
    return card1.value === card2.value || card1.suit === card2.suit;
};


