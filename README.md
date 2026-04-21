# FIRE Wealth Tracker

A Next.js application for calculating and maintaining FIRE goals while tracking personal wealth across assets such as gold, equity, fixed deposits, and other savings or investments.

## Overview

This app is built for users who want to track how much they have invested, how their assets are performing, and how those investments contribute toward financial independence.

The focus is on:

- recording purchases of investment assets
- tracking removals or sales from holdings
- measuring invested capital by asset type
- estimating current profit or loss
- monitoring total wealth growth over time
- supporting FIRE planning with real portfolio data

## Key Product Rules

- The system stores and tracks the **buying price** of assets.
- Selling price is not the primary value for portfolio tracking.
- The main goal is to understand:
  - how much money was invested
  - what the current value is
  - how much profit or loss has been made
- Users should be able to add and remove holdings while preserving a clear investment history.

## Core Features

### FIRE Planning

- FIRE number calculator
- annual expense tracking
- savings rate tracking
- net worth growth tracking
- retirement target milestones
- financial independence progress dashboard

### Wealth Tracking

- add purchases for gold, equity, FDs, and other assets
- record quantity, purchase date, and buying price
- remove or sell holdings from the portfolio
- categorize investments by asset class
- track total invested amount
- view current portfolio value
- calculate unrealized profit and loss
- calculate overall portfolio growth

### Dashboard

- portfolio summary
- total investment vs current value
- asset allocation breakdown
- gain/loss by asset type
- timeline of purchases and removals
- responsive UI for desktop and mobile

## Supported Asset Types

Examples of assets this app can support:

- gold
- equity or stocks
- fixed deposits
- mutual funds
- ETFs
- savings instruments
- bonds
- custom investments

## Tech Stack

- [Next.js](https://nextjs.org/) for the application framework
- React for UI development
- TypeScript for type safety
- a database layer such as PostgreSQL, MySQL, SQLite, or Supabase
- optional market data integrations for current asset valuation

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

### Production Build

```bash
npm run build
npm start
```

## Suggested Project Structure

```text
app/
  dashboard/
  fire/
  portfolio/
  transactions/
  api/
components/
lib/
services/
types/
public/
```

## Example Data Model

Each transaction may contain:

- asset name
- asset type
- quantity
- buying price
- purchase date
- current estimated value
- notes

This supports calculations such as:

- total invested capital
- current total value
- gain or loss amount
- gain or loss percentage

## Environment Variables

If this app uses a database or external pricing APIs, create a `.env.local` file:

```env
NEXT_PUBLIC_APP_NAME=FIRE Wealth Tracker
DATABASE_URL=your_database_connection_string
```

Add additional variables only as required by your chosen stack.

## Typical Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Roadmap Ideas

- authentication and user accounts
- recurring investment entries
- historical portfolio charts
- import/export of transactions
- asset-wise profit and loss reports
- dashboards for net worth and FIRE progress
- alerts for target milestones

## Disclaimer

This application is intended for personal tracking and planning. It should not be considered financial or investment advice.

## License

Choose a license such as MIT if the project will be shared publicly.
