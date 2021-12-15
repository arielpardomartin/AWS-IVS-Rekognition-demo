const closeSocket = (socket) => {
  if (socket) {
    // Check if the current state of the connection is CONNECTING (0)
    // In that case wait before closing the connection
    if (socket.readyState === 0) {
      setTimeout(() => closeSocket(socket), 1000);
    } else {
      socket.close(1000, 'Work complete');
    }
  }
};

const setOnMessageListener = (socket, isDebugMode, onMessage) => {
  const listenerDebugOn = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[Websockets message] Data received from server:', data);
      onMessage(data);
    } catch (err) {
      console.log(err);
    }
  };

  const listenerDebugOff = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.log(err);
    }
  };

  socket.onmessage = isDebugMode ? listenerDebugOn : listenerDebugOff;
};

const createSocket = (url, isDebugMode, onMessage) => {
  let socket;

  try {
    /* eslint-disable no-undef */
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.info(`[Websocket onopen event] Connected to URL: ${url}`);
    };

    socket.onerror = (error) => {
      console.error('[Websocket onerror event] Error details:\n', error);
    };

    socket.onclose = () => {
      console.info(`[Websocket onclose event] Disconnected from URL: ${url}`);
    };

    setOnMessageListener(socket, isDebugMode, onMessage);
  } catch (err) {
    console.error(`[Websockets exception] ${err.message}`);
  }

  return socket;
};

export { closeSocket, createSocket };
