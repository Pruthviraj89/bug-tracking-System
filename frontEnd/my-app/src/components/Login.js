import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap'; // Import Bootstrap components

const API_BASE_URL = 'https://localhost:7082'; // IMPORTANT: Replace with your actual .NET API URL (e.g., https://localhost:7001)

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    setError(''); // Clear previous errors
    setLoading(true); // Show loading indicator

    try {
      const response = await axios.post(`${API_BASE_URL}/api/Auth/login`, {
        username,
        password,
      });

      const token = response.data; // The API returns the JWT directly
      localStorage.setItem('jwtToken', token); // Store the token in local storage
      console.log('Login successful! Token:', token);
      onLoginSuccess(); // Call the parent callback to indicate successful login
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(err.response.data || 'Login failed. Please check your credentials.');
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check if the API is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="p-4 shadow-lg" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Bug Tracking System Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-pill"
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill mt-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
                border: 'none',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
