import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Spinner, Alert, Button, Badge, Modal, Form } from 'react-bootstrap';
import AuthService from '../services/auth.service';

function BugList({ currentUserRole, currentUserId, onBugUpdated }) {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editAssignedToId, setEditAssignedToId] = useState('');
  const [editBugName, setEditBugName] = useState('');
  const [editBugDescription, setEditBugDescription] = useState('');
  const [programmers, setProgrammers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [formErrors, setFormErrors] = useState({ bugName: '', bugDescription: '' });

  const nameRegex = /^[a-zA-Z0-9][a-zA-Z0-9\s\-_.:]{1,48}[a-zA-Z0-9]$/;
  const descriptionRegex = /^[a-zA-Z0-9\s,.!?()-]{10,500}$/;
  const statusRegex = /^(New|Assigned|In Progress|Resolved|Closed)$/;

  const validateForm = () => {
    let isValid = true;
    const errors = { bugName: '', bugDescription: '' };

    if ((currentUserRole === "Tester" && selectedBug?.isModifiable) || currentUserRole === "Administrator") {
      if (!editBugName) {
        errors.bugName = 'Bug name is required.';
        isValid = false;
      } else if (!nameRegex.test(editBugName)) {
        errors.bugName = 'Bug name must be 3-50 characters, start and end with alphanumeric characters, and may include spaces, -, _, ., or :.';
        isValid = false;
      }

      if (!editBugDescription) {
        errors.bugDescription = 'Description is required.';
        isValid = false;
      } else if (!descriptionRegex.test(editBugDescription)) {
        errors.bugDescription = 'Description must be 10-500 characters and include only letters, numbers, spaces, or common punctuation (,.!?()-).';
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const authAxios = AuthService.getAuthAxios();
      const response = await authAxios.get('/api/Bugs');
      setBugs(response.data);
    } catch (err) {
      console.error('Failed to fetch bugs:', err);
      if (err.response && err.response.status === 401) {
        setError('Unauthorized: Please log in again.');
        AuthService.logout();
        window.location.reload();
      } else {
        setError('Failed to load bugs. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgrammers = useCallback(async () => {
    try {
      const authAxios = AuthService.getAuthAxios();
      if (currentUserRole === "Programmer" || currentUserRole === "Administrator") {
        const response = await authAxios.get('/api/Employees');
        const progList = response.data.filter(emp => emp.role === "Programmer");
        setProgrammers(progList);
      }
    } catch (err) {
      console.error('Failed to fetch programmers:', err);
    }
  }, [currentUserRole]);

  useEffect(() => {
    fetchBugs();
    fetchProgrammers();
  }, [fetchBugs, fetchProgrammers]);

  const handleEditClick = (bug) => {
    setSelectedBug(bug);
    setEditStatus(bug.status);
    setEditAssignedToId(bug.assignedToId || '');
    setEditBugName(bug.name);
    setEditBugDescription(bug.description);
    setModalError('');
    setFormErrors({ bugName: '', bugDescription: '' });
    setShowEditModal(true);
  };

  const handleAssignToMe = async (bug) => {
    setModalLoading(true);
    setModalError('');
    try {
      const authAxios = AuthService.getAuthAxios();
      const updatedBug = {
        ...bug,
        status: 'Assigned',
        assignedToId: currentUserId,
        isModifiable: false
      };
      delete updatedBug.reportedBy;
      delete updatedBug.assignedTo;

      await authAxios.put(`/api/Bugs/${bug.bugId}`, updatedBug);
      setModalLoading(false);
      fetchBugs();
      if (onBugUpdated) onBugUpdated();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to assign bug:', err);
      setModalError(err.response?.data || 'Failed to assign bug.');
      setModalLoading(false);
    }
  };

  const handleSaveBugChanges = async () => {
    setModalLoading(true);
    setModalError('');

    if (!validateForm()) {
      setModalLoading(false);
      return;
    }

    try {
      const authAxios = AuthService.getAuthAxios();
      const updatedBug = {
        ...selectedBug,
        name: editBugName,
        description: editBugDescription,
        status: editStatus,
        assignedToId: editAssignedToId === '' ? null : parseInt(editAssignedToId),
      };

      if (!statusRegex.test(editStatus)) {
        setModalError('Invalid status selected.');
        setModalLoading(false);
        return;
      }

      delete updatedBug.reportedBy;
      delete updatedBug.assignedTo;

      await authAxios.put(`/api/Bugs/${selectedBug.bugId}`, updatedBug);
      setModalLoading(false);
      fetchBugs();
      if (onBugUpdated) onBugUpdated();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update bug:', err);
      setModalError(err.response?.data || 'Failed to update bug. Check console for details.');
      setModalLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'New': return 'primary';
      case 'Assigned': return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved': return 'success';
      case 'Closed': return 'secondary';
      default: return 'light';
    }
  };

  const shouldShowActionsColumn = bugs.some(bug => {
    if (currentUserRole === "Programmer") {
      if (!bug.assignedToId || bug.assignedToId === currentUserId) return true;
    }
    if (currentUserRole === "Administrator") return true;
    if (currentUserRole === "Tester" && bug.reportedById === currentUserId && bug.isModifiable) return true;
    return false;
  });

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading bugs...</span>
        </Spinner>
        <p className="mt-2" style={{ color: '#34495e' }}>Loading bugs...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="rounded-pill">{error}</Alert>
        <Button
          variant="primary"
          onClick={fetchBugs}
          className="rounded-pill shadow"
          style={{
            background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)',
            border: 'none',
            padding: '10px 20px',
          }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <h2 className="mb-4 text-center" style={{ color: '#34495e', fontWeight: '600' }}>Bug List</h2>

      {bugs.length === 0 ? (
        <Alert variant="info" className="rounded-pill text-center mt-3">No bugs reported yet!</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm rounded-3" style={{ background: '#ffffff' }}>
          <thead style={{ background: 'linear-gradient(90deg, #2c3e50, #34495e)', color: '#ffffff' }}>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Reported By</th>
              <th>Assigned To</th>
              <th>Reported At</th>
              <th>Last Modified</th>
              {shouldShowActionsColumn && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {bugs.map((bug) => (
              <tr key={bug.bugId}>
                <td>{bug.bugId}</td>
                <td>{bug.name}</td>
                <td>{bug.description}</td>
                <td>
                  <Badge bg={getStatusVariant(bug.status)} className="p-2 rounded-pill">
                    {bug.status}
                  </Badge>
                </td>
                <td>{bug.reportedBy ? `${bug.reportedBy.firstName} ${bug.reportedBy.lastName} (${bug.reportedBy.role})` : 'N/A'}</td>
                <td>{bug.assignedTo ? `${bug.assignedTo.firstName} ${bug.assignedTo.lastName} (${bug.assignedTo.role})` : 'Unassigned'}</td>
                <td>{new Date(bug.reportedAt).toLocaleDateString()}</td>
                <td>{new Date(bug.lastModifiedAt).toLocaleDateString()}</td>
                {shouldShowActionsColumn && (
                  <td>
                    {currentUserRole === "Programmer" && !bug.assignedToId && (
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2 rounded-pill shadow-sm"
                        onClick={() => handleAssignToMe(bug)}
                        disabled={modalLoading}
                        style={{ background: 'linear-gradient(45deg, #20c997, #00b894)' }}
                      >
                        Assign to Me
                      </Button>
                    )}
                    {currentUserRole === "Programmer" && (bug.assignedToId === currentUserId || !bug.assignedToId) && (
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill shadow-sm"
                        onClick={() => handleEditClick(bug)}
                        style={{ background: 'linear-gradient(45deg, #17a2b8, #138496)' }}
                      >
                        Edit
                      </Button>
                    )}
                    {currentUserRole === "Administrator" && (
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill shadow-sm"
                        onClick={() => handleEditClick(bug)}
                        style={{ background: 'linear-gradient(45deg, #17a2b8, #138496)' }}
                      >
                        Edit
                      </Button>
                    )}
                    {currentUserRole === "Tester" && bug.reportedById === currentUserId && bug.isModifiable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-pill shadow-sm"
                        onClick={() => handleEditClick(bug)}
                        style={{ background: 'linear-gradient(45deg, #6c757d, #5a6268)' }}
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
          <Modal.Title style={{ color: '#34495e', fontWeight: '600' }}>Edit Bug: {selectedBug?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
          {modalError && <Alert variant="danger" className="rounded-pill">{modalError}</Alert>}
          <Form>
            {(currentUserRole === "Tester" && selectedBug?.isModifiable) || currentUserRole === "Administrator" ? (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Bug Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={editBugName}
                    onChange={(e) => setEditBugName(e.target.value.trim())}
                    isInvalid={!!formErrors.bugName}
                    required
                    className="rounded-pill shadow-sm"
                    style={{ borderColor: '#ced4da', padding: '12px' }}
                  />
                  <Form.Control.Feedback type="invalid" className="ms-2">
                    {formErrors.bugName}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={editBugDescription}
                    onChange={(e) => setEditBugDescription(e.target.value)}
                    isInvalid={!!formErrors.bugDescription}
                    required
                    className="rounded-3 shadow-sm"
                    style={{ borderColor: '#ced4da', padding: '12px' }}
                  />
                  <Form.Control.Feedback type="invalid" className="ms-2">
                    {formErrors.bugDescription}
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Bug Name</Form.Label>
                  <Form.Control type="text" value={selectedBug?.name || ''} disabled className="rounded-pill shadow-sm" style={{ padding: '12px' }} />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Description</Form.Label>
                  <Form.Control as="textarea" rows={5} value={selectedBug?.description || ''} disabled className="rounded-3 shadow-sm" style={{ padding: '12px' }} />
                </Form.Group>
              </>
            )}

            {(currentUserRole === "Programmer" || currentUserRole === "Administrator") ? (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Status</Form.Label>
                  <Form.Control
                    as="select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="rounded-pill shadow-sm"
                    style={{ padding: '12px' }}
                  >
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </Form.Control>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Assigned To</Form.Label>
                  <Form.Control
                    as="select"
                    value={editAssignedToId}
                    onChange={(e) => setEditAssignedToId(e.target.value)}
                    className="rounded-pill shadow-sm"
                    style={{ padding: '12px' }}
                  >
                    <option value="">Unassigned</option>
                    {programmers.map(prog => (
                      <option key={prog.employeeId} value={prog.employeeId}>
                        {prog.firstName} {prog.lastName} ({prog.username})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Status</Form.Label>
                  <Form.Control type="text" value={selectedBug?.status || ''} disabled className="rounded-pill shadow-sm" style={{ padding: '12px' }} />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ color: '#34495e' }}>Assigned To</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedBug?.assignedTo ? `${selectedBug.assignedTo.firstName} ${selectedBug.assignedTo.lastName}` : 'Unassigned'}
                    disabled
                    className="rounded-pill shadow-sm"
                    style={{ padding: '12px' }}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            className="rounded-pill shadow-sm"
            style={{ padding: '10px 20px' }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveBugChanges}
            disabled={modalLoading}
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
            {modalLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default BugList;