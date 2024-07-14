// Imports
const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();

const port = 3000;
const mongoURL = 'mongodb://local-mongo:27017';
const MongoDB = "task_appMongo";

// Create a new MongoClient
const mongoclient = new MongoClient(mongoURL);

const pgClient = new Client({
  user: 'postgres',
  host: 'local-postgres',
  database: 'task_app',
  password: 'password',
  port: 5432,
});

pgClient.connect()
    .then(() => console.log('Connected to the database pg'))
    .catch(err => console.error('Error connecting to the database:', err));

let taskDescriptionCollection;
mongoclient.connect()
    .then(() => {
        console.log('Connected successfully to MongoDB');
        const db = mongoclient.db(MongoDB);
        taskDescriptionCollection = db.collection('taskDescription');
    })
    .catch(err => console.log('Error connecting to the database:', err));

//serve static files in an Express application.
//app.use(express.static(path.join(__dirname, '..', 'Client')));

app.listen(port, () => console.info(`App listening on port ${port}`));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))


//routes
//app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, '..', 'Client', 'start.html'))
//});

//app.get('/newUser', (req, res) => {
    //res.sendFile(path.join(__dirname, '..', 'Client', 'start.html'))
//});

//app.get('/test', (req, res) => {
    //res.send('Backend is working!');
//});


app.post('/login', async (req, res) => {
    const { username, password} = req.body;
       
    try {
        const query = 'SELECT password FROM users WHERE username = $1';
        const values = [username];
        const result = await pgClient.query(query, values);

        if (result.rows.length === 0) {
            // User not found
            return res.status(400).json({ success: false, message: 'Username incorrect' });
        }

        const storedPassword = result.rows[0].password;

        const isValid  = await bcrypt.compare(password,storedPassword);
        if (isValid) {
            // User found, password matches
            res.status(200).json({ success: true });
        } else {
            // User not found or password doesn't match
            res.status(400).json({ success: false, message: 'Password is incorrect' });
        }
    } catch (err) {
        console.error('Error checking user:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.post('/newUser', async (req, res) => {
    const { firstName, lastName, username, password } = req.body;
    const hash = await bcrypt.hash(password,10);
    
    const insertQuery = 'INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4)';
    const valuesToInsert = [firstName, lastName, username, hash];

    try {
        await pgClient.query(insertQuery, valuesToInsert);
        console.log('New user inserted successfully');
        
        // Send a JSON response with the new user's username
        res.json({ success: true, username: username });
    } catch (insertErr) {
        console.error('Error inserting data:', insertErr);
        res.sendStatus(500); // Send a 500 Internal Server Error response
    }
});

app.get('/tasks', async (req, res) => {
    const { username } = req.query;
    try {
        const data = await pgClient.query('SELECT * FROM tasks WHERE username = $1', [username]);
        res.status(200).send(data.rows);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});


app.post('/addTask', async (req, res) => {
    const { username, task } = req.body;
    const insertQuery = 'INSERT INTO tasks (username, task) VALUES ($1, $2)';
    const valuesToInsert = [username, task];
    
    try {
        await pgClient.query(insertQuery, valuesToInsert);
        console.log('New task inserted successfully');
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error adding task:', err);
        res.status(500);
        }
});

app.post('/updateTaskStatus', async (req, res) => {
    const { username, task_id } = req.body;
    const updateQuery = 'UPDATE tasks SET status = CASE WHEN status = 1 THEN 2 WHEN status = 2 THEN 1 END WHERE username = $1 AND task_id = $2 RETURNING STATUS';
    const valuesToUpdate = [username, task_id];
    try {
        const result = await pgClient.query(updateQuery, valuesToUpdate);
        const updatedStatus = result.rows[0].status;
        console.log(updatedStatus);
        console.log('Task status updated successfully');

        res.status(200).json({ success: true, status: updatedStatus});
    } catch (err) {
        console.error('Error editing task:', err);
        res.status(500);
    }
  });

app.post('/deleteTask', async (req, res) => {
    const { username, task_id } = req.body;
    const deleteQuery = 'DELETE FROM tasks WHERE username = $1 AND task_id = $2';
    const valuesTodelete = [username, task_id];
    
    try {
        await pgClient.query(deleteQuery, valuesTodelete);
        console.log('Deleted task successfully from pg');
        await taskDescriptionCollection.deleteOne({ username: username, task_id: task_id });
        console.log('Deleted task successfully from mongo');

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500);
        }
});

app.get('/tasksDescriptionPull', async (req, res) => {
    const { username, task_id } = req.query;

    try {
        const taskDescription = await taskDescriptionCollection.findOne(
            { username: username, task_id: Number(task_id) }, // Ensure task_id is treated as a number
            { projection: { taskDescription: 1, _id: 0 } } // Use projection to return only the taskDescription field
        );
        if (taskDescription) {
            res.status(200).json(taskDescription);
        } else {
            res.status(404).json({ success: false, message: 'Task description not found' });
        }
    } catch (err) {
        console.error('Error fetching task description:', err);
        res.status(500).json({ success: false, message: 'Error fetching task description' });
    }
});

app.post('/updateTaskDescription', async (req, res) => {
    const { username, task_id, taskDescription } = req.body;

    try {
        // Check if the task exists
        const firstcheck = await taskDescriptionCollection.findOne({ username: username, task_id: task_id });

        if (!firstcheck) {
            await taskDescriptionCollection.insertOne({ username: username, task_id: task_id, taskDescription: taskDescription });
            res.status(200).send('Added new task info in mongo');
        } else {
            // Task exists, update the description
            const result = await taskDescriptionCollection.updateOne(
                { username: username, task_id: task_id }, // Filter criteria
                { $set: { taskDescription: taskDescription } } // Update action
            );

            if (result.matchedCount === 0) {
                res.status(404).send('Task not found');
            } else {
                res.status(200).send('Task description updated successfully');
            }
        }
    } catch (err) {
        console.error('Error updating task description in MongoDB:', err);
        res.status(500).send('Error updating task description in MongoDB');
    }
});
