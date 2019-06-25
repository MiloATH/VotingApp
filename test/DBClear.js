const mongoose = require('mongoose');

module.exports = {

  connectAndClearDB: function(done) {
    /**
     * Clear the mongo database
     *
     * @param {Function} done is a callback.
     */
    function clearDB(done) {
      for (const i in mongoose.connection.collections) {
        if (Object.prototype.hasOwnProperty.call(
            mongoose.connection.collections, i)) {
          mongoose.connection.collections[i].remove(function() {});
        }
      }
      done();
    }

    if (mongoose.connection.readyState === 0) {
      // Should only ever connect to TEST_MONGO_URI
      // because this will clear the db
      mongoose.connect(process.env.TEST_MONGO_URI, function(err) {
        if (err) {
          throw err;
        }
        clearDB(done);
      });
    } else {
      clearDB(done);
    }
  },

};
