import React, { Component } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';

import { withRouter } from "./utils"; // This must be present
import axios from 'axios';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      token: '',
      openCourseModal: false,
      openEditModal: false,
      id: '',
      class_name: '',
      subject_name: '',
      unit_title: '',       // NEW: To store the Unit Title/Number
      resource_type: 'File',// NEW: To toggle between File Upload and Text Input
      syllabus_file: null,  // NEW: To store the actual file object for upload
      syllabus_text: '',    // NEW: To store the typed syllabus content
      fileName: '',         // NEW: To display the file name to the user
      page: 1,
      search: '',
      courses: [],
      pages: 0,
      loading: false
    };
  }

  componentDidMount() {
    let token = localStorage.getItem("token");
    if (!token) {
      this.props.navigate("/login");
    } else {
      this.setState({ token: token }, () => {
        this.getCourseData();
      });
    }
  }

  // Add this method to your Dashboard class to prevent memory leaks
componentWillUnmount() {
  // Cancel any pending axios requests or timers here
  this.setState = () => {
    return;
  };
}
// ... rest of the class
// Corrected getCourseData function
getCourseData = () => {
  this.setState({ loading: true });

  let data = `?page=${this.state.page}`;
  if (this.state.search) {
    data += `&search=${this.state.search}`;
  }

  axios
    .get(`http://localhost:2000/get-courses${data}`, {
      headers: {
        token: this.state.token,
      },
    })
    .then((res) => {
      this.setState({
        loading: false,
        courses: res.data.courses,
        pages: res.data.pages,
      });
    })
    .catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Something went wrong",
        icon: "error",
      });
      this.setState({ loading: false, courses: [], pages: 0 });
    });
};
deleteCourse = (id) => {
  axios.post(
    "http://localhost:2000/delete-course",
    { id: id },
    {
      headers: {
        "Content-Type": "application/json",
        token: this.state.token,
      },
    }
  )
  .then((res) => {
    swal({
      text: res.data.title,
      icon: "success",
    });

    this.setState({ page: 1 }, () => {
      this.pageChange(null, 1);
    });
  })
  .catch((err) => {
    swal({
      text: err.response?.data?.errorMessage || "Something went wrong",
      icon: "error",
    });
  });
};

  pageChange = (e, page) => {
  this.setState({ page: page }, () => {
    this.getCourseData();
  });
};

logOut = () => {
  localStorage.setItem('token', null);
  this.props.navigate("/");
};

