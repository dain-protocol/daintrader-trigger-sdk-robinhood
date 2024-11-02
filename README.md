# ROBINHOOD Autonomous Trading Agents

Introducing Autonomous Trading Agents! Our platform allows you to create powerful trading agents that automatically execute trades and manage your portfolio using your Robinhood Crypto account.

## How It Works

1. **Create an Agent**: Start by creating a new trading agent on our platform.

2. **Connect Account**: Connect your Robinhood Crypto account using your API credentials. Only the connected account will be used for trading.

3. **Define Trading Strategies**: Write custom trading scripts using our provided functions to define your trading strategies.

4. **Schedule Execution**: Schedule your scripts to run automatically at specific intervals using cron jobs. Our platform handles the execution based on your cron schedule.

5. **Automatic Trading**: Your agent will automatically execute trades and manage your portfolio according to your defined strategies.

6. **Withdraw or Close**: Stop your agent at any time. Closing the agent will automatically disconnect it from your Robinhood account.

Get started now and unleash the power of autonomous trading with Robinhood Crypto!

## License


This project is open source but fully proprietary. Contributions are welcome and will be licensed under the same terms.

**Disclaimer:** The software is provided "as is", without any warranty.

**Usage:** Only for triggers on `daintrader.com`. All rights reserved by Dain, Inc.

