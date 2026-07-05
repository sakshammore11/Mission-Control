let timerId = null;

self.onmessage = function (e) {
  if (e.data.command === 'start') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage('tick');
    }, 1000);
  } else if (e.data.command === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