onChange = (e) => {
  const { name, value, files } = e.target;

  // 1. Handle File Upload (for Syllabus)
  if (name === 'syllabus_file' && files && files[0]) {
    this.setState({
      syllabus_file: files[0], // Store the file object itself
      fileName: files[0].name // Store the file name for display
    });
    return;
  }

  // 2. Handle Resource Type Switch (Clear the unused state when type is changed)
  if (name === 'resource_type') {
    // If switching type, clear the existing file/text content
    this.setState({
      resource_type: value,
      syllabus_file: null, // Clear file if switching to Text
      syllabus_text: '',   // Clear text if switching to File
      fileName: ''
    });
    return;
  }

  // 3. Handle all other inputs (class_name, subject_name, unit_title, syllabus_text, search)
  this.setState({ [name]: value }, () => {
    // 4. Handle search functionality
    if (name === 'search') {
      this.setState({ page: 1 }, () => {
        this.getCourseData();
      });
    }
  });
};
  addCourse = () => {
  const { 
    class_name, 
    subject_name, 
    unit_title, 
    resource_type, 
    syllabus_file, 
    syllabus_text 
  } = this.state;

  let requestData;
  let contentType;

  // 1. Determine the request type (File or Text) and format the data
  if (resource_type === 'File') {
    // A. Case: File Upload (using FormData)
    if (!syllabus_file) { // Check if a file is actually selected
      return swal({ text: 'Please select a syllabus file!', icon: 'warning' });
    }
    requestData = new FormData();
    requestData.append('class_name', class_name);
    requestData.append('subject_name', subject_name);
    requestData.append('unit_title', unit_title);
    requestData.append('resource_type', resource_type);
    requestData.append('syllabus_file', syllabus_file); // Append the actual file object
    contentType = 'multipart/form-data'; // Required for file uploads

  } else {
    // B. Case: Text Input (using JSON)
    if (!syllabus_text.trim()) { // Check if the text field is empty
      return swal({ text: 'Please enter syllabus content!', icon: 'warning' });
    }
    requestData = {
      class_name: class_name,
      subject_name: subject_name,
      unit_title: unit_title,
      resource_type: resource_type,
      syllabus_text: syllabus_text.trim(), // Send the text content
    };
    contentType = 'application/json'; // Required for JSON data
  }

  // 2. Perform the API Request
  axios.post('http://localhost:2000/add-course', requestData, {
    headers: {
      'Content-Type': contentType, // Use the determined Content-Type
      'token': this.state.token
    }
  }).then((res) => {
    swal({
      text: res.data.title,
      icon: 'success',
    });
    this.handleCourseClose();
    // Reset all new state fields after successful submission
    this.setState({ 
      class_name: '', 
      subject_name: '', 
      unit_title: '',
      syllabus_file: null,
      syllabus_text: '',
      fileName: '',
      page: 1 
    }, () => {
      this.getCourseData();
    });
  }).catch((err) => {
    swal({
      text: err.response?.data?.errorMessage || 'Something went wrong!', // Use optional chaining for better error handling
      icon: 'error',
    });
    this.handleCourseClose();
  });
};
updateCourse = () => {
  const { 
    id, // Keep the ID for update
    class_name, 
    subject_name, 
    unit_title, 
    resource_type, 
    syllabus_file, 
    syllabus_text 
  } = this.state;

  let requestData;
  let contentType;

  // 1. Determine the request type (File or Text) and format the data
  if (resource_type === 'File' && syllabus_file) {
    // A. Case: New File Upload (using FormData)
    // NOTE: We only send FormData if a NEW file is selected (syllabus_file is not null)
    requestData = new FormData();
    requestData.append('id', id); // Must include ID for update
    requestData.append('class_name', class_name);
    requestData.append('subject_name', subject_name);
    requestData.append('unit_title', unit_title);
    requestData.append('resource_type', resource_type);
    requestData.append('syllabus_file', syllabus_file); // Append the actual NEW file object
    contentType = 'multipart/form-data'; // Required for file uploads

  } else {
    // B. Case: Text Input OR No new file was selected (using JSON)
    requestData = {
      id: id,
      class_name: class_name,
      subject_name: subject_name,
      unit_title: unit_title,
      resource_type: resource_type,
      // If resource_type is Text, send the text. If it was File, these fields will remain
      syllabus_text: syllabus_text.trim(), 
    };
    contentType = 'application/json'; // Required for JSON data
  }

  // 2. Perform the API Request
  axios.post('http://localhost:2000/update-course', requestData, {
    headers: {
      'Content-Type': contentType, // Use the determined Content-Type
      'token': this.state.token
    }
  }).then((res) => {
    swal({
      text: res.data.title,
      icon: 'success',
    });
    this.handleCourseEditClose();
    // Reset fields after successful submission
    this.setState({ 
      class_name: '', 
      subject_name: '', 
      unit_title: '',
      syllabus_file: null,
      syllabus_text: '',
      fileName: '',
    }, () => {
      this.getCourseData();
    });
  }).catch((err) => {
    swal({
      text: err.response?.data?.errorMessage || 'Something went wrong!',
      icon: 'error',
    });
    this.handleCourseEditClose();
  });
};
  // This function opens the "add course" modal and resets the state
handleCourseOpen = () => {
    this.setState({
        openCourseModal: true,
        id: '',
        class_name: '',
        subject_name: '',
        unit_title: '',       // NEW: Reset Unit Title
        resource_type: 'File',// NEW: Reset Type to File
        syllabus_file: null,  // NEW: Reset File
        syllabus_text: '',    // NEW: Reset Text
        fileName: '',         // NEW: Reset File Name
    });
};

// This function closes the "add course" modal
handleCourseClose = () => {
    this.setState({ openCourseModal: false });
};

// This function opens the "edit course" modal and populates it with existing data
handleCourseEditOpen = (data) => {
    // Determine the resource source from the data
    const isFile = data.resource_type === 'File';

    this.setState({
        openEditModal: true,
        id: data._id,
        class_name: data.class_name,
        subject_name: data.subject_name,
        unit_title: data.unit_title,       // NEW: Populate Unit Title
        resource_type: data.resource_type, // NEW: Populate Resource Type
        
        // Populate the correct syllabus field based on the type
        syllabus_text: isFile ? '' : data.syllabus_text, 
        syllabus_file: isFile ? null : data.syllabus_file_path, // We will use this path to represent the existing file
        fileName: isFile ? data.syllabus_file_path : '', // Use the path for the filename display
        
        // Note: The 'data.description' field has been completely replaced and is not used.
    });
};

// This function closes the "edit course" modal
handleCourseEditClose = () => {
    this.setState({ openEditModal: false });
};

