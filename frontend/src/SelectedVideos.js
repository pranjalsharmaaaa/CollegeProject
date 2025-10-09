import React, { Component } from 'react';
import { Button, Card, CardContent, Typography, Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
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
      token: localStorage.getItem("token")
    };
  }

  handleGenerateCode = () => {
    axios.post('http://localhost:2000/generate-class-code', {}, {
      headers: {
        'Content-Type': 'application/json',
        token: this.state.token
      }
    })
    .then((res) => {
      this.setState({
        showClassCodeDialog: true,
        generatedCode: res.data.classCode
      });
    })
    .catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Failed to generate code",
        icon: "error"
      });
    });
  };

  handleCloseCodeDialog = () => {
    this.setState({ showClassCodeDialog: false });
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
    localStorage.removeItem('selectedVideos');
    this.setState({ selectedVideos: [] });
  };

  goBack = () => {
    this.props.navigate(-1);
  };

  render() {
    const groupedVideos = this.groupVideosByTopic();
    const topicNames = Object.keys(groupedVideos);

    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Button variant="outlined" onClick={this.goBack}>
            ← Back
          </Button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              variant="contained" 
              style={{ backgroundColor: '#4caf50', color: 'white' }}
              onClick={this.handleGenerateCode}
            >
              Generate Class Code
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
                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                          />
                          <Typography variant="subtitle2" style={{ marginTop: '8px' }}>
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
                marginTop: '10px'
              }}
            >
              {this.state.generatedCode}
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: '15px', display: 'block', textAlign: 'center' }}>
              Students will use this code to access all your selected videos and course materials.
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