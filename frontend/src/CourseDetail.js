import React, { Component } from 'react';
import { withRouter } from "./utils";
import axios from 'axios';
import swal from 'sweetalert';
import './CourseDetail.css';

class CourseDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      course: null,
      loading: true,
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
      recommendedVideos: [],
      loadingVideos: false,
      selectedTopic: null,
      videoFilter: 'free',
      selectedVideos: JSON.parse(localStorage.getItem('selectedVideos') || '[]'),
      subtopics: [],
      newTopicName: '',
      pasteUrlMode: false,
      pastedUrl: '',
      isSheetOpen: false,
      searchQuery: '',
      showClassCodeModal: false,
      generatedClassCode: '',
      paidVideos: [
        {
          id: 'udemy-1',
          videoId: 'udemy-1',
          platform: 'Udemy',
          platformLogo: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Udemy_logo.svg',
          title: 'Complete Database Management Systems Course',
          instructor: 'Top Rated Instructor',
          isPaid: true,
          price: '$49.99'
        },
        {
          id: 'coursera-1',
          videoId: 'coursera-1',
          platform: 'Coursera',
          platformLogo: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg',
          title: 'Database Design and Basic SQL in PostgreSQL',
          instructor: 'University of Michigan',
          isPaid: true,
          price: '$79.99'
        }
      ]
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
      headers: { token: this.state.token }
    })
    .then((res) => {
      const courseData = res.data.course;
      this.setState({ loading: false, course: courseData });
      localStorage.setItem('currentCourseId', courseData._id);

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
    
    axios.get(`http://localhost:2000/search-videos/${encodeURIComponent(topicQuery)}?maxResults=12`, {
      headers: { token: this.state.token }
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
    } else {
      updatedVideos = [...selectedVideos, { ...video, topic: selectedTopic }];
    }
    
    this.setState({ selectedVideos: updatedVideos });
    localStorage.setItem('selectedVideos', JSON.stringify(updatedVideos));
  }

  handleAddTopic = () => {
    const { newTopicName, subtopics } = this.state;
    if (newTopicName.trim()) {
      const newTopic = newTopicName.trim();
      this.setState({
        subtopics: [...subtopics, newTopic],
        newTopicName: ''
      });
      this.handleTopicSelect(newTopic);
    }
  }

  handlePasteUrl = () => {
    const { pastedUrl } = this.state;
    if (pastedUrl.trim() && pastedUrl.includes('youtube.com')) {
      const videoId = this.extractVideoId(pastedUrl);
      if (videoId) {
        swal({ text: 'URL added successfully!', icon: 'success', timer: 1500 });
        this.setState({ pasteUrlMode: false, pastedUrl: '' });
      } else {
        swal({ text: 'Invalid YouTube URL', icon: 'error' });
      }
    } else {
      swal({ text: 'Please enter a valid YouTube URL', icon: 'warning' });
    }
  }

  extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  removeVideo = (videoId) => {
    const updated = this.state.selectedVideos.filter(v => v.videoId !== videoId);
    localStorage.setItem('selectedVideos', JSON.stringify(updated));
    this.setState({ selectedVideos: updated });
  };

  generateClassCode = () => {
    const { course } = this.state;
    if (!course || !course._id) {
      swal({
        text: "Course ID is missing. Please select a course first.",
        icon: "error"
      });
      return;
    }

    axios.post('http://localhost:2000/generate-class-code', 
      { courseId: course._id },
      {
        headers: {
          'Content-Type': 'application/json',
          token: this.state.token
        }
      }
    )
    .then((res) => {
      this.setState({
        showClassCodeModal: true,
        generatedClassCode: res.data.classCode,
        isSheetOpen: false
      });
    })
    .catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Failed to generate code",
        icon: "error"
      });
    });
  };

  copyCodeToClipboard = () => {
    navigator.clipboard.writeText(this.state.generatedClassCode);
    swal({
      text: "Class code copied to clipboard!",
      icon: "success",
      timer: 2000
    });
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
    const { recommendedVideos, videoFilter, paidVideos } = this.state;
    
    switch(videoFilter) {
      case 'free':
        return recommendedVideos.filter(video => !video.isPaid);
      case 'paid':
        return paidVideos;
      default:
        return recommendedVideos;
    }
  }

  render() {
    const { 
      course, 
      loading, 
      loadingVideos, 
      selectedTopic, 
      videoFilter, 
      selectedVideos, 
      subtopics, 
      newTopicName, 
      pasteUrlMode, 
      pastedUrl,
      isSheetOpen,
      searchQuery,
      showClassCodeModal,
      generatedClassCode
    } = this.state;

    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      );
    }

    if (!course) {
      return <div>Course not found</div>;
    }

    const topics = this.parseTopicsFromSyllabus(course.syllabus_text);
    const displayTopicTitle = selectedTopic || `${course.subject_name} Overview`;
    const filteredVideos = this.getFilteredVideos();

    const allVideos = [...this.state.recommendedVideos, ...this.state.paidVideos];
    const selectedVideoDetails = allVideos.filter((v) =>
      selectedVideos.some(sv => sv.videoId === v.videoId)
    );
    const filteredSelectedVideos = selectedVideoDetails.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="course-detail-container">
        {/* Header */}
        <header className="course-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon-course">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="logo-title-course">EduLens</h1>
                <p className="logo-subtitle-course">Teacher Dashboard</p>
              </div>
            </div>

            <div className="header-actions-course">
              <button 
                onClick={() => this.setState({ isSheetOpen: true })} 
                className="create-classroom-btn"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Classroom
                {selectedVideos.length > 0 && (
                  <span className="video-count-badge">{selectedVideos.length}</span>
                )}
              </button>
              <div className="user-profile-course">
                <div className="avatar-course">D</div>
                <span className="user-name-course">Ms. Disha Singh</span>
              </div>
            </div>
          </div>
        </header>

        <div className="course-layout">
          {/* Sidebar */}
          <aside className="course-sidebar">
            <div className="sidebar-section">
              <div className="section-title-bar">
                <h3 className="section-title">Resources</h3>
                <div className="filter-tabs">
                  <button 
                    className={`filter-tab ${videoFilter === 'free' ? 'active' : ''}`}
                    onClick={() => this.handleVideoFilter('free')}
                  >
                    Free
                  </button>
                  <button 
                    className={`filter-tab ${videoFilter === 'paid' ? 'active' : ''}`}
                    onClick={() => this.handleVideoFilter('paid')}
                  >
                    Paid
                  </button>
                </div>
              </div>
              <p className="section-description">
                Manage your courses and help students access syllabus-aligned resources.
              </p>
            </div>

            <div className="topics-section">
              <h3 className="topics-title">Your Uploaded Topics</h3>
              
              <div className="topics-list">
                {topics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => this.handleTopicSelect(topic)}
                    className={`topic-item ${selectedTopic === topic ? 'active' : ''}`}
                  >
                    {topic}
                  </button>
                ))}
                
                {subtopics.map((subtopic, index) => (
                  <button
                    key={`sub-${index}`}
                    onClick={() => this.handleTopicSelect(subtopic)}
                    className={`topic-item ${selectedTopic === subtopic ? 'active' : ''}`}
                  >
                    {subtopic}
                  </button>
                ))}
              </div>
            </div>

            <div className="add-topic-section">
              <input
                type="text"
                placeholder="Type in New Topic"
                value={newTopicName}
                onChange={(e) => this.setState({ newTopicName: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && this.handleAddTopic()}
                className="topic-input"
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="course-main">
            <div className="main-content">
              {/* Videos Section */}
              <section className="videos-section">
                <div className="videos-header">
                  <div>
                    <div className="videos-title-row">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                      </svg>
                      <h2 className="videos-title">Recommended Videos</h2>
                    </div>
                    <p className="videos-description">
                      Videos prioritised based on your uploaded material. Select the one you like
                    </p>
                  </div>

                  {videoFilter === 'free' && (
                    <button 
                      onClick={() => this.setState({ pasteUrlMode: !pasteUrlMode })}
                      className="paste-url-btn"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Paste URL
                    </button>
                  )}
                </div>

                {pasteUrlMode && (
                  <div className="paste-url-container">
                    <input
                      type="text"
                      placeholder="Paste YouTube video URL here..."
                      value={pastedUrl}
                      onChange={(e) => this.setState({ pastedUrl: e.target.value })}
                      className="paste-url-input"
                    />
                    <button onClick={this.handlePasteUrl} className="submit-url-btn">
                      Add Video
                    </button>
                    <button 
                      onClick={() => this.setState({ pasteUrlMode: false, pastedUrl: '' })}
                      className="cancel-url-btn"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {loadingVideos ? (
                  <div className="loading-videos">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="videos-grid">
                    {filteredVideos.length > 0 ? (
                      filteredVideos.map((video) => {
                        const isSelected = selectedVideos.some(v => v.videoId === video.videoId);
                        const isPaidVideo = video.isPaid;
                        
                        return (
                          <div key={video.videoId} className="video-card">
                            {isPaidVideo ? (
                              <div className="paid-video-content">
                                <div className="paid-platform-logo">
                                  <img src={video.platformLogo} alt={video.platform} />
                                </div>
                                <div className="paid-video-info">
                                  <h3 className="video-title">{video.title}</h3>
                                  <p className="paid-instructor">{video.instructor}</p>
                                </div>
                                <div className="video-actions">
                                  <button className="watch-btn paid-watch">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                                    </svg>
                                    <span className="gradient-text">Watch Now</span>
                                  </button>
                                  <button 
                                    onClick={() => this.toggleVideoSelection(video)}
                                    className={`select-btn ${isSelected ? 'selected' : ''}`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Selected
                                      </>
                                    ) : (
                                      <>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Select Video
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="video-thumbnail">
                                  <img src={video.thumbnail} alt={video.title} />
                                  <div className="play-overlay">
                                    <div className="play-button-youtube">
                                      <svg width="68" height="48" viewBox="0 0 68 48">
                                        <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
                                        <path d="M 45,24 27,14 27,34" fill="#fff"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <span className="video-badge free">
                                    {displayTopicTitle}
                                  </span>
                                </div>
                                
                                <div className="video-info">
                                  <h3 className="video-title">{video.title}</h3>
                                  
                                  <div className="video-actions">
                                    <a 
                                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="watch-btn"
                                    >
                                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                                      </svg>
                                      Watch Now
                                    </a>
                                    
                                    <button 
                                      onClick={() => this.toggleVideoSelection(video)}
                                      className={`select-btn ${isSelected ? 'selected' : ''}`}
                                    >
                                      {isSelected ? (
                                        <>
                                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                          Selected
                                        </>
                                      ) : (
                                        <>
                                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          Select Video
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-videos">
                        <p>No videos found for this filter.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Notes and Questions Section */}
              <div className="upload-section">
                <div className="upload-card">
                  <div className="upload-header">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3>Notes</h3>
                  </div>
                  <button className="upload-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Notes</span>
                  </button>
                </div>

                <div className="upload-card">
                  <div className="upload-header">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3>Important Questions</h3>
                  </div>
                  <button className="upload-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Questions</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Sheet for Selected Videos */}
        {isSheetOpen && (
          <div className="sheet-overlay" onClick={() => this.setState({ isSheetOpen: false })}>
            <div className="sheet-content" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-header">
                <h2 className="sheet-title">Selected Videos</h2>
                <p className="sheet-description">
                  {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected for your classroom
                </p>
                <button 
                  className="sheet-close"
                  onClick={() => this.setState({ isSheetOpen: false })}
                >
                  ✕
                </button>
              </div>

              {selectedVideos.length > 0 && (
                <div className="sheet-search">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search selected videos..."
                    value={searchQuery}
                    onChange={(e) => this.setState({ searchQuery: e.target.value })}
                  />
                </div>
              )}

              <div className="sheet-body">
                {selectedVideos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-title">No videos found</p>
                    <p className="empty-subtitle">Try a different search term</p>
                  </div>
                ) : filteredSelectedVideos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p className="empty-title">No videos found</p>
                    <p className="empty-subtitle">Try a different search term</p>
                  </div>
                ) : (
                  <div className="selected-videos-list">
                    {filteredSelectedVideos.map((video) => (
                      <div key={video.videoId} className="selected-video-card">
                        <div className="selected-video-thumbnail">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.title} />
                          ) : (
                            <img src={video.platformLogo} alt={video.platform} className="platform-logo-small" />
                          )}
                        </div>
                        <div className="selected-video-info">
                          <h4>{video.title}</h4>
                          {video.topic && <span className="video-topic-badge">{video.topic}</span>}
                        </div>
                        <button 
                          className="remove-video-btn"
                          onClick={() => this.removeVideo(video.videoId)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedVideos.length > 0 && (
                <div className="sheet-footer">
                  <button 
                    className="generate-code-btn"
                    onClick={this.generateClassCode}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Generate Class Code
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Class Code Modal */}
        {showClassCodeModal && (
          <div className="modal-overlay" onClick={() => this.setState({ showClassCodeModal: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-icon">
                  <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="modal-title">Class Code Created!</h2>
                <p className="modal-description">Class code for this course is created</p>
              </div>

              <div className="modal-body">
                <div className="class-code-display" onClick={this.copyCodeToClipboard}>
                  <p className="class-code">{generatedClassCode}</p>
                </div>
                <p className="click-to-copy">Click to copy</p>
              </div>

              <div className="modal-footer">
                <button 
                  className="modal-close-btn"
                  onClick={() => this.setState({ showClassCodeModal: false })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(CourseDetail);
