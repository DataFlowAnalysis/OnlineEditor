import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';


const app = express();
const port = 3002;


const modelFilePath = process.argv[2];  // The file path passed during server start

if (!modelFilePath) {
    console.error('Please provide a file path as an argument when starting the server.');
    process.exit(1);  // Exit the process if no file path is provided
}

app.use(cors());

// Endpoint to serve a local file
app.get('/download-file', (req, res) => {
    const filePath = modelFilePath;  // Change this to the path of the file you want to serve

    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        // Send the file as a response
        res.sendFile(filePath);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.use(bodyParser.json({ limit: '1000mb'}));

// Endpoint to receive the JSON data
app.post('/save-json', (req, res) => {
    const jsonData = req.body;

    // Write the received JSON data back to the original file
    fs.writeFile(modelFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error saving the file:', err);
            return res.status(500).send('Error saving the file');
        }
        console.log('File saved successfully');
        res.status(200).send('JSON saved successfully');
    });
});

