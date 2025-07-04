import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import BugList from './components/BugList';
import BugReportForm from './components/BugReportForm';
import EmployeeList from './components/EmployeeList';
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
        setCurrentView('bugList');
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
    setCurrentView('bugList');
    setSuccessMessage('Logged out successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleActionCompleted = () => {
    setSuccessMessage('Action completed successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
          <Navbar bg="dark" variant="dark" expand="lg" className="shadow-lg" style={{ background: 'linear-gradient(90deg, #2c3e50, #34495e)' }}>
            <Container>
              <Navbar.Brand href="#home" style={{ fontWeight: '600', color: '#20c997' }}>Bug Tracker</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link
                    onClick={() => setCurrentView('bugList')}
                    active={currentView === 'bugList'}
                    className="mx-2"
                    style={{ color: currentView === 'bugList' ? '#20c997' : '#ffffff', fontWeight: '500' }}
                  >
                    Bugs
                  </Nav.Link>
                  {userRole === "Tester" && (
                    <Nav.Link
                      onClick={() => setCurrentView('reportBug')}
                      active={currentView === 'reportBug'}
                      className="mx-2"
                      style={{ color: currentView === 'reportBug' ? '#20c997' : '#ffffff', fontWeight: '500' }}
                    >
                      Report Bug
                    </Nav.Link>
                  )}
                  {userRole === "Administrator" && (
                    <Nav.Link
                      onClick={() => setCurrentView('employees')}
                      active={currentView === 'employees'}
                      className="mx-2"
                      style={{ color: currentView === 'employees' ? '#20c997' : '#ffffff', fontWeight: '500' }}
                    >
                      Employees
                    </Nav.Link>
                  )}
                </Nav>
                <Nav>
                  {username && (
                    <Navbar.Text className="me-3" style={{ color: '#e9ecef' }}>
                      Signed in as: <strong>{username} ({userRole})</strong>
                    </Navbar.Text>
                  )}
                  <Button
                    variant="outline-light"
                    onClick={handleLogout}
                    className="rounded-pill"
                    style={{
                      borderColor: '#20c997',
                      color: '#20c997',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#20c997';
                      e.target.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#20c997';
                    }}
                  >
                    Logout
                  </Button>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          <Container className="mt-5">
            {successMessage && <Alert variant="success" className="rounded-pill text-center">{successMessage}</Alert>}
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
              <EmployeeList currentUserRole={userRole} />
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