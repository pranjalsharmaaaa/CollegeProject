import React from "react";
import swal from "sweetalert";
import { withRouter } from "./utils";
import axios from "axios";
import "./Auth.css";
import semesterData from './Semester.json';

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      confirm_password: '',
      role: 'teacher',
      school: '',
      course: ''
    };
  }

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleRoleChange = (role) => {
    this.setState({ role: role, school: '', course: '' });
  };

  handleSchoolChange = (e) => {
    this.setState({ school: e.target.value, course: '' });
  };

  getSchools = () => {
    return semesterData.map(item => item.school);
  };

  getCourses = () => {
    if (!this.state.school) return [];
    const selectedSchool = semesterData.find(item => item.school === this.state.school);
    return selectedSchool ? selectedSchool.courses.map(c => c.courseName) : [];
  };

  register = () => {
    if (this.state.password !== this.state.confirm_password) {
      return swal({
        text: "Passwords do not match!",
        icon: "error"
      });
    }

    if (!this.state.school || !this.state.course) {
      return swal({
        text: "Please select your school and course!",
        icon: "warning"
      });
    }

    // Debug log
  console.log("Sending registration data:", {
    username: this.state.username,
    password: "***",
    role: this.state.role,
    school: this.state.school,
    course: this.state.course
  });

    axios.post('http://localhost:2000/register', {
      username: this.state.username,
      password: this.state.password,
      role: this.state.role,
      school: this.state.school,
      course: this.state.course
    }).then((res) => {
      swal({
        text: res.data.message || "Registration successful!",
        icon: "success",
        timer: 2000
      });
      this.props.navigate("/");
    }).catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Registration failed!",
        icon: "error"
      });
    });
  }

  handleOutlookLogin = () => {
    swal({
      text: "Outlook login integration coming soon!",
      icon: "info"
    });
  };

  render() {
    const schools = this.getSchools();
    const courses = this.getCourses();

    return (
      <div className="auth-container">
        <div className="auth-content">
          {/* Header with Logo */}
          <div className="auth-header">
            <div className="logo-container">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="logo-title">EduLens</h1>
              <p className="logo-subtitle">Syllabus-aligned learning resources</p>
            </div>
          </div>

          {/* Main Card */}
          <div className="auth-card">
            {/* Welcome Section */}
            <div className="auth-welcome">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-description">Join EduLens to start your learning journey</p>
            </div>

            {/* User Type Toggle */}
            <div className="user-type-toggle">
              <button
                onClick={() => this.handleRoleChange('teacher')}
                className={`toggle-btn ${this.state.role === 'teacher' ? 'active' : ''}`}
              >
                Teacher
              </button>
              <button
                onClick={() => this.handleRoleChange('student')}
                className={`toggle-btn ${this.state.role === 'student' ? 'active' : ''}`}
              >
                Student
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); this.register(); }} className="auth-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Email or Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={this.state.username}
                  onChange={this.onChange}
                  placeholder="Enter your email"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={this.state.password}
                  onChange={this.onChange}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password" className="form-label">Confirm Password</label>
                <input
                  id="confirm_password"
                  type="password"
                  name="confirm_password"
                  value={this.state.confirm_password}
                  onChange={this.onChange}
                  placeholder="Confirm your password"
                  className="form-input"
                  required
                />
              </div>

              {/* School Selection */}
              <div className="form-group">
                <label htmlFor="school" className="form-label">Select your school</label>
                <select
                  id="school"
                  name="school"
                  value={this.state.school}
                  onChange={this.handleSchoolChange}
                  className="form-select"
                  required
                >
                  <option value="">Choose here</option>
                  {schools.map((school, index) => (
                    <option key={index} value={school}>{school}</option>
                  ))}
                </select>
              </div>

              {/* Course Selection */}
              <div className="form-group">
                <label htmlFor="course" className="form-label">Select your course</label>
                <select
                  id="course"
                  name="course"
                  value={this.state.course}
                  onChange={this.onChange}
                  className="form-select"
                  required
                  disabled={!this.state.school}
                >
                  <option value="">Choose here</option>
                  {courses.map((course, index) => (
                    <option key={index} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={this.state.username === '' || this.state.password === '' || this.state.confirm_password === '' || !this.state.school || !this.state.course}
                className="submit-btn"
              >
                Create Account
              </button>
            </form>

            {/* Toggle to Login */}
            <div className="auth-footer">
              <p className="footer-text">
                Already have an account?{' '}
                <button
                  onClick={() => this.props.navigate("/")}
                  className="footer-link"
                >
                  Login here
                </button>
              </p>
            </div>

            {/* Divider */}
            <div className="divider">
              <span className="divider-text">or</span>
            </div>

            {/* Outlook Login */}
            <button
              type="button"
              onClick={this.handleOutlookLogin}
              className="outlook-btn"
            >
              Login with Outlook
            </button>
          </div>

          {/* Footer */}
          <p className="terms-text">
            By continuing, you agree to EduLens Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }
}

export default withRouter(Register);
