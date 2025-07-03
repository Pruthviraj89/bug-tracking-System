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

  // Function to fetch bugs
  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Get the authenticated Axios instance INSIDE the useCallback
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
  }, []); // No dependencies related to filters/sorts here

  // Function to fetch programmers for assignment dropdown
  const fetchProgrammers = useCallback(async () => {
    try {
      // Get the authenticated Axios instance INSIDE the useCallback
      const authAxios = AuthService.getAuthAxios(); 

      if (currentUserRole === "Programmer" || currentUserRole === "Administrator") {
        const response = await authAxios.get('/api/Employees');
        const progList = response.data.filter(emp => emp.role === "Programmer");
        setProgrammers(progList);
      }
    } catch (err) {
      console.error('Failed to fetch programmers:', err);
    }
  }, [currentUserRole]); // authAxios is no longer a dependency here

  useEffect(() => {
    fetchBugs(); // Initial fetch
    fetchProgrammers(); // Fetch programmers when component mounts
  }, [fetchBugs, fetchProgrammers]); // Corrected: Added fetchBugs and fetchProgrammers to dependencies

  // Handle opening the edit modal
  const handleEditClick = (bug) => {
    setSelectedBug(bug);
    setEditStatus(bug.status);
    setEditAssignedToId(bug.assignedToId || '');
    setEditBugName(bug.name);
    setEditBugDescription(bug.description);
    setModalError('');
    setShowEditModal(true);
  };

  // Handle assigning bug to current programmer
  const handleAssignToMe = async (bug) => {
    setModalLoading(true);
    setModalError('');
    try {
      const authAxios = AuthService.getAuthAxios(); // Get authAxios for this specific action
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
      fetchBugs(); // Re-fetch bugs to update the list with new assignment
      if (onBugUpdated) onBugUpdated();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to assign bug:', err);
      setModalError(err.response?.data || 'Failed to assign bug.');
      setModalLoading(false);
    }
  };

  // Handle saving changes from the edit modal
  const handleSaveBugChanges = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const authAxios = AuthService.getAuthAxios(); // Get authAxios for this specific action
      const updatedBug = {
        ...selectedBug,
        name: editBugName,
        description: editBugDescription,
        status: editStatus,
        assignedToId: editAssignedToId === '' ? null : parseInt(editAssignedToId),
      };

      delete updatedBug.reportedBy;
      delete updatedBug.assignedTo;

      await authAxios.put(`/api/Bugs/${selectedBug.bugId}`, updatedBug);
      setModalLoading(false);
      fetchBugs(); // Re-fetch bugs to update the list with new changes
      if (onBugUpdated) onBugUpdated();
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update bug:', err);
      setModalError(err.response?.data || 'Failed to update bug. Check console for details.');
      setModalLoading(false);
    }
  };

  // Helper function to get Bootstrap variant for status badge
  const getStatusVariant = (status) => {
    switch (status) {
      case 'New':
        return 'primary';
      case 'Assigned':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'secondary';
      default:
        return 'light';
    }
  };

  // Determine if the "Actions" column should be visible at all
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
        <p className="mt-2">Loading bugs...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={fetchBugs}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center">Bug List</h2>

      {bugs.length === 0 ? (
        <Alert variant="info" className="text-center mt-3">No bugs reported yet!</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm rounded-3 overflow-hidden">
          <thead className="bg-primary text-white">
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
                    {/* Programmer: Assign to Me (if unassigned) */}
                    {currentUserRole === "Programmer" && !bug.assignedToId && (
                      <Button
                        variant="success"
                        size="sm"
                        className="me-2 rounded-pill"
                        onClick={() => handleAssignToMe(bug)}
                        disabled={modalLoading}
                      >
                        Assign to Me
                      </Button>
                    )}
                    {/* Programmer: Edit (if assigned to current user, or if unassigned - to assign) */}
                    {currentUserRole === "Programmer" && (bug.assignedToId === currentUserId || !bug.assignedToId) && (
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleEditClick(bug)}
                      >
                        Edit
                      </Button>
                    )}
                    {/* Administrator: Edit any bug */}
                    {currentUserRole === "Administrator" && (
                      <Button
                        variant="info"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleEditClick(bug)}
                      >
                        Edit
                      </Button>
                    )}
                    {/* Tester: Edit their own unassigned bugs */}
                    {currentUserRole === "Tester" && bug.reportedById === currentUserId && bug.isModifiable && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleEditClick(bug)}
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

      {/* Bug Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Bug: {selectedBug?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            {/* Bug Name and Description (editable only by Testers on modifiable bugs, or Admins) */}
            {(currentUserRole === "Tester" && selectedBug?.isModifiable) || currentUserRole === "Administrator" ? (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Bug Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={editBugName}
                            onChange={(e) => setEditBugName(e.target.value)}
                            required
                            className="rounded-pill"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={editBugDescription}
                            onChange={(e) => setEditBugDescription(e.target.value)}
                            required
                            className="rounded-3"
                        />
                    </Form.Group>
                </>
            ) : (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Bug Name</Form.Label>
                        <Form.Control type="text" value={selectedBug?.name || ''} disabled className="rounded-pill" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={5} value={selectedBug?.description || ''} disabled className="rounded-3" />
                    </Form.Group>
                </>
            )}

            {/* Status and Assigned To (editable only by Programmers or Admins) */}
            {(currentUserRole === "Programmer" || currentUserRole === "Administrator") ? (
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                            as="select"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="rounded-pill"
                        >
                            <option value="New">New</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </Form.Control>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Assigned To</Form.Label>
                        <Form.Control
                            as="select"
                            value={editAssignedToId}
                            onChange={(e) => setEditAssignedToId(e.target.value)}
                            className="rounded-pill"
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
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control type="text" value={selectedBug?.status || ''} disabled className="rounded-pill" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Assigned To</Form.Label>
                        <Form.Control type="text" value={selectedBug?.assignedTo ? `${selectedBug.assignedTo.firstName} ${selectedBug.assignedTo.lastName}` : 'Unassigned'} disabled className="rounded-pill" />
                    </Form.Group>
                </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="rounded-pill">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveBugChanges}
            disabled={modalLoading}
            className="rounded-pill"
          >
            {modalLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default BugList;
