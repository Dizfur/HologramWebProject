// Parse URL parameters
const params = new URLSearchParams(window.location.search);
const videoSourceUrl = params.get('video') || 'videos/introAssistant.mp4'; // Default video source;

// Get DOM elements
const bypassAutoplayRestrictionButton = document.getElementById('bypass-autoplay-restriction-button');
const topSubtitleElement = document.getElementById("top-subtitle");
const bottomSubtitleElement = document.getElementById("bottom-subtitle");
const leftSubtitleElement = document.getElementById("left-subtitle");
const rightSubtitleElement = document.getElementById("right-subtitle");

// Declare variables
let scene, camera, renderer, video, videoTexture, audio;
let showBorders = false; // Toggle for border visibility
let subtitles = []; // Global subtitles array
let isMuted = true; // Initially, the video is muted
let ws; // Variable to hold the WebSocket instance

// WebSocket URL
const webSocketURL = 'wss://troubled-alkaline-carnation.glitch.me';
let reconnectInterval = 5000; // Reconnection interval in milliseconds
let maxRetries = 10; // Maximum reconnection attempts
let retryCount = 0; // Current retry count

// Establish WebSocket connection
connectWebSocket();

// Initialize the application
init();

// Initialize WebSocket connection
function connectWebSocket() {
    ws = new WebSocket(webSocketURL);

    ws.onopen = () => {
        console.log('WebSocket connection established.');
        retryCount = 0; // Reset retry count on successful connection
    };

    ws.onmessage = (event) => {
        console.log('Message received:', event.data);
        handleWebSocketMessage(event.data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.reason);
        if (retryCount < maxRetries) {
            console.log(`Reconnecting in ${reconnectInterval / 1000} seconds...`);
            setTimeout(() => {
                retryCount++;
                console.log(`Reconnection attempt #${retryCount}`);
                connectWebSocket();
            }, reconnectInterval);
        } else {
            console.error('Maximum reconnection attempts reached. WebSocket not reconnected.');
        }
    };
}

// Send a message via WebSocket with error handling
function sendWebSocketMessage(message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        console.log('Message sent:', message);
    } else {
        console.error('Cannot send message. WebSocket is not open.');
        alert('Unable to send the message. WebSocket connection is not active.');
    }
}

// Initialize Three.js
function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a video element
    video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Allow cross-origin video loading
    video.muted = true; // Mute the video if autoplaying in some browsers
    video.loop = false; // Disable loop for sequential playback
    video.controls = false;
    video.autoplay = true;

    // Create video texture
    videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // Create hologram planes
    createHologramPlanes();

    window.addEventListener("resize", onWindowResize, false);
    video.addEventListener("timeupdate", synchronizeAudioVideo);
    video.addEventListener("play", playAudio);
    video.addEventListener("pause", pauseAudio);
    bypassAutoplayRestrictionButton.addEventListener('click', bypassAutoPlayRestriction);

    // Play the default video
    playIntroAssistantVideo();

    // Start the render loop
    animate();
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(data) {
    if (typeof data === 'string') {
        try {
            const message = JSON.parse(data);
            if (message.action === 'play') {
                handleVideoPlay(message.video);
            }
        } catch (error) {
            console.error('Failed to parse message as JSON:', error);
            alert('Received an invalid message from the server.'); // Alert the user
        }
    } else {
        console.error('Received unexpected data type:', typeof data);
    }
}

// Handle video playback
function handleVideoPlay(videoFile) {
    const newVideoUrl = 'videos/' + videoFile; // Assuming the message contains the video URL
    console.log('New video URL:', newVideoUrl); // Log the new URL
    video.src = newVideoUrl; // Update the video source
    video.load(); // Load the new video
    loadSubtitles(newVideoUrl); // Load subtitles for the new video
    loadAudio(newVideoUrl).then(() => {
        video.muted = false;
        playAudio(); // Attempt to play audio after loading
    });
    video.play().catch(error => {
        console.error('Error attempting to play video:', error);
    });
}

