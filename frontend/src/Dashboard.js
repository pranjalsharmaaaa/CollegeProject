import React, { Component } from 'react';
import {
  Button, TextField, Dialog, DialogActions, LinearProgress,
  DialogTitle, DialogContent, TableBody, Table,
  TableContainer, TableHead, TableRow, TableCell, Typography
} from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import swal from 'sweetalert';
import { withRouter } from "./utils";
import axios from 'axios';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      token: '',
      openCourseModal: false,
      openEditModal: false,
      showFullTextModal: false, // NEW: For showing full text
      selectedFullText: '', // NEW: Store selected text
      
      id: '',
      class_name: '',
      subject_name: '',
      unit_title: '',
      resource_type: 'File',
      syllabus_file: null,
      syllabus_text: '',
      fileName: '',
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

  componentWillUnmount() {
    this.setState = () => {
      return;
    };
  }

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

  // NEW: Functions to handle full text modal
  handleShowFullText = (text) => {
    this.setState({
      showFullTextModal: true,
      selectedFullText: text
    });
  };

  handleCloseFullText = () => {
    this.setState({
      showFullTextModal: false,
      selectedFullText: ''
    });
  };

 
handleCloseCodeDialog = () => {
  this.setState({ showClassCodeDialog: false });
};

  onChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'syllabus_file' && files && files[0]) {
      this.setState({
        syllabus_file: files[0],
        fileName: files[0].name
      });
      return;
    }

    if (name === 'resource_type') {
      this.setState({
        resource_type: value,
        syllabus_file: null,
        syllabus_text: '',
        fileName: ''
      });
      return;
    }

    this.setState({ [name]: value }, () => {
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

    if (resource_type === 'File') {
      if (!syllabus_file) {
        return swal({ text: 'Please select a syllabus file!', icon: 'warning' });
      }
      requestData = new FormData();
      requestData.append('class_name', class_name);
      requestData.append('subject_name', subject_name);
      requestData.append('unit_title', unit_title);
      requestData.append('resource_type', resource_type);
      requestData.append('syllabus_file', syllabus_file);
      contentType = 'multipart/form-data';

    } else {
      if (!syllabus_text.trim()) {
        return swal({ text: 'Please enter syllabus content!', icon: 'warning' });
      }
      requestData = {
        class_name: class_name,
        subject_name: subject_name,
        unit_title: unit_title,
        resource_type: resource_type,
        syllabus_text: syllabus_text.trim(),
      };
      contentType = 'application/json';
    }

    axios.post('http://localhost:2000/add-course', requestData, {
      headers: {
        'Content-Type': contentType,
        'token': this.state.token
      }
    }).then((res) => {
      swal({
        text: res.data.title,
        icon: 'success',
      });
      this.handleCourseClose();
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
        text: err.response?.data?.errorMessage || 'Something went wrong!',
        icon: 'error',
      });
      this.handleCourseClose();
    });
  };

  updateCourse = () => {
    const { 
      id,
      class_name, 
      subject_name, 
      unit_title, 
      resource_type, 
      syllabus_file, 
      syllabus_text 
    } = this.state;

    let requestData;
    let contentType;

    if (resource_type === 'File' && syllabus_file) {
      requestData = new FormData();
      requestData.append('id', id);
      requestData.append('class_name', class_name);
      requestData.append('subject_name', subject_name);
      requestData.append('unit_title', unit_title);
      requestData.append('resource_type', resource_type);
      requestData.append('syllabus_file', syllabus_file);
      contentType = 'multipart/form-data';

    } else {
      requestData = {
        id: id,
        class_name: class_name,
        subject_name: subject_name,
        unit_title: unit_title,
        resource_type: resource_type,
        syllabus_text: syllabus_text.trim(), 
      };
      contentType = 'application/json';
    }

    axios.post('http://localhost:2000/update-course', requestData, {
      headers: {
        'Content-Type': contentType,
        'token': this.state.token
      }
    }).then((res) => {
      swal({
        text: res.data.title,
        icon: 'success',
      });
      this.handleCourseEditClose();
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

  handleCourseOpen = () => {
    this.setState({
      openCourseModal: true,
      id: '',
      class_name: '',
      subject_name: '',
      unit_title: '',
      resource_type: 'File',
      syllabus_file: null,
      syllabus_text: '',
      fileName: '',
    });
  };

  handleCourseClose = () => {
    this.setState({ openCourseModal: false });
  };

  handleCourseEditOpen = (data) => {
    const isFile = data.resource_type === 'File';

    this.setState({
      openEditModal: true,
      id: data._id,
      class_name: data.class_name,
      subject_name: data.subject_name,
      unit_title: data.unit_title,
      resource_type: data.resource_type,
      syllabus_text: isFile ? '' : data.syllabus_text, 
      syllabus_file: isFile ? null : data.syllabus_file_path,
      fileName: isFile ? data.syllabus_file_path : '',
    });
  };

  handleCourseEditClose = () => {
    this.setState({ 
      openEditModal: false,
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

        {/* Edit Course Dialog */}
        <Dialog
          open={this.state.openEditModal}
          onClose={this.handleCourseEditClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Edit Course</DialogTitle>
          <DialogContent>
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

            {this.state.resource_type === 'File' ? (
              <>
                <Button
                  variant="contained"
                  component="label"
                >
                  Upload New Syllabus
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

          <DialogActions>
            <Button onClick={this.handleCourseEditClose} color="primary">
              Cancel
            </Button>
            <Button
              disabled={
                this.state.class_name === '' ||
                this.state.subject_name === '' ||
                this.state.unit_title === '' ||
                (this.state.resource_type === 'File' && !this.state.syllabus_file && !this.state.fileName) ||
                (this.state.resource_type === 'Text' && this.state.syllabus_text.trim() === '')
              }
              onClick={(e) => this.updateCourse()}
              color="primary"
              autoFocus
            >
              Edit Course
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Course Dialog */}
        <Dialog
          open={this.state.openCourseModal}
          onClose={this.handleCourseClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Add Course</DialogTitle>
          <DialogContent>
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

            {this.state.resource_type === 'File' ? (
              <>
                <Button
                  variant="contained"
                  component="label"
                >
                  Upload Syllabus
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
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
                this.state.unit_title === '' ||
                (this.state.resource_type === 'File' && !this.state.syllabus_file) ||
                (this.state.resource_type === 'Text' && this.state.syllabus_text.trim() === '')
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

        {/* Course Table */}
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
                  <TableCell align="center" component="th" scope="row">
                    {row.class_name}
                  </TableCell>
                  
                  <TableCell align="center">{row.subject_name}</TableCell>
                  
                  <TableCell align="center">{row.unit_title}</TableCell>
                  
                  {/* NEW: Updated Syllabus Content with clickable preview */}
                  <TableCell align="center">
                    {row.resource_type === 'File' ? (
                      <a href={`http://localhost:2000/${row.syllabus_file_path}`} target="_blank" rel="noopener noreferrer">
                        View Syllabus ({row.syllabus_file_path ? row.syllabus_file_path.split('.').pop().toUpperCase() : 'FILE'})
                      </a>
                    ) : (
                      <span 
                        onClick={() => this.handleShowFullText(row.syllabus_text)}
                        style={{ 
                          cursor: 'pointer', 
                          color: '#3f51b5', 
                          textDecoration: 'underline' 
                        }}
                      >
                        {row.syllabus_text ? `${row.syllabus_text.substring(0, 30)}... (Click to view full)` : 'No content'}
                      </span>
                    )}
                  </TableCell>
                  
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <br />
          <Pagination 
            className="no-printme" 
            count={this.state.pages} 
            page={this.state.page} 
            onChange={this.pageChange} 
            color="primary" 
          />
        </TableContainer>

        {/* NEW: Full Text Modal */}
        <Dialog 
          open={this.state.showFullTextModal} 
          onClose={this.handleCloseFullText}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Full Syllabus Content</DialogTitle>
          <DialogContent>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.selectedFullText}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseFullText} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        

      


      </div>
    );
  }
}

export default withRouter(Dashboard);
