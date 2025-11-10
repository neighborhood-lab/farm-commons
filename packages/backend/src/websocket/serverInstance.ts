// WebSocket Server Instance Holder
// This module prevents circular dependencies by providing a way to set/get the WebSocket server

import type { WebSocketServer } from './index.js';

let wsServerInstance: WebSocketServer | null = null;

export function setWebSocketServer(server: WebSocketServer): void {
  wsServerInstance = server;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServerInstance;
}