For more information, visit [daintrader.com](https://daintrader.com).


# Example Scripts

No need to import any libraries when using it in your bots!

Make sure to await any async functions, if you do not await all of the async properties of your script then it will close out and your script will not fully execute.

**Dynamic Portfolio Rebalancing**
```typescript
const desiredAllocation = {
  "BTC-USD": 0.5,  // Bitcoin
  "ETH-USD": 0.3,  // Ethereum
  "DOGE-USD": 0.2  // Dogecoin
};

const rebalanceThreshold = 0.05; // 5% threshold for rebalancing

async function rebalancePortfolio() {
  try {
    // Get current holdings and account info
    const holdings = await robinhood.getHoldings();
    const account = await robinhood.getAccount();
    
    // Calculate total portfolio value
    let totalValue = parseFloat(account.buying_power);
    const currentPrices = await robinhood.getBestBidAsk(Object.keys(desiredAllocation));
    
    for (const holding of holdings.results) {
      const price = currentPrices.results.find(p => p.symbol === holding.asset_code)?.price || 0;
      totalValue += holding.total_quantity * price;
    }
    
    log(`Total portfolio value: $${totalValue.toFixed(2)}`);

    for (const [symbol, targetAllocation] of Object.entries(desiredAllocation)) {
      const currentHolding = holdings.results.find(h => `${h.asset_code}` === symbol);
      const currentPrice = currentPrices.results.find(p => p.symbol === symbol)?.price || 0;
      
      const currentValue = (currentHolding?.total_quantity || 0) * currentPrice;
      const currentAllocation = currentValue / totalValue;
      const targetValue = totalValue * targetAllocation;
      const diffValue = targetValue - currentValue;
      const diffPercentage = Math.abs(diffValue / targetValue);

      log(`${symbol}: Current allocation: ${(currentAllocation * 100).toFixed(2)}%, Target: ${(targetAllocation * 100).toFixed(2)}%`);

      if (diffPercentage > rebalanceThreshold) {
        if (diffValue > 0) {
          // Need to buy
          const quantity = Math.abs(diffValue / currentPrice);
          const orderPayload = {
            symbol,
            side: "buy",
            type: "market",
            market_order_config: {
              asset_quantity: quantity
            }
          };
          
          const order = await robinhood.placeOrder(orderPayload);
          log(`Bought ${quantity.toFixed(8)} ${symbol} worth $${diffValue.toFixed(2)}. Order ID: ${order.id}`);
        } else {
          // Need to sell
          const quantity = Math.abs(diffValue / currentPrice);
          const orderPayload = {
            symbol,
            side: "sell",
            type: "market",
            market_order_config: {
              asset_quantity: quantity
            }
          };
          
          const order = await robinhood.placeOrder(orderPayload);
          log(`Sold ${quantity.toFixed(8)} ${symbol} worth $${Math.abs(diffValue).toFixed(2)}. Order ID: ${order.id}`);
        }
      } else {
        log(`${symbol} is within the rebalance threshold. No action needed.`);
      }
    }

    log("Portfolio rebalancing completed.");

  } catch (error) {
    log(`An error occurred during rebalancing: ${error}`);
  }
}

await rebalancePortfolio();
```
Cron Schedule: `0 0 * * *`

**Volume-Based Trading Strategy**
```typescript
const symbol = "BTC-USD";
const highVolumeThreshold = 1000000; // $1 million in 24h volume
const lowVolumeThreshold = 500000;   // $500k in 24h volume
const tradeAmount = 0.001; // Amount of BTC to trade

async function placeVolumeBasedOrder() {
  try {
    // Get current market data
    const marketData = await robinhood.getBestBidAsk([symbol]);
    const currentPrice = marketData.results[0].price;
    
    // Get 24h trading activity using order history
    const yesterdayDate = new Date(Date.now() - 24*60*60*1000).toISOString();
    const orders = await robinhood.getOrders({
      symbol,
      created_at_start: yesterdayDate
    });
    
    // Calculate 24h volume
    const volume24h = orders.results.reduce((total, order) => {
      if (order.state === "filled") {
        return total + (order.average_price || 0) * order.filled_asset_quantity;
      }
      return total;
    }, 0);

    log(`Current 24-hour trading volume for ${symbol}: $${volume24h.toFixed(2)}`);

    if (volume24h >= highVolumeThreshold) {
      // High volume: Buy
      const orderPayload = {
        symbol,
        side: "buy",
        type: "market",
        market_order_config: {
          asset_quantity: tradeAmount
        }
      };
      
      const order = await robinhood.placeOrder(orderPayload);
      log(`High volume detected. Bought ${tradeAmount} ${symbol}. Order ID: ${order.id}`);
      
    } else if (volume24h <= lowVolumeThreshold) {
      // Low volume: Sell
      const orderPayload = {
        symbol,
        side: "sell",
        type: "market",
        market_order_config: {
          asset_quantity: tradeAmount
        }
      };
      
      const order = await robinhood.placeOrder(orderPayload);
      log(`Low volume detected. Sold ${tradeAmount} ${symbol}. Order ID: ${order.id}`);
      
    } else {
      log(`Current volume is between thresholds. No action taken.`);
    }

  } catch (error) {
    log(`An error occurred: ${error}`);
  }
}

await placeVolumeBasedOrder();
```
Cron Schedule: `0 0 * * *`

**Price-Based Limit Orders**
```typescript
const symbol = "BTC-USD";
const targetPrice = 50000; // Target price to sell BTC
const stopLossPrice = 45000; // Stop-loss price to sell BTC
const percentToSell = 0.5; // Sell 50% of holdings when conditions are met

async function placeLimitOrder() {
  try {
    // Get current holdings
    const holdings = await robinhood.getHoldings([symbol.split("-")[0]]);
    const holding = holdings.results[0];
    
    if (!holding || holding.total_quantity <= 0) {
      log("Insufficient holdings. No assets available to sell.");
      return;
    }

    // Calculate amount to sell
    const quantityToSell = holding.total_quantity * percentToSell;

    // Get current market price
    const marketData = await robinhood.getBestBidAsk([symbol]);
    const currentPrice = marketData.results[0].price;

    if (currentPrice >= targetPrice) {
      // Place a market sell order when target price is reached
      const orderPayload = {
        symbol,
        side: "sell",
        type: "market",
        market_order_config: {
          asset_quantity: quantityToSell
        }
      };
      
      const order = await robinhood.placeOrder(orderPayload);
      log(`Target price reached. Sold ${quantityToSell.toFixed(8)} ${symbol} at price: $${currentPrice.toFixed(2)}. Order ID: ${order.id}`);
      
    } else if (currentPrice <= stopLossPrice) {
      // Place a market sell order when stop-loss is triggered
      const orderPayload = {
        symbol,
        side: "sell",
        type: "market",
        market_order_config: {
          asset_quantity: quantityToSell
        }
      };
      
      const order = await robinhood.placeOrder(orderPayload);
      log(`Stop-loss triggered. Sold ${quantityToSell.toFixed(8)} ${symbol} at price: $${currentPrice.toFixed(2)}. Order ID: ${order.id}`);
      
    } else {
      log(`Current ${symbol} price: $${currentPrice.toFixed(2)}. No action taken.`);
    }

  } catch (error) {
    log(`Failed to execute order: ${error}`);
  }
}

await placeLimitOrder();
```
Cron Schedule: `*/30 * * * *`

**Dollar-Cost Averaging (DCA)**
```typescript
const symbol = "BTC-USD";
const usdAmount = 100; // Amount in USD to invest

async function dcaInvestment() {
  try {
    // Get current market price
    const marketData = await robinhood.getBestBidAsk([symbol]);
    const currentPrice = marketData.results[0].price;
    
    // Calculate quantity to buy
    const quantity = usdAmount / currentPrice;
    
    // Place market buy order
    const orderPayload = {
      symbol,
      side: "buy",
      type: "market",
      market_order_config: {
        asset_quantity: quantity
      }
    };
    
    const order = await robinhood.placeOrder(orderPayload);
    log(`DCA Buy: ${quantity.toFixed(8)} ${symbol} at $${currentPrice.toFixed(2)}. Order ID: ${order.id}`);
    
    // Get updated holdings
    const holdings = await robinhood.getHoldings([symbol.split("-")[0]]);
    const holding = holdings.results[0];
    
    if (holding) {
      log(`Current ${symbol} balance: ${holding.total_quantity.toFixed(8)}`);
    }
    
  } catch (error) {
    log(`Failed to execute DCA investment: ${error}`);
  }
}

await dcaInvestment();
```
Cron Schedule: `0 9 * * 1` // Every Monday at 9 AM



# Persistent Storage

Since the trading scripts run on non-persistent serverless functions, you cannot directly set a variable and expect it to be available the next time the script runs. To overcome this limitation, we provide the `getValue` and `setValue` functions for persistent storage.

SCRIPTS CANNOT KEEP STATE. U NEED TO USE THE setValue and getValue to keep sokmething persisting between runs of the script / cron

Note: The stored values are specific to each trigger agent, so different agents will have their own separate storage.

### `setValue(key: string, value: any): Promise<any>`

Sets a key-value pair in persistent storage.

- `key`: The key to store the value under.
- `value`: The value to store.
- Returns a promise that resolves to the stored value.

### `getValue(key: string): Promise<any>`

Retrieves a value from persistent storage based on the provided key. SCRIPTS CANNOT KEEP STATE. U NEED TO USE THE setValue and getValue to keep sokmething persisting between runs of the script / cron

- `key`: The key to retrieve the value for.
- Returns a promise that resolves to the retrieved value.

Use the `setValue` function to store values that you want to persist across script executions. You can then retrieve those values using the `getValue` function in subsequent script runs.

Here's an example of how to use `getValue` and `setValue`:

```typescript
async function persistantCounter() {
  // Store a value
  await setValue("counter", 0);

  // Retrieve the value
  const counter = await getValue("counter");
  console.log(counter); // Output: 0

  // Increment the counter
  await setValue("counter", counter + 1);
}

 await persistantCounter();
```


# Notifications and Alerts

### `sendNotification(platform: string, message: string): Promise<boolean>`

Sends a notification to the specified platform. The current allowed values for platform are `telegram`

- `platform`: The platform the send the notification to
- `message`: The message as a string to send to the platform 
- returns a promise with a boolean indidicating success or failure of sending the notification

For notifications, make sure to connect the account on the dashboard because otherwise notificatins wont get delivered.



# Notifications and Alerts

### `sendNotification(platform: string, message: string): Promise<boolean>`

Sends a notification to the specified platform.

- `platform`: Currently supports "telegram"
- `message`: The message to send
- Returns a promise that resolves to success status

For notifications to work, make sure to connect your notification platform account in the dashboard settings.

# Webhook Triggers

You can trigger your trading scripts via webhooks. The webhook payload is accessible through the `webhookBody` variable in your script.

Example webhook handler:
```typescript
async function handleWebhook() {
  try {
    if (!webhookBody) {
      log("No webhook body found");
      return;
    }

    const payload = webhookBody as {
      action: "buy" | "sell";
      symbol: string;
      quantity: number;
    };

    if (payload.action === "buy") {
      const order = await robinhood.placeOrder({
        symbol: payload.symbol,
        side: "buy",
        type: "market",
        market_order_config: {
          asset_quantity: payload.quantity
        }
      });
      log(`Webhook triggered buy order: ${order.id}`);
    }
    // Handle other actions...
    
  } catch (error) {
    log(`Webhook handler error: ${error}`);
  }
}

await handleWebhook();
```



Spawning a Sub Agent
You can spawn a sub agent to search the web and find any information you need. This can be useful for making decisions based on external data or events.
spawn_sub_agent(query: string, responseType: string): Promise<string>
Spawns a sub AI agent that can search the web and find the requested information.

query: The query or question to ask the sub agent.
responseType: The expected type of the response. Can be "boolean", "number", or "string".
Returns a promise that resolves to the sub agent's response as a string.

The response from the sub agent is always a string, but you can specify the expected response type and convert it accordingly in your code:

Booleans will be in "TRUE" or "FALSE" format.
Numbers will be in "123" format.
Strings will be in "hello" format.

Here's an example of how to use spawn_sub_agent to check if World War 3 has started and sell all your Bitcoin holdings accordingly:
typescriptCopyconst symbol = "BTC-USD";
const emergencyThreshold = 1000; // Minimum USD value to execute emergency sale

async function checkWorldWarStatus() {
  try {
    // Check if World War 3 has started
    const query = "Has World War 3 started? Answer with TRUE if it has started, or FALSE if it has not.";
    const response = await spawn_sub_agent(query, "boolean");

    log(`World War 3 status check result: ${response}`);

    if (response === "TRUE") {
      log("World War 3 has reportedly started. Initiating emergency protocol to sell all Bitcoin.");

      // Check holdings
      const holdings = await robinhood.getHoldings(["BTC"]);
      const btcHolding = holdings.results.find(h => h.asset_code === "BTC");

      if (!btcHolding || btcHolding.total_quantity <= 0) {
        log("No Bitcoin holdings found. No action needed.");
        return;
      }

      // Get current market price
      const marketData = await robinhood.getBestBidAsk([symbol]);
      const currentPrice = marketData.results[0].price;
      const holdingValue = btcHolding.total_quantity * currentPrice;

      if (holdingValue < emergencyThreshold) {
        log(`Bitcoin holdings value ($${holdingValue.toFixed(2)}) below emergency threshold. No action needed.`);
        return;
      }

      // Sell all BTC at market price
      const orderPayload = {
        symbol,
        side: "sell",
        type: "market",
        market_order_config: {
          asset_quantity: btcHolding.total_quantity
        }
      };

      try {
        const order = await robinhood.placeOrder(orderPayload);
        log(`Emergency sell order placed for ${btcHolding.total_quantity.toFixed(8)} BTC. Order ID: ${order.id}`);

        // Monitor order completion
        const filledOrder = await robinhood.getOrder(order.id);
        log(`Emergency sell completed. Sold at average price: $${filledOrder.average_price?.toFixed(2) || 'N/A'}`);

        // Check updated holdings
        const updatedHoldings = await robinhood.getHoldings(["BTC"]);
        const updatedBtc = updatedHoldings.results.find(h => h.asset_code === "BTC");
        log(`Updated BTC balance: ${updatedBtc?.total_quantity.toFixed(8) || 0} BTC`);

      } catch (orderError) {
        log(`Failed to execute emergency sell order: ${orderError}`);
      }

    } else {
      log("World War 3 has not started. No action needed.");

      // Optionally, log current BTC holdings
      const holdings = await robinhood.getHoldings(["BTC"]);
      const btcHolding = holdings.results.find(h => h.asset_code === "BTC");
      if (btcHolding) {
        log(`Current BTC holdings: ${btcHolding.total_quantity.toFixed(8)} BTC`);
      } else {
        log("No Bitcoin holdings found.");
      }
    }

  } catch (error) {
    log(`An error occurred during the World War status check: ${error}`);
  }
}

await checkWorldWarStatus();
In this example, the script spawns a sub agent to check if World War 3 has started. The sub agent searches the web and returns a boolean response. If the response is "TRUE", indicating that World War 3 has started, the script retrieves the Bitcoin holdings and sells all of it using a market order. If the response is "FALSE", the script logs a message indicating that it is maintaining its Bitcoin position.