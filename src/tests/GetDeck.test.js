import React from 'react';
import { render, act } from '@testing-library/react';
import App from '../App';

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, deck_id: 'mockDeckID', remaining: 52 }),
});

beforeEach(() => {
  global.fetch.mockClear();
});

test('fetches deck of cards API and sets state', async () => {
  let getByText;
  await act(async () => {
    const { getByText: getByTextFn } = render(<App />);
    getByText = getByTextFn;
  });

  expect(global.fetch).toHaveBeenCalledWith(
    'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
  );

  expect(getByText('Pending...')).toBeInTheDocument();

});
