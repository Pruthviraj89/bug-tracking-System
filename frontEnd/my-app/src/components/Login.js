import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';

const API_BASE_URL = 'https://localhost:7082';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({ username: '', password: '' });

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  const validateForm = () => {
    let isValid = true;
    const errors = { username: '', password: '' };

    if (!username) {
      errors.username = 'Username is required.';
      isValid = false;
    } else if (!usernameRegex.test(username)) {
      errors.username = 'Username must be 3-20 characters, alphanumeric with - or _ allowed.';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required.';
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      errors.password = 'Password must be at least 8 characters, including an uppercase letter, lowercase letter, and number.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/Auth/login`, {
        username,
        password,
      });

      const token = response.data;
      localStorage.setItem('jwtToken', token);
      console.log('Login successful! Token:', token);
      onLoginSuccess();
    } catch (err) {
      console.error('Login failed:', err);
      if (err.response) {
        setError(err.response.data || 'Login failed. Please check your credentials.');
      } else if (err.request) {
        setError('No response from server. Please check if the API is running.');
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="p-4 shadow-lg border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
        <Card.Body>
          <h2 className="text-center mb-4" style={{ color: '#34495e', fontWeight: '600' }}>Bug Tracking System Login</h2>
          {error && <Alert variant="danger" className="rounded-pill">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="formBasicUsername">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                isInvalid={!!formErrors.username}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isInvalid={!!formErrors.password}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill mt-3 shadow"
              disabled={loading}
              style={{
                background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
                border: 'none',
                padding: '12px',
                fontWeight: '500',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              }}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;