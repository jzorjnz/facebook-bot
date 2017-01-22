var fs      = require('fs');

module.exports = {
  /**
  *  Populate the cache.
  */
  populateCache: function() {
    self = this;
    if (typeof self.zcache === "undefined") {
        self.zcache = { 'index.html': '' };
    }

    //  Local cache for static content.
    self.zcache['index.html'] = fs.readFileSync('./index.html');
  },


  /**
  *  Retrieve entry (content) from cache.
  *  @param {string} key  Key identifying content to retrieve from cache.
  */
  cache_get: function(key) {
    return self.zcache[key];
  }


};