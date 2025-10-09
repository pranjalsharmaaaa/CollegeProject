import React from "react";
import swal from "sweetalert";
import { Button, TextField, Link, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from "@material-ui/core";
import { withRouter } from "./utils";
import axios from "axios";

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

  handleRoleChange = (event) => {
    this.setState({ role: event.target.value });
  };

  login = () => {
    axios.post("http://localhost:2000/login", {
      username: this.state.username,
      password: this.state.password,
      role: this.state.role
    }).then((res) => {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", this.state.role);
      
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

  render() {
    return (
      <div style={{ marginTop: "200px" }}>
        <div>
          <h2>Login</h2>
        </div>

        <div>
          <FormControl component="fieldset" style={{ marginBottom: "20px" }}>
            <FormLabel component="legend">Login As:</FormLabel>
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
          <Button
            className="button_style"
            variant="contained"
            color="primary"
            size="small"
            disabled={this.state.username === "" || this.state.password === ""}
            onClick={this.login}
          >
            Login as {this.state.role === "teacher" ? "Teacher" : "Student"}
          </Button> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Link
            component="button"
            style={{ fontFamily: "inherit", fontSize: "inherit" }}
            onClick={() => this.props.navigate("/register")}
          >
            Register
          </Link>
        </div>
      </div>
    );
  }
}

export default withRouter(Login);