let scene, camera, renderer, video, videoTexture;
const topSubtitleElement = document.getElementById("top-subtitle");
const bottomSubtitleElement = document.getElementById("bottom-subtitle");
const leftSubtitleElement = document.getElementById("left-subtitle");
const rightSubtitleElement = document.getElementById("right-subtitle");
const playPauseBtn = document.getElementById("play-pause-btn");
const timeDisplay = document.getElementById("time-display");

let subtitles = { common: [] }; // Initialize as empty.

async function loadSubtitles(videoSrc) {
    try {
        // Extract the base name of the video (e.g., "video" from "videos/video.mp4").
        const videoBaseName = videoSrc.substring(videoSrc.lastIndexOf("/") + 1, videoSrc.lastIndexOf("."));
        const subtitlePath = `subtitles/${videoBaseName}.json`; // Assume subtitles are in a 'subtitles' folder.
        
        const response = await fetch(subtitlePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitles: ${response.statusText}`);
        }
        subtitles = await response.json();
        console.log("Subtitles loaded:", subtitles);
    } catch (error) {
        console.error("Error loading subtitles:", error);
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
    video.src = "videos/video.mp4"; // Specify video source.
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.controls = false;

    videoTexture = new THREE.VideoTexture(video);

    createHologramPlanes();
    addBeepSound();
    window.addEventListener("resize", onWindowResize, false);

    video.addEventListener("timeupdate", updateTimeDisplay);
    video.addEventListener("play", playBeep);

    playPauseBtn.addEventListener("click", togglePlayPause);

    // Load subtitles dynamically based on video name
    loadSubtitles(video.src).then(() => {
        video.play(); // Play video after subtitles are loaded
        animate(); // Start animation loop
    });
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

    // Fetch subtitle from the 'common' subtitles
    const commonSubtitle = subtitles.common.find((subtitle, index, array) => {
        const nextSubtitle = array[index + 1];
        return currentTime >= subtitle.time && (!nextSubtitle || currentTime < nextSubtitle.time);
    });
    const subtitleText = commonSubtitle ? commonSubtitle.text : "";

    // Update all subtitle elements with the same text
    topSubtitleElement.textContent = subtitleText;
    bottomSubtitleElement.textContent = subtitleText;
    leftSubtitleElement.textContent = subtitleText;
    rightSubtitleElement.textContent = subtitleText;
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
