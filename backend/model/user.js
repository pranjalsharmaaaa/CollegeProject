var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Fix: Declare userSchema properly with 'var' or 'const'
const userSchema = new Schema({
    username: String,
    password: String
});

// CRITICAL FIX: Export the model using the built-in Mongoose cache check.
// This prevents the OverwriteModelError when Nodemon restarts.
module.exports = mongoose.models.user || mongoose.model('user', userSchema);