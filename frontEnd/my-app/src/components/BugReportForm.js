import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import AuthService from '../services/auth.service'; // Import the auth service
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode for client-side token decoding

function BugReportForm({ onBugReported }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportedById, setReportedById] = useState(null); // Will get this from JWT
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const authAxios = AuthService.getAuthAxios(); // Get the authenticated Axios instance

  useEffect(() => {
    // Decode JWT to get the current user's ID for reportedById
    const token = AuthService.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log("BugReportForm: Decoded JWT Payload:", decodedToken); // Log full payload for debugging

        // Access the nameid claim using its full URI
        // "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        const idFromToken = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        
        if (idFromToken) {
          setReportedById(parseInt(idFromToken)); // Parse it to an integer
          console.log("BugReportForm: Extracted reportedById:", parseInt(idFromToken));
        } else {
          setError("User ID claim not found in token.");
          console.error("BugReportForm: User ID claim 'nameidentifier' not found in token.");
        }
      } catch (err) {
        console.error("BugReportForm: Failed to decode token:", err);
        setError("Could not get user ID from token. Please log in again.");
        AuthService.logout();
        // Optionally reload or redirect to login
      }
    } else {
      setError("No authentication token found. Please log in.");
      AuthService.logout();
      // Optionally reload or redirect to login
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    console.log("BugReportForm: Submitting bug with reportedById:", reportedById); // Log before submission

    if (!reportedById || isNaN(reportedById)) { // Check for null/undefined and NaN
      setError("User ID not available or invalid. Cannot report bug.");
      setLoading(false);
      return;
    }

    try {
      const bugData = {
        name,
        description,
        reportedById,
        status: 'New', // Default status
        isModifiable: true, // Default for new bugs
      };

      const response = await authAxios.post('/api/Bugs', bugData);
      setSuccess('Bug reported successfully!');
      setName(''); // Clear form fields
      setDescription('');
      console.log('Bug reported:', response.data);
      if (onBugReported) {
        onBugReported(); // Notify parent component (e.g., to refresh bug list)
      }
    } catch (err) {
      console.error('Failed to report bug:', err);
      if (err.response) {
        console.error("BugReportForm: API Error Response:", err.response.data); // Log API error response
        if (err.response.status === 401 || err.response.status === 403) {
          setError('Unauthorized: You do not have permission to report bugs or your session has expired. Please log in as a Tester.');
          AuthService.logout();
          window.location.reload();
        } else if (err.response.data) {
          setError(err.response.data); // Display specific error message from API
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
      <Card className="p-4 shadow-lg" style={{ width: '100%', maxWidth: '600px', borderRadius: '15px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Report a New Bug</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="bugName">
              <Form.Label>Bug Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter bug name (e.g., Login button unresponsive)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="bugDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Provide a detailed description of the bug, including steps to reproduce."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="rounded-3"
              />
            </Form.Group>

            <Button
              variant="success"
              type="submit"
              className="w-100 rounded-pill mt-3"
              disabled={loading}
              style={{
                background: 'linear-gradient(45deg, #28a745, #218838)',
                border: 'none',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
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
