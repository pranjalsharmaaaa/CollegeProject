import React, { Component } from 'react';
import { 
  Typography, Card, CardContent, Grid, Button, LinearProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@material-ui/core';
import { withRouter } from "./utils";
import axios from 'axios';
import swal from 'sweetalert';

class StudentDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      courses: [],
      loading: true,
      token: localStorage.getItem("token"),
      showCodeDialog: false,
      selectedCourseId: null,
      selectedCourseName: '',
      classCode: '',
      verifyingCode: false
    };
  }

  componentDidMount() {
    if (!this.state.token) {
      this.props.navigate("/login");
    } else {
      this.getAvailableCourses();
    }
  }

  getAvailableCourses = () => {
    this.setState({ loading: true });

    axios.get('http://localhost:2000/student/available-courses', {
      headers: {
        token: this.state.token
      }
    })
    .then((res) => {
      this.setState({
        loading: false,
        courses: res.data.courses || []
      });
    })
    .catch((err) => {
      this.setState({ loading: false });
      swal({
        text: err.response?.data?.errorMessage || "Failed to load courses",
        icon: "error"
      });
    });
  };

  handleAccessCourse = (courseId, courseName) => {
    this.setState({
      showCodeDialog: true,
      selectedCourseId: courseId,
      selectedCourseName: courseName,
      classCode: ''
    });
  };

  handleCloseDialog = () => {
    this.setState({
      showCodeDialog: false,
      selectedCourseId: null,
      selectedCourseName: '',
      classCode: '',
      verifyingCode: false
    });
  };

  verifyClassCode = () => {
    const { classCode, selectedCourseId } = this.state;

    if (!classCode.trim()) {
      swal({
        text: "Please enter a class code",
        icon: "warning"
      });
      return;
    }

    this.setState({ verifyingCode: true });

    axios.post('http://localhost:2000/student/verify-class-code', 
      {
        courseId: selectedCourseId,
        classCode: classCode.trim()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          token: this.state.token
        }
      }
    )
    .then((res) => {
      this.setState({ verifyingCode: false });
      
      // Store course access info
      localStorage.setItem('accessedCourse', JSON.stringify(res.data.course));
      
      this.handleCloseDialog();
      
      swal({
        text: "Access granted! Redirecting to course...",
        icon: "success"
      }).then(() => {
        this.props.navigate('/student-course-view', { 
          state: { course: res.data.course } 
        });
      });
    })
    .catch((err) => {
      this.setState({ verifyingCode: false });
      swal({
        text: err.response?.data?.errorMessage || "Failed to verify class code",
        icon: "error"
      });
    });
  };

  handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentCourseId');
    localStorage.removeItem('selectedVideos');
    localStorage.removeItem('accessedCourse');
    localStorage.removeItem('userRole');
    this.props.navigate('/login');
  };

  render() {
    const { courses, loading, showCodeDialog, selectedCourseName, classCode, verifyingCode } = this.state;

    if (loading) {
      return <LinearProgress />;
    }

    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <Typography variant="h4" gutterBottom>
              Student Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Browse available courses and enter class code to access
            </Typography>
          </div>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={this.handleLogout}
          >
            Logout
          </Button>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No courses available at the moment. Please check back later!
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent style={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom style={{ color: '#3f51b5' }}>
                      {course.class_name}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Subject:</strong> {course.subject_name}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Unit:</strong> {course.unit_title}
                    </Typography>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Teacher:</strong> {course.user_id?.username || 'Unknown'}
                    </Typography>
                    
                    <Typography variant="caption" color="textSecondary">
                      <strong>Type:</strong> {course.resource_type === 'File' ? 'Syllabus File' : 'Text Content'}
                    </Typography>
                  </CardContent>

                  <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      onClick={() => this.handleAccessCourse(
                        course._id, 
                        `${course.class_name} - ${course.subject_name}`
                      )}
                    >
                      Access Course
                    </Button>
                  </div>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Class Code Dialog */}
        <Dialog
          open={showCodeDialog}
          onClose={this.handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Enter Class Code</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: '20px' }}>
              Your teacher has shared a class code with you. Enter it to access the course:
            </Typography>
            
            <Typography variant="body1" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              {selectedCourseName}
            </Typography>

            <TextField
              autoFocus
              margin="dense"
              label="Class Code"
              placeholder="e.g., ABC123"
              fullWidth
              value={classCode}
              onChange={(e) => this.setState({ classCode: e.target.value.toUpperCase() })}
              disabled={verifyingCode}
              variant="outlined"
              style={{ marginTop: '20px' }}
            />

            <Typography variant="caption" color="textSecondary" style={{ marginTop: '15px', display: 'block' }}>
              The class code is provided by your teacher and is case-insensitive.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={this.handleCloseDialog} disabled={verifyingCode}>
              Cancel
            </Button>
            <Button 
              onClick={this.verifyClassCode} 
              color="primary" 
              variant="contained"
              disabled={verifyingCode || !classCode.trim()}
            >
              {verifyingCode ? 'Verifying...' : 'Verify Code'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default withRouter(StudentDashboard);