// This function closes the "edit course" modal
handleCourseEditClose = () => {
    this.setState({ 
        openEditModal: false,
        // Clear potential lingering data from the edit form
        unit_title: '',
        resource_type: 'File',
        syllabus_file: null,
        syllabus_text: '',
        fileName: '',
    });
};
  render() {
  return (
    <div>
      {this.state.loading && <LinearProgress size={40} />}
      <div className="no-printme">
        <h2>Dashboard</h2>
        <Button
          className="button_style"
          variant="contained"
          color="primary"
          size="small"
          onClick={this.handleCourseOpen}
        >
          Add Course
        </Button>
        <Button
          className="button_style"
          variant="contained"
          size="small"
          onClick={this.logOut}
        >
          Log Out
        </Button>
      </div>
        {/* Edit Course */}
{/* Edit Course */}
<Dialog
  open={this.state.openEditModal}
  onClose={this.handleCourseEditClose}
  aria-labelledby="alert-dialog-title"
  aria-describedby="alert-dialog-description"
>
  <DialogTitle id="alert-dialog-title">Edit Course</DialogTitle>
  <DialogContent>
    {/* 1. Class Name Field (No Change) */}
    <TextField
      id="edit-class-name"
      type="text"
      autoComplete="off"
      name="class_name"
      value={this.state.class_name}
      onChange={this.onChange}
      placeholder="Class Name"
      required
    /><br />

    {/* 2. Subject Name Field (No Change) */}
    <TextField
      id="edit-subject-name"
      type="text"
      autoComplete="off"
      name="subject_name"
      value={this.state.subject_name}
      onChange={this.onChange}
      placeholder="Subject Name"
      required
    /><br />

    {/* 3. NEW: Unit Title Field */}
    <TextField
      id="edit-unit-title"
      type="text"
      autoComplete="off"
      name="unit_title"
      value={this.state.unit_title}
      onChange={this.onChange}
      placeholder="Unit Title/Number"
      required
    /><br />

    {/* 4. Syllabus Type Selector (File or Text) */}
    <select
      name="resource_type"
      value={this.state.resource_type}
      onChange={this.onChange}
      style={{ marginTop: '15px', width: '100%', padding: '10px' }}
    >
      <option value="File">Upload Syllabus File</option>
      <option value="Text">Type Syllabus Content</option>
    </select>
    <br /><br />

    {/* 5. CONDITIONAL INPUT: File Upload or Text Area */}
    {this.state.resource_type === 'File' ? (
      <>
        <Button
          variant="contained"
          component="label"
        > Upload New Syllabus
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            name="syllabus_file"
            onChange={this.onChange}
            hidden
          />
        </Button>
        &nbsp;
        {this.state.fileName || "No file selected"}
        <div style={{ marginTop: '5px', fontSize: '12px', color: 'gray' }}>
          *Uploading a new file will replace the existing one.
        </div>
      </>
    ) : (
      <TextField
        id="edit-syllabus-text"
        type="text"
        autoComplete="off"
        name="syllabus_text"
        value={this.state.syllabus_text}
        onChange={this.onChange}
        placeholder="Type Syllabus Content Here..."
        multiline
        rows={4}
        fullWidth
        required
      />
    )}

  </DialogContent>
{/* ... rest of the dialog (DialogActions) ... */}

  <DialogActions>
  <Button onClick={this.handleCourseEditClose} color="primary">
    Cancel
  </Button>
  <Button
    disabled={
      this.state.class_name === '' ||
      this.state.subject_name === '' ||
      this.state.unit_title === '' || // Check the new Unit Title field
      (this.state.resource_type === 'File' && !this.state.syllabus_file && !this.state.fileName) || // Check if File is selected but no file or old file path exists
      (this.state.resource_type === 'Text' && this.state.syllabus_text.trim() === '') // Check if Text is selected but the text area is empty
    }
    onClick={(e) => this.updateCourse()}
    color="primary"
    autoFocus
  >
    Edit Course
  </Button>
</DialogActions>
</Dialog>

{/* Add Course */}
<Dialog
  open={this.state.openCourseModal}
  onClose={this.handleCourseClose}
  aria-labelledby="alert-dialog-title"
  aria-describedby="alert-dialog-description"
>
  <DialogTitle id="alert-dialog-title">Add Course</DialogTitle>
  <DialogContent>
    {/* 1. Class Name Field (No Change) */}
    <TextField
      id="add-class-name"
      type="text"
      autoComplete="off"
      name="class_name"
      value={this.state.class_name}
      onChange={this.onChange}
      placeholder="Class Name"
      required
    /><br />

    {/* 2. Subject Name Field (No Change) */}
    <TextField
      id="add-subject-name"
      type="text"
      autoComplete="off"
      name="subject_name"
      value={this.state.subject_name}
      onChange={this.onChange}
      placeholder="Subject Name"
      required
    /><br />

    {/* 3. NEW: Unit Title Field */}
    <TextField
      id="add-unit-title"
      type="text"
      autoComplete="off"
      name="unit_title"
      value={this.state.unit_title}
      onChange={this.onChange}
      placeholder="Unit Title/Number (e.g., Unit 1)"
      required
    /><br />

    {/* 4. Syllabus Type Selector (File or Text) */}
    <select
      name="resource_type"
      value={this.state.resource_type}
      onChange={this.onChange}
      style={{ marginTop: '15px', width: '100%', padding: '10px' }}
    >
      <option value="File">Upload Syllabus File</option>
      <option value="Text">Type Syllabus Content</option>
    </select>
    <br /><br />

    {/* 5. CONDITIONAL INPUT: File Upload or Text Area */}
    {this.state.resource_type === 'File' ? (
      <>
        <Button
          variant="contained"
          component="label"
        > Upload Syllabus
          <input
            type="file"
            accept=".pdf,.doc,.docx" // Restrict to common document types
            name="syllabus_file"
            onChange={this.onChange}
            hidden
            required
          />
        </Button>
        &nbsp;
        {this.state.fileName || "No file selected"}
      </>
    ) : (
      <TextField
        id="add-syllabus-text"
        type="text"
        autoComplete="off"
        name="syllabus_text"
        value={this.state.syllabus_text}
        onChange={this.onChange}
        placeholder="Type Syllabus Content Here..."
        multiline
        rows={4}
        fullWidth
        required
      />
    )}

  </DialogContent>
  <DialogActions>
  <Button onClick={this.handleCourseClose} color="primary">
    Cancel
  </Button>
  <Button
    disabled={
      this.state.class_name === '' ||
      this.state.subject_name === '' ||
      this.state.unit_title === '' || // Check the new Unit Title field
      (this.state.resource_type === 'File' && !this.state.syllabus_file) || // Check if File is selected but no file is attached
      (this.state.resource_type === 'Text' && this.state.syllabus_text.trim() === '') // Check if Text is selected but text area is empty
    }
    onClick={(e) => this.addCourse()}
    color="primary"
    autoFocus
  >
    Add Course
  </Button>
</DialogActions>
</Dialog>
        <br />
<TableContainer>
  <TextField
    id="standard-basic"
    className="no-printme"
    type="search"
    autoComplete="off"
    name="search"
    value={this.state.search}
    onChange={this.onChange}
    placeholder="Search by class, subject, or unit"
    style={{width:'190px'}}
    required
  />
  {/* The "Print product details" button has been removed */}
  <Table aria-label="simple table">
  <TableHead>
    <TableRow>
      <TableCell align="center">Class</TableCell>
      <TableCell align="center">Subject</TableCell>
      <TableCell align="center">Unit</TableCell>
      <TableCell align="center">Syllabus Content</TableCell>
      <TableCell align="center" className="no-printme">Action</TableCell>
    </TableRow>
  </TableHead>
            <TableBody>
  {this.state.courses.map((row) => (
    <TableRow key={row._id}>
      {/* 1. Class Name */}
      <TableCell align="center" component="th" scope="row">
        {row.class_name}
      </TableCell>
      
      {/* 2. Subject Name */}
      <TableCell align="center">{row.subject_name}</TableCell>
      
      {/* 3. NEW: Unit Title */}
      <TableCell align="center">{row.unit_title}</TableCell>
      
      {/* 4. Syllabus Content (Conditional Display) */}
      <TableCell align="center">
  {row.resource_type === 'File' ? (
    // If it's a file, display a link to download/view the file
    <a href={`http://localhost:2000/${row.syllabus_file_path}`} target="_blank" rel="noopener noreferrer">
      View Syllabus ({row.syllabus_file_path ? row.syllabus_file_path.split('.').pop().toUpperCase() : 'FILE'})
    </a>
  ) : (
    // If it's text, display a preview or the text itself (with null check)
    <span title={row.syllabus_text || ''}>
      {row.syllabus_text ? `${row.syllabus_text.substring(0, 30)}... (Text Preview)` : 'No content'}
    </span>
  )}
</TableCell>
      
      {/* 5. Action Buttons */}
      <TableCell align="center">
        <Button
          className="button_style no-printme"
          variant="outlined"
          color="primary"
          size="small"
          onClick={(e) => this.handleCourseEditOpen(row)}
        >
          Edit
        </Button>
                    <Button
  className="button_style no-printme"
  variant="outlined"
  color="secondary"
  size="small"
  onClick={(e) => this.deleteCourse(row._id)}
>
  Delete
</Button>
<Button
    className="button_style no-printme"
    variant="outlined"
    color="default"
    size="small"
    onClick={() => this.props.navigate(`/course-detail/${row._id}`)}
  >
    View Resources
  </Button>
</TableCell> {/* <-- CORRECTED: Closing the TableCell for Action buttons */}
</TableRow>
))}
</TableBody>
</Table>
<br />
<Pagination className="no-printme" count={this.state.pages} page={this.state.page} onChange={this.pageChange} color="primary" />
</TableContainer>

</div>
);
}
}
// In Dashboard.js:
export default withRouter(Dashboard);
