function simulateTyping(text, speed = 20) {
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }


  module.exports = {
    simulateTyping
  }