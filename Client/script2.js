const baseURL2 = "http://44.207.72.3:8082/api";

function addTask() {
    const task = document.getElementById('task').value;
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    const formData = {
        username: username,
        task: task
    };

    fetch(`${baseURL2}/addTask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadTasks(username);
            document.getElementById('task').value = '';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error adding task:', error);
        alert('An error occurred while adding the task. Please try again.');
    });
}


function loadTasks(username) {
    fetch(`${baseURL2}/tasks?username=${username}`)
        .then(response => response.json())
        .then(tasks => {
            console.log('Tasks fetched:', tasks);
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';

            tasks.forEach(task => {
                const li = document.createElement('li');
                li.textContent = task.task;

                if (task.status === 2) {
                    li.classList.add('done');
                }

                const doneButton = document.createElement("button");
                doneButton.innerHTML = '<i class="fas fa-check"></i>';
                doneButton.className = "done-button";
                doneButton.onclick = function() {
                    updateTaskStatus(username, task.task_id, li);
                };

                const deleteButton = document.createElement("button");
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.className = "delete-button";
                deleteButton.onclick = function() {
                    const confirmDelete = confirm("Are you sure you want to delete this task?");
                    if (confirmDelete) {
                        deleteTask(username, task.task_id, li);
                    }
                };

                const descriptionButton = document.createElement("button");
                descriptionButton.innerHTML = '<i class="fas fa-info-circle"></i>';
                descriptionButton.className = "description-button";
                descriptionButton.onclick = function() {
                    if (!li.querySelector('.description-container')) {
                        showDescription(username, task.task_id, li);
                    }
                };

                li.appendChild(doneButton);
                li.appendChild(deleteButton);
                li.appendChild(descriptionButton);
                taskList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
            alert('An error occurred while fetching tasks. Please try again.');
        });
}

function updateTaskStatus(username, task_id, li) {
    console.log('Updating task:', { username, task_id });
    fetch(`${baseURL2}/updateTaskStatus`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, task_id })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task status.');
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        if (data.success && data.status === 2) {
            li.classList.toggle("done");
        } else if(data.success && data.status === 1) {
            li.classList.remove("done");
        }
    })
    .catch(error => {
        console.error('Error updating task status:', error);
        alert('An error occurred while updating the task status. Please try again.');
    });
}

function deleteTask(username, task_id, li) {
    fetch(`${baseURL2}/deleteTask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, task_id })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete task.');
        }
        li.remove();
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        alert('An error occurred while deleting the task. Please try again.');
    });
}

function showDescription(username, task_id, li) {
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'description-container';

    const textBox = document.createElement('textarea');
    textBox.rows = 2;
    textBox.cols = 20;

    const saveButton = document.createElement('button');
    saveButton.innerText = 'Save';
    saveButton.onclick = function() {
        const descriptionText = textBox.value;
        updateTaskDescription(username, task_id, descriptionText, li);
        descriptionContainer.remove();
    };

    descriptionContainer.appendChild(textBox);
    descriptionContainer.appendChild(document.createElement('br'));
    descriptionContainer.appendChild(saveButton);
    li.appendChild(descriptionContainer);


    fetch(`${baseURL2}/tasksDescriptionPull?username=${username}&task_id=${task_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(description => {
            textBox.value = description.taskDescription || '';
        })
        .catch(error => {
            console.error('Error fetching task descriptions:', error);
            alert('An error occurred while fetching task descriptions. Please try again.');
        });
}

function updateTaskDescription(username, task_id, taskDescription, li) {
    fetch(`${baseURL2}/updateTaskDescription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, task_id, taskDescription })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task description.');
        
        } else {
            const descriptionDiv = document.createElement('div');
            descriptionDiv.textContent = taskDescription;

        }
    })
    .catch(error => {
        console.error('Error updating task description:', error);
        alert('An error occurred while updating the task description. Please try again.');
    });
}
