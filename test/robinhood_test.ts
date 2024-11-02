import { assertEquals } from "jsr:@std/assert";
import { robinhood } from "../src/util/rhood.ts";
import { OrderPayload } from "npm:robinhood-crypto@0.0.6";

Deno.test("Robinhood API - Basic Functionality", async (t) => {
  await t.step("should get account info", async () => {
    const account = await robinhood.getAccount();
    assertEquals(typeof account.account_number, "string");
    assertEquals(typeof account.buying_power, "string");
  });

  await t.step("should get holdings", async () => {
    const holdings = await robinhood.getHoldings();
    assertEquals(Array.isArray(holdings.results), true);
  });

  await t.step("should get bid/ask prices", async () => {
    const bidAsk = await robinhood.getBestBidAsk(["BTC-USD"]);
    assertEquals(Array.isArray(bidAsk.results), true);
    if (bidAsk.results.length > 0) {
      const result = bidAsk.results[0];
      assertEquals(result.symbol, "BTC-USD");
      assertEquals(typeof result.price, "number");
    }
  });

  await t.step("should get estimated price", async () => {
    const estimate = await robinhood.getEstimatedPrice("BTC-USD", "bid", [0.1]);
    assertEquals(Array.isArray(estimate.results), true);
    if (estimate.results.length > 0) {
      const result = estimate.results[0];
      assertEquals(result.symbol, "BTC-USD");
      assertEquals(typeof result.price, "number");
    }
  });

  await t.step("should place and verify market order", async () => {
    const orderParams = {
      side: "buy",
      type: "market",
      symbol: "BTC-USD",
      market_order_config: {
        asset_quantity: 0.00001, // Small BTC amount for testing
      },
    } as OrderPayload;

    const placedOrder = await robinhood.placeOrder(orderParams);
    assertEquals(typeof placedOrder.id, "string");
    assertEquals(placedOrder.side, "buy");
    assertEquals(placedOrder.type, "market");
    assertEquals(placedOrder.symbol, "BTC-USD");

    // Verify order details
    const orderDetails = await robinhood.getOrder(placedOrder.id);
    assertEquals(orderDetails.id, placedOrder.id);
    assertEquals(typeof orderDetails.filled_asset_quantity, "number");
  });

  await t.step("should get order history", async () => {
    const orders = await robinhood.getOrders({
      symbol: "BTC-USD",
    });
    assertEquals(Array.isArray(orders.results), true);
    if (orders.results.length > 0) {
      const order = orders.results[0];
      assertEquals(typeof order.id, "string");
      assertEquals(typeof order.symbol, "string");
    }
  });
});
