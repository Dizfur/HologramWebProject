let scene, camera, renderer, video, videoTexture;
const topSubtitleElement = document.getElementById("top-subtitle");
const bottomSubtitleElement = document.getElementById("bottom-subtitle");
const leftSubtitleElement = document.getElementById("left-subtitle");
const rightSubtitleElement = document.getElementById("right-subtitle");
const playPauseBtn = document.getElementById("play-pause-btn");
const timeDisplay = document.getElementById("time-display");

let subtitles = []; // Initialize as empty.
let videoList = [];
let currentVideoIndex = 0;

async function loadVideoList() {
    try {
        const response = await fetch("videoList.json"); // Path to your JSON file
        if (!response.ok) throw new Error(`Failed to load video list: ${response.statusText}`);
        const data = await response.json();
        videoList = data.videos;
        console.log("Video list loaded:", videoList);
    } catch (error) {
        console.error("Error loading video list:", error);
    }
}

async function loadSubtitles(videoSrc) {
    try {
        // Extract the base name of the video (e.g., "video" from "videos/video.mp4").
        const videoBaseName = videoSrc.substring(videoSrc.lastIndexOf("/") + 1, videoSrc.lastIndexOf("."));
        const subtitlePath = `subtitles/${videoBaseName}.json`; // Assume subtitles are in a 'subtitles' folder.       
        console.log("Fetching subtitles from:", subtitlePath);
        
		// Fetch subtitle file
        const response = await fetch(subtitlePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitles: ${response.statusText}`);
        }

        subtitles = await response.json();
        console.log("Subtitles loaded:", subtitles);
    } catch (error) {
        console.warn("Error loading subtitles:", error);
        subtitles = []; // Fallback to an empty subtitles array
    }
}

function init() {
    // Set up the 3D scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Video setup
    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = false; // Disable loop for sequential playback
    video.muted = true;
    video.controls = false;

    videoTexture = new THREE.VideoTexture(video);

    createHologramPlanes();
    addBeepSound();
    window.addEventListener("resize", onWindowResize, false);

    video.addEventListener("timeupdate", updateTimeDisplay);
    video.addEventListener("play", playBeep);
    video.addEventListener("ended", playNextVideo); // Listen for video end to play the next

    playPauseBtn.addEventListener("click", togglePlayPause);

    loadVideoList().then(() => {
        if (videoList.length > 0) {
            playVideo(currentVideoIndex);
            animate();
        } else {
            console.error("Video list is empty.");
        }
    });
}

async function playVideo(index) {
    if (index < 0 || index >= videoList.length) {
        console.error("Invalid video index:", index);
        return;
    }

    const videoSrc = videoList[index];

    try {
        // Check if the video file exists
        const response = await fetch(videoSrc, { method: "HEAD" });
        if (!response.ok) {
            throw new Error(`Video file not found: ${videoSrc}`);
        }

        // Set the video source and play
        console.log("Playing video:", videoSrc);
        video.src = videoSrc;

        // Load subtitles (skip errors here to not block playback)
        try {
            await loadSubtitles(videoSrc);
        } catch (subtitleError) {
            console.warn("Subtitle file not found or invalid for:", videoSrc, subtitleError);
        }

        video.play().catch((error) => {
            console.error("Error playing video:", videoSrc, error);
            playNextVideo(); // Try the next video if playback fails
        });
    } catch (error) {
        console.error("Error loading video:", error);
        playNextVideo(); // Skip to the next video
    }
}

function playNextVideo() {
    currentVideoIndex++;
    if (currentVideoIndex < videoList.length) {
        console.log("Playing next video. Index:", currentVideoIndex);
        playVideo(currentVideoIndex);
    } else {
        console.log("All videos have been attempted. No more videos to play.");
    }
}

function createHologramPlanes() {
    const planeGeometry = new THREE.PlaneGeometry(4, 2.25);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });

    const topPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    topPlane.position.y = 5 / 2;
    topPlane.scale.y = 1.5;
	topPlane.scale.x = -1.5;
    scene.add(topPlane);

    const bottomPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    bottomPlane.position.y = -5 / 2;
	bottomPlane.scale.y = -1.5;
	bottomPlane.scale.x = -1.5;
    scene.add(bottomPlane);

    const leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    leftPlane.rotation.z = 3 * Math.PI / 2;		
	leftPlane.scale.y = -1.5;
	leftPlane.scale.x = 1.5;
    leftPlane.position.x = -3;
    scene.add(leftPlane);

    const rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    rightPlane.rotation.z = Math.PI / 2;
	rightPlane.scale.y = -1.5;
	rightPlane.scale.x = 1.5;
    rightPlane.position.x = 3;
    scene.add(rightPlane);
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

function togglePlayPause() {
    if (video.paused) {
        video.play();
        playPauseBtn.textContent = "Pause";
    } else {
        video.pause();
        playPauseBtn.textContent = "Play";
    }
}

function updateTimeDisplay() {
    const currentMinutes = Math.floor(video.currentTime / 60);
    const currentSeconds = Math.floor(video.currentTime % 60);
    const totalMinutes = Math.floor(video.duration / 60);
    const totalSeconds = Math.floor(video.duration % 60);

    timeDisplay.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, "0")} / ${totalMinutes}:${totalSeconds.toString().padStart(2, "0")}`;
}

function addBeepSound() {
    const beep = new Audio("beep.mp3");
    window.playBeep = () => beep.play();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    updateSubtitles();
    renderer.render(scene, camera);
}

init();
