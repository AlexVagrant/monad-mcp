/**
 * Monad MCP Tutorial
 * 
 * This file demonstrates how to create a Model Context Protocol (MCP) server
 * that interacts with the Monad blockchain testnet to check MON balances.
 */

// Import necessary dependencies
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPublicClient, defineChain, formatUnits, http, createWalletClient, parseUnits } from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Create a public client to interact with the Monad testnet
const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
});

// Initialize the MCP server with a name, version, and capabilities
const server = new McpServer({
    name: "monad-mcp-tutorial",
    version: "0.0.1",
});

// Define a tool that gets the MON balance for a given address
server.tool(
    "get-mon-balance",
    "Get MON balance for an address on Monad testnet",
    {
      address: z.string().describe("Monad testnet address to check balance for"),
    },
    async ({ address }) => {
      try {
        const balance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
  
        return {
          content: [
            {
              type: "text",
              text: `Balance for ${address}: ${formatUnits(balance, 18)} MON`,
            },
          ],
        };
      } catch (error) {
        console.error("Error getting balance:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve balance for address: ${address}. Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
);

// 获取当前gas价格
server.tool(
    "get-gas-price",
    "Get the current gas price on the Monad testnet",
    {},
    async () => {
      try {
        const feeData = await publicClient.estimateFeesPerGas();
        
        return {
          content: [
            {
              type: "text",
              text: `Current gas price: ${formatUnits(feeData.maxFeePerGas || 0n, 9)} Gwei`,
            },
          ],
        };
      } catch (error) {
        console.error("Error getting gas price:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get gas price. Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
);

// 获取账户的交易数量(nonce)
server.tool(
    "get-transaction-count",
    "Get the transaction count (nonce) for an address",
    {
      address: z.string().describe("Address to check transaction count for"),
    },
    async ({ address }) => {
      try {
        const count = await publicClient.getTransactionCount({
          address: address as `0x${string}`,
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Transaction count for ${address}: ${count}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error getting transaction count:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get transaction count for address: ${address}. Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
);

// 签名并发送交易
server.tool(
    "sign-and-send-transaction",
    "Sign and send a transaction to the Monad testnet",
    {
      privateKey: z.string().describe("Private key of the sender (DO NOT SHARE YOUR REAL PRIVATE KEY)"),
      to: z.string().describe("Receiver address"),
      value: z.string().describe("Amount to send in ETH"),
      data: z.string().optional().describe("Transaction data"),
    },
    async ({ privateKey, to, value, data }) => {
      try {
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: monadTestnet,
          transport: http(),
        });
        
        const hash = await walletClient.sendTransaction({
          to: to as `0x${string}`,
          value: parseUnits(value, 18),
          data: data as `0x${string}` | undefined,
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Transaction sent successfully! Transaction hash: ${hash}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error sending transaction:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to send transaction. Error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
);

/**
 * Main function to start the MCP server
 * Uses stdio for communication with LLM clients
 */
async function main() {
    // Create a transport layer using standard input/output
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    console.error("Monad testnet MCP Server running on stdio");
}

// Start the server and handle any fatal errors
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});