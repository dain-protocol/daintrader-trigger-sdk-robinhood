#Here is the full spec for the robinhood api for reference

## API Methods

### Market Data

#### getBestBidAsk
Get current bid/ask prices for specified symbols.
```typescript
// Input
symbols: string[] = ["BTC-USD"]

// Output
{
  results: [{
    symbol: string;
    price: number;
    bid_inclusive_of_sell_spread: number;
    sell_spread: number;
    ask_inclusive_of_buy_spread: number;
    buy_spread: number;
    timestamp: string;
  }]
}

// Example
const bidAsk = await robinhood.getBestBidAsk(['BTC-USD', 'ETH-USD']);
console.log('BTC/USD Price:', bidAsk.results[0].price);
```

#### getEstimatedPrice
Get estimated prices for specific quantities.
```typescript
// Input
{
  symbol: string;
  side: "bid" | "ask" | "both";
  quantities: number[];
}

// Output
{
  results: [{
    symbol: string;
    side: "bid" | "ask";
    price: number;
    quantity: number;
    bid_inclusive_of_sell_spread: number;
    sell_spread: number;
    ask_inclusive_of_buy_spread: number;
    buy_spread: number;
    timestamp: string;
  }]
}

// Example
const estimate = await robinhood.getEstimatedPrice(
  'BTC-USD',
  'bid',
  [0.1, 0.2]
);
console.log('Estimated price for 0.1 BTC:', estimate.results[0].price);
```

### Trading

#### placeOrder
Place a new order.
```typescript
// Input
{
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop_limit" | "stop_loss";
  market_order_config?: {
    asset_quantity: number;
  };
  limit_order_config?: {
    quote_amount?: number;
    asset_quantity?: number;
    limit_price: number;
    time_in_force: "gtc";
  };
  stop_loss_order_config?: {
    quote_amount?: number;
    asset_quantity?: number;
    stop_price: number;
    time_in_force: "gtc";
  };
  stop_limit_order_config?: {
    quote_amount?: number;
    asset_quantity?: number;
    limit_price: number;
    stop_price: number;
    time_in_force: "gtc";
  };
}

// Output
{
  id: string;
  account_number: string;
  symbol: string;
  client_order_id: string;
  side: "buy" | "sell";
  executions: Array<{
    effective_price: string;
    quantity: string;
    timestamp: string;
  }>;
  type: "limit" | "market" | "stop_limit" | "stop_loss";
  state: "open" | "canceled" | "partially_filled" | "filled" | "failed";
  average_price: number | null;
  filled_asset_quantity: number;
  created_at: string;
  updated_at: string;
}

// Example - Market Order
const marketOrder = await robinhood.placeOrder({
  symbol: 'BTC-USD',
  side: 'buy',
  type: 'market',
  market_order_config: {
    asset_quantity: 0.001
  }
});

// Example - Limit Order
const limitOrder = await robinhood.placeOrder({
  symbol: 'ETH-USD',
  side: 'buy',
  type: 'limit',
  limit_order_config: {
    asset_quantity: 0.1,
    limit_price: 2000,
    time_in_force: 'gtc'
  }
});
```

#### getOrder
Get details of a specific order.
```typescript
// Input
orderId: string

// Output
{
  // Same as placeOrder output
}

// Example
const order = await robinhood.getOrder('abc123');
console.log('Order status:', order.state);
```

#### getOrders
List orders with optional filters.
```typescript
// Input
{
  created_at_start?: string;
  created_at_end?: string;
  symbol?: string;
  id?: string;
  side?: "buy" | "sell";
  state?: "open" | "canceled" | "partially_filled" | "filled" | "failed";
  type?: "limit" | "market" | "stop_limit" | "stop_loss";
  updated_at_start?: string;
  updated_at_end?: string;
  limit?: number;
  cursor?: string;
}

// Output
{
  next: string | null;
  previous: string | null;
  results: Array<Order>; // Same as placeOrder output
}

// Example
const orders = await robinhood.getOrders({
  symbol: 'BTC-USD',
  side: 'buy',
  state: 'open'
});
console.log('Open BTC buy orders:', orders.results.length);
```

#### cancelOrder
Cancel an existing order.
```typescript
// Input
orderId: string

// Output
{
  success: string;
}

// Example
const result = await robinhood.cancelOrder('abc123');
console.log('Cancel successful:', result.success);
```

### Account

#### getAccount
Get account information.
```typescript
// Input
None

// Output
{
  account_number: string;
  status: "active" | "deactivated" | "sell_only";
  buying_power: string;
  buying_power_currency: string;
}

// Example
const account = await robinhood.getAccount();
console.log('Buying power:', account.buying_power);
```

#### getHoldings
Get current holdings.
```typescript
// Input
{
  assetCodes?: string[];
  limit?: number;
  cursor?: string;
}

// Output
{
  next: string | null;
  previous: string | null;
  results: Array<{
    account_number: string;
    asset_code: string;
    total_quantity: number;
    quantity_available_for_trading: number;
  }>;
}

// Example
const holdings = await robinhood.getHoldings(['BTC', 'ETH']);
holdings.results.forEach(holding => {
  console.log(`${holding.asset_code} balance: ${holding.total_quantity}`);
});
```

## Error Handling
```typescript
// All methods may throw errors with this structure:
{
  type: "validation_error" | "client_error" | "server_error";
  errors: Array<{
    detail: string;
    attr: string | null;
  }>;
}

// Example
try {
  const order = await robinhood.placeOrder({
    symbol: 'BTC-USD',
    side: 'buy',
    type: 'market',
    market_order_config: {
      asset_quantity: 0.001
    }
  });
} catch (error) {
  console.error('Order failed:', error.errors[0].detail);
}
```
