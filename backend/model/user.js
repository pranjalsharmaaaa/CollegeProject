var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String,
    role: { type: String, enum: ['teacher', 'student'], default: 'teacher' },
    classCode: String  // NEW: Store teacher's class code
});

module.exports = mongoose.models.user || mongoose.model('user', userSchema);    