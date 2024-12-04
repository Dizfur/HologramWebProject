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
let showBorders = false; // Toggle for border visibility

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
	const planeScale = { x: 1.5, y: 1.5, z: 1 };

	// Add planes with their positions, rotations, and scales
	// Top plane
	createPlaneWithBorder(
		{ x: 0, y: 5/ 2, z: 0 }, //position
		{ x: 0, y: 0, z: 0 }, //rotation
		planeScale //scale
	);

	// Bottom plane
	createPlaneWithBorder(
		{ x: 0, y: -5 / 2, z: 0 }, //position
		{ x: 0, y: 0, z: 0 }, //rotation
		{ x: -planeScale.x, y: -planeScale.y, z: planeScale.z }	//scale
	);

	// Left plane
	createPlaneWithBorder(
		{ x: -3, y: 0, z: 0 }, //position
		{ x: 0, y: 0, z: (3 * Math.PI) / 2 }, //rotation
		{ x: planeScale.x, y: -planeScale.y, z: planeScale.z } //scale
	);

	// Right plane
	createPlaneWithBorder(
		{ x: 3, y: 0, z: 0 }, //position
		{ x: 0, y: 0, z: Math.PI / 2 },	//rotation
		{ x: planeScale.x, y: -planeScale.y, z: planeScale.z } //scale
	);
}

function toggleBorders() {
    showBorders = !showBorders;
    scene.clear(); // Clear the scene
    createHologramPlanes(); // Recreate planes with updated border visibility
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
