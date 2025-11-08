import React, { Component } from 'react';
import { Button, Card, CardContent, Typography, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@material-ui/core';
import { withRouter } from "./utils";
import axios from 'axios';
import swal from 'sweetalert';

class SelectedVideos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedVideos: JSON.parse(localStorage.getItem('selectedVideos') || '[]'),
      showClassCodeDialog: false,
      generatedCode: '',
      token: localStorage.getItem("token"),
      loadingCode: false,
      courseId: props.location?.state?.courseId || localStorage.getItem('currentCourseId')
    };
  }

  handleGenerateCode = () => {
    // Validate courseId exists
    if (!this.state.courseId) {
      swal({
        text: "Course ID is missing. Please select a course first.",
        icon: "error"
      });
      return;
    }

    this.setState({ loadingCode: true });
    
    axios.post('http://localhost:2000/generate-class-code', 
      { courseId: this.state.courseId }, // Send courseId in request body
      {
        headers: {
          'Content-Type': 'application/json',
          token: this.state.token
        }
      }
    )
    .then((res) => {
      this.setState({
        showClassCodeDialog: true,
        generatedCode: res.data.classCode,
        loadingCode: false
      });
    })
    .catch((err) => {
      this.setState({ loadingCode: false });
      swal({
        text: err.response?.data?.errorMessage || "Failed to generate code",
        icon: "error"
      });
    });
  };

  handleCloseCodeDialog = () => {
    this.setState({ showClassCodeDialog: false });
  };

  copyCodeToClipboard = () => {
    navigator.clipboard.writeText(this.state.generatedCode);
    swal({
      text: "Class code copied to clipboard!",
      icon: "success",
      timer: 2000
    });
  };

  groupVideosByTopic = () => {
    const grouped = {};
    this.state.selectedVideos.forEach(video => {
      if (!grouped[video.topic]) {
        grouped[video.topic] = [];
      }
      grouped[video.topic].push(video);
    });
    return grouped;
  };

  removeVideo = (videoId) => {
    const updated = this.state.selectedVideos.filter(v => v.videoId !== videoId);
    localStorage.setItem('selectedVideos', JSON.stringify(updated));
    this.setState({ selectedVideos: updated });
  };

  clearAll = () => {
    swal({
      title: "Are you sure?",
      text: "This will clear all selected videos",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        localStorage.removeItem('selectedVideos');
        this.setState({ selectedVideos: [] });
        swal("All videos cleared!", {
          icon: "success",
        });
      }
    });
  };

  goBack = () => {
    this.props.navigate(-1);
  };

  render() {
    const groupedVideos = this.groupVideosByTopic();
    const topicNames = Object.keys(groupedVideos);

    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <Button variant="outlined" onClick={this.goBack}>
            ← Back
          </Button>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              style={{ backgroundColor: '#4caf50', color: 'white' }}
              onClick={this.handleGenerateCode}
              disabled={this.state.loadingCode}
            >
              {this.state.loadingCode ? <CircularProgress size={24} color="inherit" /> : 'Generate Class Code'}
            </Button>
            <Button variant="contained" color="secondary" onClick={this.clearAll}>
              Clear All
            </Button>
          </div>
        </div>

        <Typography variant="h4" gutterBottom>
          Selected Videos ({this.state.selectedVideos.length})
        </Typography>

        {topicNames.length === 0 ? (
          <Typography variant="body1">No videos selected yet.</Typography>
        ) : (
          topicNames.map(topic => (
            <Card key={topic} style={{ marginBottom: '30px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom style={{ color: '#3f51b5' }}>
                  {topic} ({groupedVideos[topic].length} videos)
                </Typography>
                <Divider style={{ marginBottom: '15px' }} />
                
                <Grid container spacing={2}>
                  {groupedVideos[topic].map(video => (
                    <Grid item xs={12} sm={6} md={4} key={video.videoId}>
                      <Card variant="outlined">
                        <CardContent>
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <Typography variant="subtitle2" style={{ marginTop: '8px', minHeight: '40px' }}>
                            {video.title}
                          </Typography>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <Button 
                              size="small" 
                              variant="contained"
                              color="primary"
                              href={`https://www.youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                            >
                              Watch
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              color="secondary"
                              onClick={() => this.removeVideo(video.videoId)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))
        )}

        {/* Class Code Dialog */}
        <Dialog
          open={this.state.showClassCodeDialog}
          onClose={this.handleCloseCodeDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Your Class Code</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Share this code with your students so they can access these videos:
            </Typography>
            <Typography 
              variant="h4" 
              style={{ 
                textAlign: 'center', 
                padding: '20px', 
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
                letterSpacing: '4px',
                marginTop: '10px',
                cursor: 'pointer',
                borderRadius: '4px',
                userSelect: 'all'
              }}
              onClick={this.copyCodeToClipboard}
              title="Click to copy"
            >
              {this.state.generatedCode}
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: '15px', display: 'block', textAlign: 'center' }}>
              Students will use this code to access all your selected videos and course materials.
            </Typography>
            <Typography variant="caption" style={{ marginTop: '8px', display: 'block', textAlign: 'center', color: '#888' }}>
              (Click the code to copy it to clipboard)
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseCodeDialog} color="primary" variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default withRouter(SelectedVideos);
