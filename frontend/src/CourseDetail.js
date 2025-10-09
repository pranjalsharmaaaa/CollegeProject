import React, { Component } from 'react';
import { 
  Typography, Card, CardContent, Grid, Button, LinearProgress, 
  List, ListItem, ListItemText, Divider, ButtonGroup, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip
} from '@material-ui/core';
import { withRouter } from "./utils";
import axios from 'axios';
import swal from 'sweetalert';

class CourseDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      course: null,
      loading: true,
      token: localStorage.getItem("token"),
      recommendedVideos: [],
      loadingVideos: false,
      selectedTopic: null,
      videoFilter: 'all',
      selectedVideos: JSON.parse(localStorage.getItem('selectedVideos') || '[]'),
      showAddTopicDialog: false,
      newTopicName: '',
      subtopics: []
    };
  }

  componentDidMount() {
    const urlParts = window.location.pathname.split('/');
    const courseId = urlParts[urlParts.length - 1]; 
    
    if (!this.state.token) {
      this.props.navigate("/login");
    } else {
      this.getCourseDetail(courseId);
    }
  }

  getCourseDetail = (id) => {
    this.setState({ loading: true });

    axios.get(`http://localhost:2000/get-course-by-id/${id}`, { 
      headers: {
        token: this.state.token,
      },
    })
    .then((res) => {
      const courseData = res.data.course;
      this.setState({
        loading: false,
        course: courseData,
      });

      const defaultTopic = this.parseTopicsFromSyllabus(courseData.syllabus_text)[0];
      if (defaultTopic) {
        this.handleTopicSelect(defaultTopic);
      } else {
        this.getYouTubeRecommendations(`${courseData.subject_name} ${courseData.unit_title}`);
      }
    })
    .catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Failed to load course details.",
        icon: "error",
      });
      this.setState({ loading: false });
      this.props.navigate("/dashboard");
    });
  };

  getYouTubeRecommendations = (topicQuery) => {
    this.setState({ loadingVideos: true, recommendedVideos: [] });
    
    axios.get(`http://localhost:2000/search-videos/${encodeURIComponent(topicQuery)}`, {
      headers: {
        token: this.state.token,
      },
    })
    .then(response => {
      const videosWithPricing = response.data.videos.map((video) => ({
        ...video,
        isPaid: false,
        price: 'Free'
      }));

      this.setState({
        recommendedVideos: videosWithPricing,
        loadingVideos: false
      });
    })
    .catch(error => {
      console.error('YouTube API error:', error.response?.data || error.message);
      this.setState({ loadingVideos: false });
    });
  };

  handleTopicSelect = (topic) => {
    this.setState({ selectedTopic: topic });
    this.getYouTubeRecommendations(topic);
  }

  handleVideoFilter = (filter) => {
    this.setState({ videoFilter: filter });
  }

  toggleVideoSelection = (video) => {
    const { selectedVideos, selectedTopic } = this.state;
    const isSelected = selectedVideos.some(v => v.videoId === video.videoId);
    
    let updatedVideos;
    if (isSelected) {
      updatedVideos = selectedVideos.filter(v => v.videoId !== video.videoId);
      swal({ text: 'Video removed from selection', icon: 'info' });
    } else {
      updatedVideos = [...selectedVideos, { ...video, topic: selectedTopic }];
      swal({ text: 'Video added to selection', icon: 'success' });
    }
    
    this.setState({ selectedVideos: updatedVideos });
    localStorage.setItem('selectedVideos', JSON.stringify(updatedVideos));
  }

  handleAddTopic = () => {
    this.setState({ showAddTopicDialog: true });
  }

  saveNewTopic = () => {
    const { newTopicName, subtopics } = this.state;
    if (newTopicName.trim()) {
      this.setState({
        subtopics: [...subtopics, newTopicName.trim()],
        newTopicName: '',
        showAddTopicDialog: false
      });
      swal({ text: 'Subtopic added successfully!', icon: 'success' });
    }
  }

  viewSelectedVideos = () => {
    this.props.navigate('/selected-videos');
  }

  goBack = () => {
    this.props.navigate("/dashboard");
  };

  parseTopicsFromSyllabus = (syllabusText) => {
    if (!syllabusText) return [];
    
    const topics = syllabusText
      .split(/[\n,]/)
      .map(topic => topic.trim())
      .filter(topic => topic.length > 3 && !topic.toLowerCase().startsWith('unit'))
      .slice(0, 20);
      
    return topics;
  };

  getFilteredVideos = () => {
    const { recommendedVideos, videoFilter } = this.state;
    
    switch(videoFilter) {
      case 'free':
        return recommendedVideos.filter(video => !video.isPaid);
      case 'paid':
        return recommendedVideos.filter(video => video.isPaid);
      default:
        return recommendedVideos;
    }
  }

  render() {
    const { 
      course, loading, loadingVideos, selectedTopic, videoFilter, 
      selectedVideos, showAddTopicDialog, newTopicName, subtopics 
    } = this.state;

    if (loading) {
      return <LinearProgress />;
    }

    if (!course) {
      return <div>Course not found</div>;
    }

    const topics = this.parseTopicsFromSyllabus(course.syllabus_text);
    const displayTopicTitle = selectedTopic || `${course.subject_name} Overview`;
    const filteredVideos = this.getFilteredVideos();

    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Button variant="outlined" onClick={this.goBack}>
            ← Back to Dashboard
          </Button>
          
          <div>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={this.viewSelectedVideos}
            >
              Selected Videos ({selectedVideos.length})
            </Button>
          </div>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom style={{ color: '#3f51b5' }}>
                    Your Syllabus Topics
                  </Typography>
                  <Button 
                    size="small" 
                    color="primary" 
                    onClick={this.handleAddTopic}
                  >
                    + Add
                  </Button>
                </div>
                
                <List component="nav">
                  {topics.map((topic, index) => (
                    <React.Fragment key={index}>
                      <ListItem 
                        button 
                        onClick={() => this.handleTopicSelect(topic)}
                        selected={selectedTopic === topic}
                      >
                        <ListItemText 
                          primary={`${index + 1}. ${topic.substring(0, 50)}${topic.length > 50 ? '...' : ''}`}
                        />
                      </ListItem>
                      {index < topics.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  
                  {subtopics.map((subtopic, index) => (
                    <React.Fragment key={`sub-${index}`}>
                      <ListItem button onClick={() => this.handleTopicSelect(subtopic)}>
                        <ListItemText 
                          primary={`${topics.length + index + 1}. ${subtopic}`}
                          style={{ paddingLeft: '16px' }}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  
                  {topics.length === 0 && subtopics.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No topics found. Click "Add" to add subtopics.
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={9}>
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.class_name} - {course.subject_name}
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Unit: {course.unit_title} | **Viewing: {displayTopicTitle}**
                </Typography>
              </CardContent>
            </Card>

            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h6" style={{ marginBottom: '10px' }}>
                  Syllabus File/Content
                </Typography>

                {course.resource_type === 'File' ? (
                  <Button
                    variant="contained"
                    color="primary"
                    href={`http://localhost:2000/${course.syllabus_file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Syllabus File
                  </Button>
                ) : (
                  <Card variant="outlined" style={{ padding: '15px' }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {course.syllabus_text || 'No content available'}
                    </Typography>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <Typography variant="h6" style={{ color: '#f44336' }}>
                    Recommended Videos for: {displayTopicTitle}
                  </Typography>
                  
                  <ButtonGroup variant="outlined" size="small">
                    <Button 
                      color={videoFilter === 'all' ? 'primary' : 'default'}
                      onClick={() => this.handleVideoFilter('all')}
                    >
                      All ({this.state.recommendedVideos.length})
                    </Button>
                    <Button 
                      color={videoFilter === 'free' ? 'primary' : 'default'}
                      onClick={() => this.handleVideoFilter('free')}
                    >
                      Free ({this.state.recommendedVideos.filter(v => !v.isPaid).length})
                    </Button>
                    <Button 
                      color={videoFilter === 'paid' ? 'primary' : 'default'}
                      onClick={() => this.handleVideoFilter('paid')}
                    >
                      Paid ({this.state.recommendedVideos.filter(v => v.isPaid).length})
                    </Button>
                  </ButtonGroup>
                </div>
                
                {loadingVideos ? (
                  <LinearProgress />
                ) : (
                  <Grid container spacing={2}>
                    {filteredVideos.length > 0 ? (
                      filteredVideos.map((video) => (
                        <Grid item xs={12} sm={6} md={4} key={video.videoId}>
                          <Card variant="outlined">
                            <CardContent>
                              <div style={{ position: 'relative' }}>
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                />
                                <Chip 
                                  label={video.price} 
                                  color={video.isPaid ? 'secondary' : 'primary'}
                                  size="small"
                                  style={{ 
                                    position: 'absolute', 
                                    top: '8px', 
                                    right: '8px',
                                    backgroundColor: video.isPaid ? '#f44336' : '#4caf50',
                                    color: 'white'
                                  }}
                                />
                              </div>
                              
                              <Typography variant="subtitle2" gutterBottom style={{ 
                                marginTop: '8px', 
                                height: '40px', 
                                overflow: 'hidden' 
                              }}>
                                {video.title}
                              </Typography>
                              
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <Button 
                                  size="small" 
                                  color="primary"
                                  variant="contained"
                                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                  target="_blank"
                                >
                                  Watch Now
                                </Button>
                                
                                <Button 
                                  size="small" 
                                  variant="outlined"
                                  color={selectedVideos.some(v => v.videoId === video.videoId) ? 'secondary' : 'primary'}
                                  onClick={() => this.toggleVideoSelection(video)}
                                >
                                  {selectedVideos.some(v => v.videoId === video.videoId) ? 'Selected ✓' : 'Select Video'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    ) : (
                      <Typography variant="body1" color="textSecondary" style={{ paddingLeft: '16px' }}>
                        No videos found for this filter.
                      </Typography>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={showAddTopicDialog} onClose={() => this.setState({ showAddTopicDialog: false })}>
          <DialogTitle>Add New Subtopic</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Subtopic Name"
              fullWidth
              value={newTopicName}
              onChange={(e) => this.setState({ newTopicName: e.target.value })}
              placeholder="e.g., Database Normalization, SQL Queries, etc."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.setState({ showAddTopicDialog: false })}>
              Cancel
            </Button>
            <Button onClick={this.saveNewTopic} color="primary" variant="contained">
              Add Subtopic
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default withRouter(CourseDetail);