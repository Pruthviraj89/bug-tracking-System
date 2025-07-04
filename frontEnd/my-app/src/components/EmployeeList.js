import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Button, Modal, Form, Badge } from 'react-bootstrap';
import AuthService from '../services/auth.service';
import BCrypt from 'bcryptjs';

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
  const [formRole, setFormRole] = useState('Programmer');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
  });

  const authAxios = AuthService.getAuthAxios();

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const nameRegex = /^[a-zA-Z\s]{1,50}$/;

  const validateForm = () => {
    let isValid = true;
    const errors = { username: '', password: '', email: '', firstName: '', lastName: '' };

    if (!formUsername) {
      errors.username = 'Username is required.';
      isValid = false;
    } else if (!usernameRegex.test(formUsername)) {
      errors.username = 'Username must be 3-20 characters, alphanumeric with - or _ allowed.';
      isValid = false;
    }

    if (!isEditing && !formPassword) {
      errors.password = 'Password is required for new employees.';
      isValid = false;
    } else if (formPassword && !passwordRegex.test(formPassword)) {
      errors.password = 'Password must be at least 8 characters, including an uppercase letter, lowercase letter, and number.';
      isValid = false;
    }

    if (formEmail && !emailRegex.test(formEmail)) {
      errors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!formFirstName) {
      errors.firstName = 'First name is required.';
      isValid = false;
    } else if (!nameRegex.test(formFirstName)) {
      errors.firstName = 'First name must be 1-50 letters or spaces.';
      isValid = false;
    }

    if (!formLastName) {
      errors.lastName = 'Last name is required.';
      isValid = false;
    } else if (!nameRegex.test(formLastName)) {
      errors.lastName = 'Last name must be 1-50 letters or spaces.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

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
    if (currentUserRole === "Administrator") {
      fetchEmployees();
    } else {
      setError('You must be an Administrator to view this page.');
      setLoading(false);
    }
  }, [currentUserRole]);

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
    setFormErrors({ username: '', password: '', email: '', firstName: '', lastName: '' });
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
    setFormPassword('');
    setModalError('');
    setFormErrors({ username: '', password: '', email: '', firstName: '', lastName: '' });
    setShowAddEditModal(true);
  };

  const handleSaveEmployee = async (event) => {
    event.preventDefault();
    setModalLoading(true);
    setModalError('');

    if (!validateForm()) {
      setModalLoading(false);
      return;
    }

    const employeeData = {
      username: formUsername,
      email: formEmail,
      role: formRole,
      firstName: formFirstName,
      lastName: formLastName,
    };

    if (formPassword) {
      employeeData.passwordHash = BCrypt.hashSync(formPassword, 10);
    } else if (!isEditing) {
      setModalError('Password is required for new employees.');
      setModalLoading(false);
      return;
    }

    try {
      if (isEditing) {
        employeeData.employeeId = currentEmployee.employeeId;
        await authAxios.put(`/api/Employees/${currentEmployee.employeeId}`, employeeData);
      } else {
        await authAxios.post('/api/Employees', employeeData);
      }
      setShowAddEditModal(false);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to save employee:', err);
      setModalError(err.response?.data || 'Failed to save employee.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await authAxios.delete(`/api/Employees/${employeeId}`);
        fetchEmployees();
      } catch (err) {
        console.error('Failed to delete employee:', err);
        setError(err.response?.data || 'Failed to delete employee.');
      }
    }
  };

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
        <p className="mt-2" style={{ color: '#34495e' }}>Loading employees...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="rounded-pill">{error}</Alert>
        {currentUserRole === "Administrator" && (
          <Button
            variant="primary"
            onClick={fetchEmployees}
            className="rounded-pill shadow"
            style={{
              background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
              border: 'none',
              padding: '10px 20px',
            }}
          >
            Retry
          </Button>
        )}
      </Container>
    );
  }

  if (currentUserRole !== "Administrator") {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="rounded-pill text-center">You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center" style={{ color: '#34495e', fontWeight: '600' }}>Employee Management</h2>
      <div className="d-flex justify-content-end mb-4">
        <Button
          variant="primary"
          onClick={handleAddEmployee}
          className="rounded-pill shadow"
          style={{
            background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
            border: 'none',
            padding: '10px 20px',
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
          Add New Employee
        </Button>
      </div>
      {employees.length === 0 ? (
        <Alert variant="info" className="rounded-pill text-center">No employees found.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm rounded-3" style={{ background: '#ffffff' }}>
          <thead style={{ background: 'linear-gradient(90deg, #2c3e50, #34495e)', color: '#ffffff' }}>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Role</th>
              
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
               
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showAddEditModal} onHide={() => setShowAddEditModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
          <Modal.Title style={{ color: '#34495e', fontWeight: '600' }}>{isEditing ? 'Edit Employee' : 'Add New Employee'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
          {modalError && <Alert variant="danger" className="rounded-pill">{modalError}</Alert>}
          <Form onSubmit={handleSaveEmployee}>
            <Form.Group className="mb-4" controlId="formUsername">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Username</Form.Label>
              <Form.Control
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value.trim())}
                isInvalid={!!formErrors.username}
                required
                disabled={isEditing}
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.username}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</Form.Label>
              <Form.Control
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                isInvalid={!!formErrors.password}
                required={!isEditing}
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formFirstName">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>First Name</Form.Label>
              <Form.Control
                type="text"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value.trim())}
                isInvalid={!!formErrors.firstName}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.firstName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formLastName">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value.trim())}
                isInvalid={!!formErrors.lastName}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.lastName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formEmail">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value.trim())}
                isInvalid={!!formErrors.email}
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              />
              <Form.Control.Feedback type="invalid" className="ms-2">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formRole">
              <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Role</Form.Label>
              <Form.Control
                as="select"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                required
                className="rounded-pill shadow-sm"
                style={{ borderColor: '#ced4da', padding: '12px' }}
              >
                <option value="Administrator">Administrator</option>
                <option value="Tester">Tester</option>
                <option value="Programmer">Programmer</option>
              </Form.Control>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-pill mt-3 shadow"
              disabled={modalLoading}
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