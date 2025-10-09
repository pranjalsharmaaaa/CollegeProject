import React from "react";
import swal from "sweetalert";
import { Button, TextField, Link, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@material-ui/core";
import { withRouter } from "./utils";
import axios from "axios";

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      confirm_password: '',
      role: 'teacher'
    };
  }

  onChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleRoleChange = (event) => {
    this.setState({ role: event.target.value });
  };

  register = () => {
    if (this.state.password !== this.state.confirm_password) {
      return swal({
        text: "Passwords do not match!",
        icon: "error"
      });
    }

    axios.post('http://localhost:2000/register', {
      username: this.state.username,
      password: this.state.password,
      role: this.state.role
    }).then((res) => {
      swal({
        text: res.data.message || "Registration successful!",
        icon: "success"
      });
      this.props.navigate("/");
    }).catch((err) => {
      swal({
        text: err.response?.data?.errorMessage || "Registration failed!",
        icon: "error"
      });
    });
  }

  render() {
    return (
      <div style={{ marginTop: '200px' }}>
        <div>
          <h2>Register</h2>
        </div>

        <div>
          <FormControl component="fieldset" style={{ marginBottom: "20px" }}>
            <FormLabel component="legend">Register As:</FormLabel>
            <RadioGroup row value={this.state.role} onChange={this.handleRoleChange}>
              <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
              <FormControlLabel value="student" control={<Radio />} label="Student" />
            </RadioGroup>
          </FormControl>
          <br />

          <TextField
            type="text"
            autoComplete="off"
            name="username"
            value={this.state.username}
            onChange={this.onChange}
            placeholder="User Name"
            required
          />
          <br /><br />
          <TextField
            type="password"
            autoComplete="off"
            name="password"
            value={this.state.password}
            onChange={this.onChange}
            placeholder="Password"
            required
          />
          <br /><br />
          <TextField
            type="password"
            autoComplete="off"
            name="confirm_password"
            value={this.state.confirm_password}
            onChange={this.onChange}
            placeholder="Confirm Password"
            required
          />
          <br /><br />
          <Button
            className="button_style"
            variant="contained"
            color="primary"
            size="small"
            disabled={this.state.username === '' || this.state.password === '' || this.state.confirm_password === ''}
            onClick={this.register}
          >
            Register as {this.state.role === 'teacher' ? 'Teacher' : 'Student'}
          </Button> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Link
            component="button"
            style={{ fontFamily: "inherit", fontSize: "inherit" }}
            onClick={() => this.props.navigate("/")}
          >
            Login
          </Link>
        </div>
      </div>
    );
  }
}

export default withRouter(Register);
