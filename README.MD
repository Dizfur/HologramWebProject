# Renewable Energy Educational Application Documentation

## Project Overview

The **Renewable Energy Educational Application** is an interactive web-based platform designed to educate users about various types of renewable energy sources, including solar, wind, hydropower, and geothermal energy. The application allows users to select an energy type, view informative content, and play related videos, which can also be projected onto a hologram box for a more immersive learning experience.

## Technologies Used

1. **HTML**: The foundational markup language used to create the structure of the web application.
2. **CSS**: Used for styling the application, ensuring a visually appealing and user-friendly interface.
3. **JavaScript**: Provides interactivity and dynamic content updates, managing user interactions and video playback.
4. **WebSocket**: Enables real-time communication between the client and the server, allowing instant feedback and control over video playback.
5. **Images and Icons**: Various images and icons represent different renewable energy sources, enhancing the user experience through visual elements.

## How to Use

1. **Access the Application**:
   - Open the application in a web browser by navigating to the designated URL.

2. **Select an Energy Type**:
   - Click on one of the energy type icons (solar, wind, hydropower, or geothermal). The selected icon will highlight, and relevant information will be displayed in the preview section.

3. **View Information**:
   - The application provides detailed content about the selected energy type, including its benefits, facts, and statistics.

4. **Play Videos**:
   - Click the **"Play Animation"** button to play the video associated with the selected energy type. The video will play on another device, allowing users to project the content onto a hologram box.

5. **Zoom Functionality**:
   - Use the **"Zoom In/Out"** button to activate zoom functionality (to be implemented in future versions).

6. **Generate Reports**:
   - Click the **"Report"** button to simulate the report generation process. A modal will appear, showing the steps involved in creating the report.

## Benefits

- **Educational**: Informs users about renewable energy sources and their significance in combating climate change and promoting sustainability.
- **Interactive**: Engages users with dynamic content and video playback, enhancing the learning experience.
- **Real-Time Communication**: Utilizes WebSocket for instant communication, ensuring smooth and responsive interactions.
- **Hologram Projection**: Allows video content to be projected onto a hologram box, making the learning experience more immersive and visually stimulating.

## JavaScript Overview

JavaScript is a versatile programming language used for enhancing web pages and creating interactive web applications. In this project, JavaScript manages user interactions, dynamically updates content, and enables real-time communication with the server through WebSockets.

### Key Features of JavaScript in the Application

1. **User Interaction Management**:
   - Listens for user interactions, such as clicking on energy type icons, and handles these events to update the user interface.

2. **Dynamic Content Updates**:
   - Modifies the DOM dynamically, allowing the content of the webpage to change without requiring a full page reload.

3. **Video Playback Management**:
   - Manages the selection and playback of videos associated with each energy type, sending commands to the WebSocket server.

### JavaScript Code Structure

Key functions implemented in the JavaScript code include:

- **`toggleIcon(iconElement, type, video)`**:
  - Toggles the selection state of the icon, updates the selected video, and displays the corresponding preview content.

- **`showPreview(type, video)`**:
  - Populates the preview section with information related to the selected energy type.

- **`playAnimation()`**:
  - Sends a message to the WebSocket server to play the selected video and updates the last played video information displayed on the page.

- **`generateReport()`** and **`closeReportModal()`**:
  - Handle the display of the report generation modal, simulating the process of generating a report.

### Example Code Snippet

Here’s a snippet illustrating how JavaScript handles icon toggling and video playback:

```javascript
function toggleIcon(iconElement, type, video) {
    // Check if the clicked icon is already selected
    if (selectedIcon === iconElement) {
        // Unselect the icon
        selectedIcon.classList.remove('selected'); // Remove selected class
        selectedIcon = null; // Clear the selected icon
        document.getElementById('preview-box').innerHTML = `<div class="default-preview"><h3>Welcome to Hologram Projection Interface.</h3><p>Select an energy type to preview details here.</p></div>`;
        selectedVideo = ''; // Clear the selected video
    } else {
        // Select the new icon
        if (selectedIcon) {
            selectedIcon.classList.remove('selected'); // Deselect the previously selected icon
        }
        selectedIcon = iconElement; // Set the new selected icon
        selectedIcon.classList.add('selected'); // Add selected class

        // Show the preview for the selected energy type
        showPreview(type, video);
    }
}

function playAnimation() {
    if (selectedVideo) {
        // Send a message to all connected clients to play the selected video
        const message = {
            action: 'play',
            video: selectedVideo // The path to the video file
        };
        const jsonmessage = JSON.stringify(message);
        console.log(jsonmessage);
        ws.send(jsonmessage); // Send the message over the WebSocket connection

        // Update last played video info
        const lastPlayedInfo = document.getElementById('last-played-info');
        lastPlayedInfo.innerHTML = `${selectedVideo.split('/').pop()}`; // Extracts the video filename from the path
    } else {
        alert('Please select an energy type first.');
    }
}
```

# WebSocket Overview

WebSocket is a communication protocol that provides full-duplex communication channels over a single TCP connection, allowing real-time interactions between a client and a server.

## Key Features of WebSocket in the Application

1. **Real-Time Communication**:
   - Enables instant communication with the server, allowing users to play videos without delay.

2. **Event-Driven Architecture**:
   - Operates based on an event-driven model, allowing the application to listen for specific events such as connection opening, errors, and message receptions.

3. **Efficient Resource Use**:
   - Maintains a single open connection, reducing overhead and improving performance.

## WebSocket Code Structure

The WebSocket is utilized in the JavaScript code as follows:

- **WebSocket Connection**:
  - Establishes a WebSocket connection using the provided URL, handling events such as connection opening, message reception, error handling, and connection closure.

- **Sending Messages**:
  - Sends a JSON message to the server when the user chooses to play a video.

### Example Code Snippet

Here’s a snippet illustrating how the WebSocket connection is established and how messages are sent:

```javascript
// WebSocket connection
let webSocketURL = 'wss://troubled-alkaline-carnation.glitch.me';
const ws = new WebSocket(webSocketURL);

ws.onopen = () => {
    console.log(webSocketURL);
    console.log('WebSocket connection established.');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed.');
};

function playAnimation() {
    if (selectedVideo) {
        // Send a message to all connected clients to play the selected video
        const message = {
            action: 'play',
            video: selectedVideo // The path to the video file
        };
        const jsonmessage = JSON.stringify(message);
        console.log(jsonmessage);
        ws.send(jsonmessage); // Send the message over the WebSocket connection
    } else {
        alert('Please select an energy type first.');
    }
}
```