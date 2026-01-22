function getTimestamp(timestamp) {
    if (timestamp) {
        return Math.floor(new Date(timestamp * 1000).getTime() / 1000);
    }
    return Math.floor(new Date().getTime() / 1000);
  }

  module.exports = {
    getTimestamp
  }