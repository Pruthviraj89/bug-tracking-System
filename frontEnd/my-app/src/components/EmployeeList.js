import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Modal, Form, Badge } from 'react-bootstrap';
import AuthService from '../services/auth.service';
import BCrypt from 'bcryptjs'; // For client-side password hashing (optional, but good for consistency)

function EmployeeList({ currentUserRole }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Programmer'); // Default role
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const authAxios = AuthService.getAuthAxios();

  // Function to fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.get('/api/Employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      if (err.response && err.response.status === 401) {
        setError('Unauthorized: Please log in again.');
        AuthService.logout();
        window.location.reload();
      } else if (err.response && err.response.status === 403) {
        setError('Forbidden: You do not have permission to view employees.');
      } else {
        setError('Failed to load employees. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch employees if the current user is an Administrator
    if (currentUserRole === "Administrator") {
      fetchEmployees();
    } else {
      setError('You must be an Administrator to view this page.');
      setLoading(false);
    }
  }, [currentUserRole]); // Re-fetch if role changes

  // Handle opening the Add/Edit modal
  const handleAddEmployee = () => {
    setIsEditing(false);
    setCurrentEmployee(null);
    setFormUsername('');
    setFormPassword('');
    setFormEmail('');
    setFormRole('Programmer');
    setFormFirstName('');
    setFormLastName('');
    setModalError('');
    setShowAddEditModal(true);
  };

  const handleEditEmployee = (employee) => {
    setIsEditing(true);
    setCurrentEmployee(employee);
    setFormUsername(employee.username);
    setFormEmail(employee.email || '');
    setFormRole(employee.role);
    setFormFirstName(employee.firstName);
    setFormLastName(employee.lastName);
    setFormPassword(''); // Password is not pre-filled for security
    setModalError('');
    setShowAddEditModal(true);
  };

  // Handle saving (adding or updating) an employee
  const handleSaveEmployee = async (event) => {
    event.preventDefault();
    setModalLoading(true);
    setModalError('');

    const employeeData = {
      username: formUsername,
      email: formEmail,
      role: formRole,
      firstName: formFirstName,
      lastName: formLastName,
    };

    // Only include passwordHash if creating or if password field is not empty during edit
    if (formPassword) {
      // Hash password client-side before sending (optional, but adds a layer)
      // Note: Backend will re-hash, but this prevents plain text over network if not HTTPS
      // For production, ensure HTTPS is always enforced.
      // BCrypt.hashSync is synchronous, fine for small client-side ops.
      employeeData.passwordHash = BCrypt.hashSync(formPassword, 10); 
    } else if (!isEditing) {
      // If adding a new employee, password is required
      setModalError('Password is required for new employees.');
      setModalLoading(false);
      return;
    }

    try {
      if (isEditing) {
        // Update existing employee
        employeeData.employeeId = currentEmployee.employeeId; // Include ID for PUT
        await authAxios.put(`/api/Employees/${currentEmployee.employeeId}`, employeeData);
      } else {
        // Add new employee
        await authAxios.post('/api/Employees', employeeData);
      }
      setShowAddEditModal(false);
      fetchEmployees(); // Refresh the list
    } catch (err) {
      console.error('Failed to save employee:', err);
      setModalError(err.response?.data || 'Failed to save employee.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle deleting an employee
  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await authAxios.delete(`/api/Employees/${employeeId}`);
        fetchEmployees(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete employee:', err);
        setError(err.response?.data || 'Failed to delete employee.');
      }
    }
  };

  // Helper for role badge variant
  const getRoleVariant = (role) => {
    switch (role) {
      case 'Administrator': return 'danger';
      case 'Tester': return 'info';
      case 'Programmer': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading employees...</span>
        </Spinner>
        <p className="mt-2">Loading employees...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        {currentUserRole === "Administrator" && <Button variant="primary" onClick={fetchEmployees}>Retry</Button>}
      </Container>
    );
  }

  // Only render if current user is an Administrator
  if (currentUserRole !== "Administrator") {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="text-center">You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Employee Management</h2>
      <div className="d-flex justify-content-end mb-3">
        <Button variant="primary" onClick={handleAddEmployee} className="rounded-pill">
          Add New Employee
        </Button>
      </div>
      {employees.length === 0 ? (
        <Alert variant="info" className="text-center">No employees found.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm rounded-3 overflow-hidden">
          <thead className="bg-primary text-white">
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employeeId}>
                <td>{employee.employeeId}</td>
                <td>{employee.username}</td>
                <td>{employee.firstName}</td>
                <td>{employee.lastName}</td>
                <td>{employee.email || 'N/A'}</td>
                <td><Badge bg={getRoleVariant(employee.role)} className="p-2 rounded-pill">{employee.role}</Badge></td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2 rounded-pill"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => handleDeleteEmployee(employee.employeeId)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Employee Modal */}
      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Employee' : 'Add New Employee'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form onSubmit={handleSaveEmployee}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                required
                disabled={isEditing} // Username cannot be changed when editing
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</Form.Label>
              <Form.Control
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required={!isEditing} // Password required only for new employees
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formFirstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                required
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formLastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                required
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="rounded-pill"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                required
                className="rounded-pill"
              >
                <option value="Administrator">Administrator</option>
                <option value="Tester">Tester</option>
                <option value="Programmer">Programmer</option>
              </Form.Control>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill mt-3"
              disabled={modalLoading}
              style={{
                background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
                border: 'none',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {modalLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">{isEditing ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Add Employee'
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default EmployeeList;
