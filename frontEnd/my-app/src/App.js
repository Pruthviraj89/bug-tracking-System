import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import BugList from './components/BugList';
import BugReportForm from './components/BugReportForm';
import EmployeeList from './components/EmployeeList'; // Import the new component
import { Button, Container, Navbar, Nav, Alert } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentView, setCurrentView] = useState('bugList');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = jwtDecode(token);
        setIsAuthenticated(true);
        setUserRole(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        setUsername(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
        setUserId(parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']));
      } catch (e) {
        console.error("Failed to decode token:", e);
        localStorage.removeItem('jwtToken');
        setIsAuthenticated(false);
        setUserRole(null);
        setUsername(null);
        setUserId(null);
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const payload = jwtDecode(token);
        setUserRole(payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        setUsername(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
        setUserId(parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']));
        setCurrentView('bugList'); // Default view after login
        setSuccessMessage('Login successful!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (e) {
        console.error("Failed to decode token after login:", e);
        localStorage.removeItem('jwtToken');
        setIsAuthenticated(false);
        setUserRole(null);
        setUsername(null);
        setUserId(null);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
    setUserId(null);
    setCurrentView('bugList'); // Reset view on logout
    setSuccessMessage('Logged out successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Callback to refresh views after an action (bug or employee)
  const handleActionCompleted = () => {
    // For now, simply setting success message and letting components re-fetch on mount/props change
    setSuccessMessage('Action completed successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    // If you need more granular refresh, you'd pass a fetch function down to BugList/EmployeeList
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
          <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
            <Container>
              <Navbar.Brand href="#home">Bug Tracker</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link onClick={() => setCurrentView('bugList')} active={currentView === 'bugList'}>
                    Bugs
                  </Nav.Link>
                  {userRole === "Tester" && (
                    <Nav.Link onClick={() => setCurrentView('reportBug')} active={currentView === 'reportBug'}>
                      Report Bug
                    </Nav.Link>
                  )}
                  {userRole === "Administrator" && (
                    <Nav.Link onClick={() => setCurrentView('employees')} active={currentView === 'employees'}>
                      Employees
                    </Nav.Link>
                  )}
                </Nav>
                <Nav>
                  {username && <Navbar.Text className="me-3">Signed in as: <strong>{username} ({userRole})</strong></Navbar.Text>}
                  <Button variant="outline-light" onClick={handleLogout} className="rounded-pill">
                    Logout
                  </Button>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          <Container className="mt-4">
            {successMessage && <Alert variant="success" className="text-center">{successMessage}</Alert>}
            
            {currentView === 'bugList' && (
              <BugList
                currentUserRole={userRole}
                currentUserId={userId}
                onBugUpdated={handleActionCompleted}
              />
            )}
            {currentView === 'reportBug' && userRole === "Tester" && (
              <BugReportForm onBugReported={handleActionCompleted} />
            )}
            {currentView === 'employees' && userRole === "Administrator" && (
              <EmployeeList
                currentUserRole={userRole}
              />
            )}
          </Container>
        </>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
