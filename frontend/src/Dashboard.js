import React, { Component } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import { withRouter } from "./utils";
import './ModernDashboard.css';
import semesterData from './Semester.json';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      token: '',
      openCourseModal: false,
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
      loading: false,
      stats: {
        totalStudents: 83,
        activeCourses: 0,
        resourcesAdded: 27
      },
      // New states for dropdown functionality
      showCustomSchool: false,
      showCustomCourse: false,
      showCustomSemester: false,
      showCustomSubject: false,
      selectedSchool: '',
      selectedCourse: '',
      selectedSemester: '',
      availableCourses: [],
      availableSemesters: [],
      availableSubjects: []
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

  getCourseData = () => {
    this.setState({ loading: true });
    let data = `?page=${this.state.page}`;
    if (this.state.search) {
      data += `&search=${this.state.search}`;
    }

    axios.get(`http://localhost:2000/get-courses${data}`, {
      headers: { token: this.state.token }
    })
    .then((res) => {
      this.setState({
        loading: false,
        courses: res.data.courses,
        pages: res.data.pages,
        stats: {
          ...this.state.stats,
          activeCourses: res.data.courses.length
        }
      });
    })
    .catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Something went wrong",
        icon: "error"
      });
      this.setState({ loading: false, courses: [], pages: 0 });
    });
  };

  deleteCourse = (id) => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this course!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        axios.post("http://localhost:2000/delete-course", { id: id }, {
          headers: { "Content-Type": "application/json", token: this.state.token }
        })
        .then((res) => {
          swal({ text: res.data.title, icon: "success" });
          this.setState({ page: 1 }, () => this.getCourseData());
        })
        .catch((err) => {
          swal({ text: err.response?.data?.errorMessage || "Something went wrong", icon: "error" });
        });
      }
    });
  };

  addCourse = () => {
    const { class_name, subject_name, unit_title, resource_type, syllabus_file, syllabus_text } = this.state;
    
    let requestData;
    let contentType;

    if (resource_type === 'File') {
      if (!syllabus_file) return swal({ text: 'Please select a syllabus file!', icon: 'warning' });
      requestData = new FormData();
      requestData.append('class_name', class_name);
      requestData.append('subject_name', subject_name);
      requestData.append('unit_title', unit_title);
      requestData.append('resource_type', resource_type);
      requestData.append('syllabus_file', syllabus_file);
      contentType = 'multipart/form-data';
    } else {
      if (!syllabus_text.trim()) return swal({ text: 'Please enter syllabus content!', icon: 'warning' });
      requestData = { class_name, subject_name, unit_title, resource_type, syllabus_text: syllabus_text.trim() };
      contentType = 'application/json';
    }

    axios.post('http://localhost:2000/add-course', requestData, {
      headers: { 'Content-Type': contentType, 'token': this.state.token }
    })
    .then((res) => {
      swal({ text: res.data.title, icon: 'success' });
      this.resetModalState();
      this.getCourseData();
    })
    .catch((err) => {
      swal({ text: err.response?.data?.errorMessage || 'Something went wrong!', icon: 'error' });
    });
  };

  resetModalState = () => {
    this.setState({
      openCourseModal: false,
      class_name: '', 
      subject_name: '', 
      unit_title: '', 
      syllabus_file: null, 
      syllabus_text: '', 
      fileName: '', 
      page: 1,
      showCustomSchool: false,
      showCustomCourse: false,
      showCustomSemester: false,
      showCustomSubject: false,
      selectedSchool: '',
      selectedCourse: '',
      selectedSemester: '',
      availableCourses: [],
      availableSemesters: [],
      availableSubjects: []
    });
  };

  logOut = () => {
    localStorage.setItem('token', null);
    this.props.navigate("/");
  };

  handleSchoolChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      this.setState({ 
        showCustomSchool: true,
        selectedSchool: '',
        availableCourses: [],
        availableSemesters: [],
        availableSubjects: [],
        selectedCourse: '',
        selectedSemester: '',
        class_name: '',
        subject_name: '',
        showCustomCourse: false,
        showCustomSemester: false,
        showCustomSubject: false
      });
    } else {
      const schoolObj = semesterData.find(s => s.school === value);
      this.setState({ 
        showCustomSchool: false,
        selectedSchool: value,
        availableCourses: schoolObj ? schoolObj.courses : [],
        availableSemesters: [],
        availableSubjects: [],
        selectedCourse: '',
        selectedSemester: '',
        class_name: '',
        subject_name: '',
        showCustomCourse: false,
        showCustomSemester: false,
        showCustomSubject: false
      });
    }
  };

  handleCourseChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      this.setState({ 
        showCustomCourse: true,
        selectedCourse: '',
        availableSemesters: [],
        availableSubjects: [],
        selectedSemester: '',
        class_name: '',
        subject_name: '',
        showCustomSemester: false,
        showCustomSubject: false
      });
    } else {
      const courseObj = this.state.availableCourses.find(c => c.courseName === value);
      this.setState({ 
        showCustomCourse: false,
        selectedCourse: value,
        availableSemesters: courseObj ? courseObj.semesters : [],
        availableSubjects: [],
        selectedSemester: '',
        class_name: '',
        subject_name: '',
        showCustomSemester: false,
        showCustomSubject: false
      });
    }
  };

  handleSemesterChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      this.setState({ 
        showCustomSemester: true, 
        class_name: '',
        selectedSemester: '',
        availableSubjects: [],
        subject_name: '',
        showCustomSubject: false
      });
    } else {
      const semesterObj = this.state.availableSemesters.find(s => s.semester === value);
      this.setState({ 
        showCustomSemester: false,
        class_name: value,
        selectedSemester: value,
        availableSubjects: semesterObj ? semesterObj.subjects : [],
        subject_name: '',
        showCustomSubject: false
      });
    }
  };

  handleSubjectChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      this.setState({ 
        showCustomSubject: true, 
        subject_name: '' 
      });
    } else {
      this.setState({ 
        showCustomSubject: false,
        subject_name: value 
      });
    }
  };

  onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'syllabus_file' && files && files[0]) {
      this.setState({ syllabus_file: files[0], fileName: files[0].name });
      return;
    }
    if (name === 'resource_type') {
      this.setState({ resource_type: value, syllabus_file: null, syllabus_text: '', fileName: '' });
      return;
    }
    this.setState({ [name]: value }, () => {
      if (name === 'search') {
        this.setState({ page: 1 }, () => this.getCourseData());
      }
    });
  };

  render() {
    const { 
      courses, loading, openCourseModal, stats, search, 
      showCustomSchool, showCustomCourse, showCustomSemester, showCustomSubject, 
      selectedSchool, selectedCourse, selectedSemester, 
      availableCourses, availableSemesters, availableSubjects 
    } = this.state;

    return (
      <div className="modern-dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-container">
            <div className="header-content">
              <div className="logo-section">
                <div className="logo-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="logo-title">EduLens</h1>
                  <p className="logo-subtitle">Teacher Dashboard</p>
                </div>
              </div>

              <div className="header-actions">
                <button onClick={this.logOut} className="logout-btn">
                  Logout
                </button>
                <div className="user-profile">
                  <div className="avatar">T</div>
                  <div className="user-info">
                    <p className="user-name">Teacher</p>
                    <p className="user-role">Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back, Teacher 👋</h2>
            <p className="welcome-subtitle">Manage your courses and help students access syllabus-aligned resources.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="stat-label">Total Students</p>
                <p className="stat-value">{stats.totalStudents}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="stat-label">Active Courses</p>
                <p className="stat-value">{stats.activeCourses}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon cyan-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="stat-label">Resources Added</p>
                <p className="stat-value">{stats.resourcesAdded}</p>
              </div>
            </div>
          </div>

          {/* Course Management Section */}
          <div className="course-section">
            <div className="course-header">
              <div className="course-header-left">
                <div>
                  <h3 className="section-title">My Courses</h3>
                  <p className="section-subtitle">Manage your syllabus and course materials</p>
                </div>
              </div>
              <button onClick={() => this.setState({ openCourseModal: true })} className="add-course-btn">
                + Add Course
              </button>
            </div>

            <div className="search-bar">
              <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                name="search"
                value={search}
                onChange={this.onChange}
                placeholder="Search by class, subject, or unit..."
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="table-container">
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Semester</th>
                      <th>Subject</th>
                      <th>Unit</th>
                      <th>Syllabus</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((row) => (
                      <tr key={row._id}>
                        <td>{row.class_name}</td>
                        <td>{row.subject_name}</td>
                        <td>{row.unit_title}</td>
                        <td>
                          {row.resource_type === 'File' ? (
                            <a href={`http://localhost:2000/${row.syllabus_file_path}`} target="_blank" rel="noopener noreferrer" className="file-link">
                              View File
                            </a>
                          ) : (
                            <span className="text-preview">{row.syllabus_text?.substring(0, 30)}...</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => this.props.navigate(`/course-detail/${row._id}`)} className="btn-view">
                              View
                            </button>
                            <button onClick={() => this.deleteCourse(row._id)} className="btn-delete">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Add Course Modal */}
        {openCourseModal && (
          <div className="modal-overlay" onClick={this.resetModalState}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Add New Course</h3>
              
              <div className="modal-form">
                {/* School Dropdown */}
                <select
                  name="school_dropdown"
                  value={showCustomSchool ? 'custom' : selectedSchool}
                  onChange={this.handleSchoolChange}
                  className="form-select"
                >
                  <option value="">Select School</option>
                  {semesterData.map((school, index) => (
                    <option key={index} value={school.school}>
                      {school.school}
                    </option>
                  ))}
                  <option value="custom">+ Add Custom School</option>
                </select>

                {/* Custom School Input */}
                {showCustomSchool && (
                  <input
                    type="text"
                    name="custom_school"
                    placeholder="Enter custom school name"
                    className="form-input"
                  />
                )}

                {/* Course Name Dropdown - Only show if school is selected */}
                {(selectedSchool || showCustomSchool) && (
                  <>
                    {!showCustomSchool && availableCourses.length > 0 && (
                      <select
                        name="course_dropdown"
                        value={showCustomCourse ? 'custom' : selectedCourse}
                        onChange={this.handleCourseChange}
                        className="form-select"
                      >
                        <option value="">Select Course</option>
                        {availableCourses.map((course, index) => (
                          <option key={index} value={course.courseName}>
                            {course.courseName}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom Course</option>
                      </select>
                    )}

                    {/* Custom Course Input */}
                    {(showCustomCourse || showCustomSchool) && (
                      <input
                        type="text"
                        name="custom_course"
                        placeholder="Enter course name"
                        className="form-input"
                      />
                    )}
                  </>
                )}

                {/* Semester Dropdown - Only show if course is selected */}
                {(selectedCourse || showCustomCourse || showCustomSchool) && (
                  <>
                    {!showCustomCourse && !showCustomSchool && availableSemesters.length > 0 && (
                      <select
                        name="semester_dropdown"
                        value={showCustomSemester ? 'custom' : selectedSemester}
                        onChange={this.handleSemesterChange}
                        className="form-select"
                      >
                        <option value="">Select Semester</option>
                        {availableSemesters.map((sem, index) => (
                          <option key={index} value={sem.semester}>
                            {sem.semester}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom Semester</option>
                      </select>
                    )}

                    {/* Custom Semester Input */}
                    {(showCustomSemester || showCustomCourse || showCustomSchool) && (
                      <input
                        type="text"
                        name="class_name"
                        value={this.state.class_name}
                        onChange={this.onChange}
                        placeholder="Enter semester name"
                        className="form-input"
                      />
                    )}
                  </>
                )}
                
                {/* Subject Dropdown - Only show if semester is selected */}
                {(selectedSemester || showCustomSemester || showCustomCourse || showCustomSchool) && (
                  <>
                    {!showCustomSemester && !showCustomCourse && !showCustomSchool && availableSubjects.length > 0 && (
                      <select
                        name="subject_dropdown"
                        value={showCustomSubject ? 'custom' : this.state.subject_name}
                        onChange={this.handleSubjectChange}
                        className="form-select"
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map((subject, index) => (
                          <option key={index} value={subject}>
                            {subject}
                          </option>
                        ))}
                        <option value="custom">+ Add Custom Subject</option>
                      </select>
                    )}

                    {/* Custom Subject Input */}
                    {(showCustomSubject || showCustomSemester || showCustomCourse || showCustomSchool) && (
                      <input
                        type="text"
                        name="subject_name"
                        value={this.state.subject_name}
                        onChange={this.onChange}
                        placeholder="Enter subject name"
                        className="form-input"
                      />
                    )}
                  </>
                )}
                
                <input
                  type="text"
                  name="unit_title"
                  value={this.state.unit_title}
                  onChange={this.onChange}
                  placeholder="Unit Title"
                  className="form-input"
                />
                
                <select
                  name="resource_type"
                  value={this.state.resource_type}
                  onChange={this.onChange}
                  className="form-select"
                >
                  <option value="File">Upload Syllabus File</option>
                  <option value="Text">Type Syllabus Content</option>
                </select>

                {this.state.resource_type === 'File' ? (
                  <div>
                    <label className="file-label">
                      <span>{this.state.fileName || 'Choose file...'}</span>
                      <input type="file" accept=".pdf,.doc,.docx" name="syllabus_file" onChange={this.onChange} className="file-input" />
                    </label>
                  </div>
                ) : (
                  <textarea
                    name="syllabus_text"
                    value={this.state.syllabus_text}
                    onChange={this.onChange}
                    placeholder="Type syllabus content..."
                    rows={4}
                    className="form-textarea"
                  />
                )}
              </div>

              <div className="modal-actions">
                <button onClick={this.resetModalState} className="btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={this.addCourse}
                  disabled={!this.state.class_name || !this.state.subject_name || !this.state.unit_title}
                  className="btn-submit"
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Dashboard);