// Async function to load subtitles
async function loadSubtitles(videoSrc) {
    try {
        const videoBaseName = videoSrc.substring(videoSrc.lastIndexOf("/") + 1, videoSrc.lastIndexOf("."));
        const subtitlePath = `subtitles/${videoBaseName}.json`;
        const response = await fetch(subtitlePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch subtitles: ${response.statusText}`);
        }

        subtitles = await response.json();
        console.log("Subtitles loaded:", subtitles);
    } catch (error) {
        console.warn("Error loading subtitles:", error);
        subtitles = []; // Fallback to empty subtitles
    }
}

// Async function to load audio
async function loadAudio(videoSrc) {
    const videoBaseName = videoSrc.substring(videoSrc.lastIndexOf("/") + 1, videoSrc.lastIndexOf("."));
    const audioSrc = `audios/${videoBaseName}.mp3`; // Assume audio files are in an 'audio' folder

    try {
        const audioResponse = await fetch(audioSrc, { method: "HEAD" });
        if (!audioResponse.ok) {
            console.warn(`Audio file not found for video: ${videoBaseName}`);
            if (audio) {
                audio.pause();
                audio = null; // Ensure the previous audio instance is cleaned up
            }
            return;
        }

        // Load the new audio file
        if (audio) {
            audio.pause(); // Stop any existing audio
            audio = null; // Clear the old instance
        }
        audio = new Audio(audioSrc);
        audio.loop = false;
        console.log("Audio loaded:", audioSrc);
    } catch (error) {
        console.error("Error loading audio:", error);
    }
}

function playAudio() {
    if (audio) {
        audio.currentTime = video.currentTime; // Ensure sync
        audio.play();
    }
}

function pauseAudio() {
    if (audio) audio.pause();
}

function synchronizeAudioVideo() {
    if (audio && !audio.paused && Math.abs(audio.currentTime - video.currentTime) > 0.2) {
        console.log(`Resyncing audio: video time ${video.currentTime}, audio time ${audio.currentTime}`);
        audio.currentTime = video.currentTime; // Resynchronize if desynced
    }
}

// Function to play the default video
async function playIntroAssistantVideo() {
    video.src = videoSourceUrl; // Set the video source to the default URL
    video.load(); // Load the video
    loadAudio(videoSourceUrl); // Load audio for the default video
    loadSubtitles(videoSourceUrl); // Load subtitles for the default video
    video.play().catch(error => {
        console.error("Error attempting to play default video:", error);
    });
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    updateSubtitles();
    renderer.render(scene, camera);
}

// Ensure audio plays on button click to bypass autoplay restrictions
function bypassAutoPlayRestriction() {
    // Hide the modal (if applicable)
    modal.style.display = 'none'; // Hide the modal if it's being used
    if (videoSourceUrl) {
        video.src = videoSourceUrl; // Set the video source
        video.load(); // Load the video

        // Attempt to play video
        video.play()
            .then(() => {
                console.log("Video playback started.");
                playAudio(); // Play the audio after the video starts
            })
            .catch(error => {
                console.error("Error attempting to play video:", error);
                alert("Video playback failed. Please ensure your browser supports autoplay.");
            });
    } else {
        console.error("No video source URL provided.");
    }
}

function updateSubtitles() {
    const currentTime = video.currentTime;

    // Find the subtitle that matches the current time
    const subtitle = subtitles.find((subtitle, index, array) => {
        const nextSubtitle = array[index + 1];
        return currentTime >= subtitle.time && (!nextSubtitle || currentTime < nextSubtitle.time);
    });

    const subtitleText = subtitle ? subtitle.text : "";
    const subtitleColor = subtitle ? subtitle.color : "white"; // Default to white if no color is specified

    // Update all subtitle elements with the same text and color
    topSubtitleElement.textContent = subtitleText;
    bottomSubtitleElement.textContent = subtitleText;
    leftSubtitleElement.textContent = subtitleText;
    rightSubtitleElement.textContent = subtitleText;

    // Change the subtitle color
    topSubtitleElement.style.color = subtitleColor;
    bottomSubtitleElement.style.color = subtitleColor;
    leftSubtitleElement.style.color = subtitleColor;
    rightSubtitleElement.style.color = subtitleColor;
}

function createHologramPlanes() {
    const planeGeometry = new THREE.PlaneGeometry(4, 2.25);
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });

    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const edgesGeometry = new THREE.EdgesGeometry(planeGeometry);

    const createPlaneWithBorder = (position, rotation, scale) => {
        // Create the main plane
        const plane = new THREE.Mesh(planeGeometry, videoMaterial);
        plane.position.set(position.x, position.y, position.z);
        plane.rotation.set(rotation.x, rotation.y, rotation.z);
        plane.scale.set(scale.x, scale.y, scale.z);
        scene.add(plane);

        // Optionally add a border
        if (showBorders) {
            const border = new THREE.LineSegments(edgesGeometry, borderMaterial);
            border.position.copy(plane.position);
            border.rotation.copy(plane.rotation);
            border.scale.copy(plane.scale);
            scene.add(border);
        }
    };

    // Common scale value for planes
    const planeScale = { x: 0.64, y: 0.64, z: 0.2 };

    // Add planes with their positions, rotations, and scales
    // Top plane
    createPlaneWithBorder(
        { x: 0, y: 2, z: 0 }, //position
        { x: 0, y: 0, z: 0 }, //rotation
        planeScale //scale
    );
    // Bottom plane
    createPlaneWithBorder(
        { x: 0, y: -2, z: 0 }, //position
        { x: 0, y: 0, z: 0 }, //rotation
        { x: -planeScale.x, y: -planeScale.y, z: planeScale.z }	//scale
    );
    // Left plane
    createPlaneWithBorder(
        { x: -1.5, y: 0, z: 0 }, //position
        { x: 0, y: 0, z: (3 * Math.PI) / 2 }, //rotation
        { x: -planeScale.x, y: -planeScale.y, z: planeScale.z } //scale
    );
    // Right plane
    createPlaneWithBorder(
        { x: 1.5, y: 0, z: 0 }, //position
        { x: 0, y: 0, z: Math.PI / 2 }, //rotation
        { x: -planeScale.x, y: -planeScale.y, z: planeScale.z } //scale
    );
}

// Adjust the camera and renderer when the window is resized
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}