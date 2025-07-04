import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import AuthService from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

function BugReportForm({ onBugReported }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportedById, setReportedById] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', description: '' });

  const authAxios = AuthService.getAuthAxios();

  // Regex for validations
  const nameRegex = /^[a-zA-Z0-9][a-zA-Z0-9\s\-_.:]{1,48}[a-zA-Z0-9]$/; // 3-50 chars, alphanumeric, spaces, -_.: allowed
  const descriptionRegex = /^[a-zA-Z0-9\s,.!?()-]{10,500}$/; // 10-500 chars, alphanumeric, common punctuation

  useEffect(() => {
    const token = AuthService.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log("BugReportForm: Decoded JWT Payload:", decodedToken);
        const idFromToken = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        if (idFromToken) {
          setReportedById(parseInt(idFromToken));
          console.log("BugReportForm: Extracted reportedById:", parseInt(idFromToken));
        } else {
          setError("User ID claim not found in token.");
          console.error("BugReportForm: User ID claim 'nameidentifier' not found in token.");
        }
      } catch (err) {
        console.error("BugReportForm: Failed to decode token:", err);
        setError("Could not get user ID from token. Please log in again.");
        AuthService.logout();
      }
    } else {
      setError("No authentication token found. Please log in.");
      AuthService.logout();
    }
  }, []);

  const validateForm = () => {
    let isValid = true;
    const errors = { name: '', description: '' };

    if (!name) {
      errors.name = 'Bug name is required.';
      isValid = false;
    } else if (!nameRegex.test(name)) {
      errors.name = 'Bug name must be 3-50 characters, start and end with alphanumeric characters, and may include spaces, -, _, ., or :.';
      isValid = false;
    }

    if (!description) {
      errors.description = 'Description is required.';
      isValid = false;
    } else if (!descriptionRegex.test(description)) {
      errors.description = 'Description must be 10-500 characters and include only letters, numbers, spaces, or common punctuation (,.!?()-).';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log("BugReportForm: Submitting bug with reportedById:", reportedById);

    if (!reportedById || isNaN(reportedById)) {
      setError("User ID not available or invalid. Cannot report bug.");
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const bugData = {
        name,
        description,
        reportedById,
        status: 'New',
        isModifiable: true,
      };

      const response = await authAxios.post('/api/Bugs', bugData);
      setSuccess('Bug reported successfully!');
      setName('');
      setDescription('');
      setFormErrors({ name: '', description: '' });
      console.log('Bug reported:', response.data);
      if (onBugReported) {
        onBugReported();
      }
    } catch (err) {
      console.error('Failed to report bug:', err);
      if (err.response) {
        console.error("BugReportForm: API Error Response:", err.response.data);
        if (err.response.status === 401 || err.response.status === 403) {
          setError('Unauthorized: You do not have permission to report bugs or your session has expired. Please log in as a Tester.');
          AuthService.logout();
          window.location.reload();
        } else if (err.response.data) {
          setError(err.response.data);
        } else {
          setError('Failed to report bug. Please try again.');
        }
      } else if (err.request) {
        setError('No response from server. Please check if the API is running.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <Card className="p-4 shadow-lg border-0" style={{ width: '100%', maxWidth: '600px', borderRadius: '20px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
        <Card.Body>
          <h2 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: '600' }}>Report a New Bug</h2>
          {error && <Alert variant="danger" className="rounded-pill">{error}</Alert>}
          {success && <Alert variant="success" className="rounded-pill">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="bugName">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Bug Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter bug name (e.g., Login button unresponsive)"
                value={name}
                onChange={(e) => setName(e.target.value.trim())}
                isInvalid={!!formErrors.name}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="bugDescription">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Provide a detailed description of the bug, including steps to reproduce."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                isInvalid={!!formErrors.description}
                required
                className="rounded-3 shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              variant="success"
              type="submit"
              className="w-100 rounded-pill mt-3 shadow"
              disabled={loading}
              style={{
                background: 'linear-gradient(45deg, #20c997, #00b894)',
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
                  <span className="ms-2">Reporting...</span>
                </>
              ) : (
                'Report Bug'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default BugReportForm;