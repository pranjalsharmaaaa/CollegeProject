var express = require("express");
var app = express();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var multer = require('multer'),
  bodyParser = require('body-parser'),
  path = require('path');
var mongoose = require("mongoose");

// The database name is updated from productDB to courseDB
mongoose.connect("mongodb://localhost/productDB", { useNewUrlParser: true, useUnifiedTopology: true });
var fs = require('fs');

// IMPORTANT: We are connecting to 'productDB' again to keep users and courses in one place
// Remove the extra semicolon at the end of the mongoose.connect line

// --- MULTER CONFIGURATION FOR FILE UPLOADS ---
var dir = './uploads';
var upload = multer({
  storage: multer.diskStorage({

    destination: function (req, file, callback) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      callback(null, './uploads');
    },
    filename: function (req, file, callback) { callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }

  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname)
    // Accept common document types for the syllabus
    if (ext !== '.pdf' && ext !== '.doc' && ext !== '.docx' && ext !== '.txt') {
      // Return null, false for file rejection
      return callback(null, false);
    }
    callback(null, true);
  }
});
// --- END MULTER CONFIGURATION ---

// This line is now correct, assuming you renamed product.js to course.js
var course = require("./model/course.js");

var user = require("./model/user.js");

app.use(cors());
app.use(express.static("uploads"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware for auth
app.use((req, res, next) => {
  try {
    // Public routes
    if (req.path === "/login" || req.path === "/register" || req.path === "/") {
      return next();
    }

    // Protected routes → check token
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json({
        errorMessage: "Token missing!",
        status: false,
      });
    }

    jwt.verify(token, "shhhhh11111", (err, decoded) => {
      if (err || !decoded?.user) {
        return res.status(401).json({
          errorMessage: "User unauthorized!",
          status: false,
        });
      }
      req.user = decoded.user;
      next();
    });
  } catch (e) {
    return res.status(400).json({
      errorMessage: "Something went wrong!",
      status: false,
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    title: "Apis",
  });
});

/* login api */
app.post("/login", async (req, res) => {
  try {
    if (req.body && req.body.username && req.body.password) {
      // Use findOne and await
      const userData = await user.findOne({ username: req.body.username });
      
      if (!userData) { 
        return res.status(400).json({ errorMessage: 'Username or password is incorrect!', status: false });
      }
      
      // CRITICAL FIX: Use ASYNCHRONOUS COMPARISON
      const isMatch = await bcrypt.compare(req.body.password, userData.password);

      if (isMatch) {
        checkUserAndGenerateToken(userData, req, res);
      } else {
        res.status(400).json({ errorMessage: 'Username or password is incorrect!', status: false });
      }
      
    } else { res.status(400).json({ errorMessage: 'Add proper parameter first!', status: false }); }
  } catch (e) { 
    console.error("Async Login Error:", e); // Log specific error
    res.status(400).json({ errorMessage: 'Something went wrong!', status: false }); 
  }
});

/* register api */
app.post("/register", async (req, res) => {
  try {
    // 1. Basic Input Validation
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({ errorMessage: 'Add proper parameter first!', status: false });
    }

    // 2. Check for Existing User (using async/await instead of callback)
    const existingUser = await user.findOne({ username: req.body.username });
    
    if (existingUser) { 
      return res.status(400).json({ errorMessage: `UserName ${req.body.username} Already Exist!`, status: false });
    }

    // 3. Hash the password securely (async version is better)
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    let newUser = new user({ 
      username: req.body.username, 
      password: hashedPassword 
    });
    
    // 4. Save User and Auto-Login (using async/await instead of callback)
    const savedUser = await newUser.save();
    
    // Generate token and log the user in immediately
    checkUserAndGenerateToken(savedUser, req, res); 
    
  } catch (e) { 
    console.error("Registration Error:", e);
    return res.status(400).json({ errorMessage: 'Something went wrong!', status: false }); 
  }
});


function checkUserAndGenerateToken(data, req, res) {
  jwt.sign({ user: data.username, id: data._id }, 'shhhhh11111', { expiresIn: '1d' }, (err, token) => {
    if (err) {
      res.status(400).json({
        status: false,
        errorMessage: err,
      });
    } else {
      res.json({
        message: 'Login Successfully.',
        token: token,
        status: true
      });
    }
  });
}
/* Api to add Course */
// Use upload.single() middleware to handle the file upload only when it's sent
app.post("/add-course", upload.single('syllabus_file'), (req, res) => {
  try {
    // Check if the request contains file data (FormData) or is pure JSON
    const isFileUpload = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
    
    // The body contains the form fields for both file and JSON submissions
    const requestBody = req.body;
    
    // --- Validation Checks ---
    if (!requestBody || !requestBody.class_name || !requestBody.class_name || !requestBody.subject_name || !requestBody.unit_title) {
      return res.status(400).json({
        errorMessage: 'Class, Subject, and Unit Title are required!',
        status: false
      });
    }

    // Secondary validation for content based on resource_type
    if (requestBody.resource_type === 'File' && !req.file) {
      return res.status(400).json({
        errorMessage: 'File upload failed or syllabus file is missing.',
        status: false
      });
    }
    if (requestBody.resource_type === 'Text' && (!requestBody.syllabus_text || requestBody.syllabus_text.trim() === '')) {
      return res.status(400).json({
        errorMessage: 'Syllabus content cannot be empty!',
        status: false
      });
    }
    // --- Create Final Data Payload ---
    const newCourseData = {
      class_name: requestBody.class_name,
      subject_name: requestBody.subject_name,
      unit_title: requestBody.unit_title,
      resource_type: requestBody.resource_type,
      user_id: req.user.id,
      
      // Conditional saving of syllabus content path/text
      syllabus_file_path: (requestBody.resource_type === 'File' && req.file) ? req.file.filename : null, // Save file name if file uploaded
      syllabus_text: requestBody.resource_type === 'Text' ? requestBody.syllabus_text : null, // Save text if text submitted
    };
    
    // --- Save to Database ---
    course.create(newCourseData, (err, data) => {
      if (err) {
        console.error("MongoDB save error:", err);
        return res.status(400).json({
          errorMessage: 'Failed to add course. Check server logs for details.',
          status: false
        });
      } else {
        res.status(200).json({
          status: true,
          title: 'Course added successfully.',
        });
      }
    });

  } catch (e) {
    console.error("Unexpected error:", e);
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});


/* Api to delete Course */
app.post("/delete-course", (req, res) => {
  try {
    if (req.body && req.body.id) {
      // 1. Find the course document before updating/deleting to get the file path
      course.findById(req.body.id, (err, courseToDelete) => {
        if (err || !courseToDelete) {
          return res.status(400).json({
            errorMessage: 'Course not found!',
            status: false
          });
        }
        
        // 2. Perform file cleanup if a file exists
        if (courseToDelete.resource_type === 'File' && courseToDelete.syllabus_file_path) {
          // Construct the full file path
          const filePath = path.join(__dirname, 'uploads', courseToDelete.syllabus_file_path);
          
          if (fs.existsSync(filePath)) {
            // Asynchronously delete the file from the server
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting old file:", unlinkErr);
            });
          }
        }
        
        // 3. Perform the soft delete in the database
        course.findByIdAndUpdate(req.body.id, { is_delete: true }, { new: true }, (dbErr, data) => {
          if (dbErr) {
            return res.status(400).json({
              errorMessage: dbErr,
              status: false
            });
          }

          res.status(200).json({
            status: true,
            title: 'Course deleted.'
          });
        });
      });
    } else {
      res.status(400).json({
        errorMessage: 'Add proper parameter first!',
        status: false
      });
    }
  } catch (e) {
    console.error("Unexpected error during course deletion:", e);
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});
/*Api to get and search product with pagination and search by name*/

app.get("/get-courses", (req, res) => {
  try {
    var query = {};
    query["$and"] = [];
    query["$and"].push({
      is_delete: false,
      user_id: req.user.id
    });
    if (req.query && req.query.search) {
      // The search now looks across class_name, subject_name, AND unit_title
      query["$and"].push({
        "$or": [
          { class_name: { $regex: req.query.search, $options: 'i' } },
          { subject_name: { $regex: req.query.search, $options: 'i' } },
          { unit_title: { $regex: req.query.search, $options: 'i' } } // NEW: Added Unit Title to search
        ]
      });
    }
    var perPage = 5;
    var page = req.query.page || 1;
    
    // The model name is changed to 'course' and ALL new fields are included in the projection
    course.find(query, { 
      date: 1, 
      class_name: 1, 
      subject_name: 1, 
      unit_title: 1, // NEW: Include Unit Title
      resource_type: 1, // NEW: Include resource type
      syllabus_file_path: 1, // NEW: Include file path
      syllabus_text: 1 // NEW: Include syllabus text
    })
      .skip((perPage * page) - perPage).limit(perPage)
      .then((data) => {
        // Corrected: Using countDocuments() instead of the deprecated count()
        course.countDocuments(query) 
          .then((count) => {

            if (data && data.length > 0) {
              res.status(200).json({
                status: true,
                title: 'Courses retrieved.',
                courses: data,
                current_page: page,
                total: count,
                pages: Math.ceil(count / perPage),
              });
            } else {
              res.status(400).json({
                errorMessage: 'There are no courses!',
                status: false
              });
            }

          });

      }).catch(err => {
        res.status(400).json({
          errorMessage: err.message || err,
          status: false
        });
      });
  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/* Api to get single course by ID */
app.get("/get-course-by-id/:id", (req, res) => {
  try {
    const courseId = req.params.id;
    
    course.findOne({ 
      _id: courseId, 
      user_id: req.user.id, 
      is_delete: false 
    }, (err, courseData) => {
      if (err) {
        return res.status(400).json({
          errorMessage: err.message || err,
          status: false
        });
      }

      if (!courseData) {
        return res.status(404).json({
          errorMessage: 'Course not found!',
          status: false
        });
      }

      res.status(200).json({
        status: true,
        course: courseData
      });
    });

  } catch (e) {
    res.status(400).json({
      errorMessage: 'Something went wrong!',
      status: false
    });
  }
});

/* API to search YouTube videos - REAL VERSION */
app.get("/search-videos/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const YOUTUBE_API_KEY = 'AIzaSyDFjBotODaBr7-N3tQWXbEpWX-WYE7_4yw'; // Replace with real key
    
    const axios = require('axios'); // Make sure axios is available in backend
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(searchQuery + ' tutorial')}&type=video&key=${YOUTUBE_API_KEY}`;
    
    const response = await axios.get(youtubeUrl);
    const videos = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url
    }));

    res.status(200).json({
      status: true,
      videos: videos
    });

  } catch (e) {
    console.error("YouTube search error:", e);
    res.status(400).json({
      errorMessage: 'Failed to search videos',
      status: false
    });
  }
});

app.listen(2000, () => {
  console.log("Server is Running On port 2000");
});
