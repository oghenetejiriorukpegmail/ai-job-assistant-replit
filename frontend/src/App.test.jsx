import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

test('renders Job Application Portal header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Job Application Portal/i);
  expect(headerElement).toBeInTheDocument();
});