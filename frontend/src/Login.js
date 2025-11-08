import React from "react";
import swal from "sweetalert";
import { withRouter } from "./utils";
import axios from "axios";
import "./Auth.css";
import semesterData from './Semester.json';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      role: "teacher"
    };
  }

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleRoleChange = (role) => {
    this.setState({ role: role });
  };

  login = () => {
    axios.post("http://localhost:2000/login", {
      username: this.state.username,
      password: this.state.password,
      role: this.state.role
    }).then((res) => {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", this.state.role);
      
      swal({
        text: "Login successful!",
        icon: "success",
        timer: 1500
      });

      if (this.state.role === "teacher") {
        this.props.navigate("/dashboard");
      } else {
        this.props.navigate("/student-dashboard");
      }
    }).catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Something went wrong!",
        icon: "error"
      });
    });
  };

  handleOutlookLogin = () => {
    swal({
      text: "Outlook login integration coming soon!",
      icon: "info"
    });
  };

  render() {
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
              <h2 className="auth-title">Welcome Back!</h2>
              <p className="auth-description">Sign in to access your educational dashboard</p>
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
            <form onSubmit={(e) => { e.preventDefault(); this.login(); }} className="auth-form">
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

              <button
                type="submit"
                disabled={this.state.username === "" || this.state.password === ""}
                className="submit-btn"
              >
                Log In
              </button>
            </form>

            {/* Toggle to Register */}
            <div className="auth-footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <button
                  onClick={() => this.props.navigate("/register")}
                  className="footer-link"
                >
                  Register here
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

export default withRouter(Login);
