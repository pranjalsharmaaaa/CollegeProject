var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { 
        type: String, 
        required: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['teacher', 'student'] 
    },
    school: { 
        type: String, 
        default: '' 
    },
    course: { 
        type: String, 
        default: '' 
    },
    classCode: { 
        type: String, 
        default: null 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('user', userSchema);
