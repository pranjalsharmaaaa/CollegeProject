var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the schema with topics field and classCode
const courseSchema = new Schema({
    class_name: String,
    subject_name: String,
    unit_title: String,
    user_id: Schema.ObjectId,
    resource_type: String,
    syllabus_file_path: String,
    syllabus_text: String,
    // NEW: Add topics array for subtopics
    topics: [{
        topic_name: String,
        description: String,
        keywords: [String] // For YouTube search
    }],
    // NEW: Add classCode field - stores unique code per course
    classCode: {
        type: String,
        default: null,
        sparse: true // Allows multiple null values (courses without codes)
    },
    is_delete: { 
        type: Boolean, 
        default: false 
    },
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.models.course || mongoose.model('course', courseSchema);
