import React, { Component } from 'react';
import { 
  Typography, Card, CardContent, Grid, Button, LinearProgress, 
  List, ListItem, ListItemText, Divider, Chip
} from '@material-ui/core';
import { withRouter } from "./utils";
import swal from 'sweetalert';

class StudentCourseView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      course: null,
      loading: true,
      token: localStorage.getItem("token")
    };
  }

  componentDidMount() {
    // Get course from navigation state or localStorage
    const courseFromNav = this.props.location?.state?.course;
    const courseFromStorage = JSON.parse(localStorage.getItem('accessedCourse') || 'null');
    
    const course = courseFromNav || courseFromStorage;

    if (!course) {
      swal({
        text: "No course access. Please enter a class code first.",
        icon: "error"
      }).then(() => {
        this.props.navigate('/student-dashboard');
      });
      return;
    }

    this.setState({
      course: course,
      loading: false
    });
  }

  goBack = () => {
    this.props.navigate('/student/dashboard');
  };

  parseTopicsFromSyllabus = (syllabusText) => {
    if (!syllabusText) return [];
    
    const topics = syllabusText
      .split(/[\n,]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 3 && !topic.toLowerCase().startsWith('unit'))
      .slice(0, 10);
      
    return topics;
  };

  render() {
    const { course, loading } = this.state;

    if (loading) {
      return <LinearProgress />;
    }

    if (!course) {
      return <div>Course not found</div>;
    }

    const topics = this.parseTopicsFromSyllabus(course.syllabus_text);

    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Button variant="outlined" onClick={this.goBack}>
            ← Back to Dashboard
          </Button>
        </div>

        <Grid container spacing={3}>
          {/* Left Sidebar - Course Info */}
          <Grid item xs={12} md={3}>
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom style={{ color: '#3f51b5' }}>
                  Course Info
                </Typography>
                <Divider style={{ marginBottom: '15px' }} />
                
                <Typography variant="body2" gutterBottom>
                  <strong>Class:</strong> {course.class_name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Subject:</strong> {course.subject_name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Unit:</strong> {course.unit_title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Teacher:</strong> {course.teacher || 'Unknown'}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom style={{ color: '#3f51b5' }}>
                  Topics
                </Typography>
                <Divider style={{ marginBottom: '15px' }} />
                
                <List component="nav" style={{ padding: 0 }}>
                  {topics.length > 0 ? (
                    topics.map((topic, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText 
                            primary={`${index + 1}. ${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`}
                          />
                        </ListItem>
                        {index < topics.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No topics available
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Content - Syllabus and Resources */}
          <Grid item xs={12} md={9}>
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.class_name} - {course.subject_name}
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Unit: {course.unit_title}
                </Typography>
                <Chip 
                  label={`Type: ${course.resource_type === 'File' ? 'Syllabus File' : 'Text Content'}`}
                  color="primary"
                  style={{ marginTop: '10px' }}
                />
              </CardContent>
            </Card>

            {/* Syllabus Section */}
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom style={{ marginBottom: '15px' }}>
                  Course Syllabus
                </Typography>

                {course.resource_type === 'File' ? (
                  <Button
                    variant="contained"
                    color="primary"
                    href={`http://localhost:2000/${course.syllabus_file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Syllabus File
                  </Button>
                ) : (
                  <Card variant="outlined" style={{ padding: '15px', backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                      {course.syllabus_text || 'No syllabus content available'}
                    </Typography>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Video Resources Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Video Resources
                </Typography>
                <Divider style={{ marginBottom: '15px' }} />

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Your teacher will add recommended videos and resources for each topic. 
                  Check back soon for video links and learning materials.
                </Typography>

                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Video resources will appear here
                  </Typography>
                </div>
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Card style={{ marginTop: '20px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Notes &amp; Materials
                </Typography>
                <Divider style={{ marginBottom: '15px' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" style={{ padding: '20px', textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom>
                        📚
                      </Typography>
                      <Typography variant="body2">
                        Lecture Notes
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Coming soon
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" style={{ padding: '20px', textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom>
                        📝
                      </Typography>
                      <Typography variant="body2">
                        Assignments
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Coming soon
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default withRouter(StudentCourseView);
