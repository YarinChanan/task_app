const baseURL = "http://44.207.72.3:8082/api";


function logOut() {
    const userConfirmation = confirm("Are you sure you want to log out?");
    if (userConfirmation) {
        window.location.href = 'start.html';
    }
}

function entery() {
    const username_enter = document.getElementById('username').value;
    const password_enter = document.getElementById('password').value;

    const formData_enter = {
        username: username_enter,
        password: password_enter
    };

    // Send POST request to /login endpoint
    fetch(`${baseURL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData_enter)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Login successful, redirect to tasks page
            window.location.href = `tasks.html?username=${username_enter}`;
            
        } else {
            // Login failed, show an alert
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while logging in. Please try again.');
    });
}

function newUser() {
    window.location.href = 'newUser.html';
}

function NewUser() {
    const firstName = document.getElementById('fname').value;
    const lastName = document.getElementById('lname').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const formData_new = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password
    };

    fetch(`${baseURL}/newUser`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData_new)
    })

    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        window.location.href = `tasks.html?username=${username}`;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}