let scene, camera, renderer, video, videoTexture;
const topSubtitleElement = document.getElementById("top-subtitle");
const bottomSubtitleElement = document.getElementById("bottom-subtitle");
const leftSubtitleElement = document.getElementById("left-subtitle");
const rightSubtitleElement = document.getElementById("right-subtitle");
const playPauseBtn = document.getElementById("play-pause-btn");
const timeDisplay = document.getElementById("time-display");

const subtitles = {
    top: [
        { time: 0, text: "Welcome to the Hologram Experience!" },
        { time: 2, text: "" },
        { time: 4, text: "Let's dive deeper!" },
    ],
    bottom: [
        { time: 0, text: "Welcome to the Hologram Experience!" },
        { time: 2, text: "" },
        { time: 4, text: "Let's dive deeper!" },
    ],
    left: [
        { time: 0, text: "Welcome to the Hologram Experience!" },
        { time: 2, text: "" },
        { time: 4, text: "Let's dive deeper!" },
    ],
    right: [
        { time: 0, text: "Welcome to the Hologram Experience!" },
        { time: 2, text: "" },
        { time: 4, text: "Let's dive deeper!" },
    ],
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    video = document.createElement("video");
    video.src = "videos/video.mp4";
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.controls = false;
    video.play();

    videoTexture = new THREE.VideoTexture(video);

    createHologramPlanes();
    addBeepSound();
    window.addEventListener("resize", onWindowResize, false);

    video.addEventListener("timeupdate", updateTimeDisplay);
    video.addEventListener("play", playBeep);

    playPauseBtn.addEventListener("click", togglePlayPause);

    animate();
}

function createHologramPlanes() {
    const planeGeometry = new THREE.PlaneGeometry(4, 2.25);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });

    const topPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    topPlane.position.y = 4 / 2;
    topPlane.scale.y = 1;
    scene.add(topPlane);

    const bottomPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    bottomPlane.position.y = -4 / 2;
	bottomPlane.scale.y = -1;
    scene.add(bottomPlane);

    const leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    leftPlane.rotation.z = 3 * Math.PI / 2;	
	leftPlane.scale.y = -1;
    leftPlane.position.x = -2;
    scene.add(leftPlane);

    const rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    rightPlane.rotation.z = Math.PI / 2;
	rightPlane.scale.y = -1;
    rightPlane.position.x = 2;
    scene.add(rightPlane);
}

function updateSubtitles() {
    const currentTime = video.currentTime;

    const topSubtitle = subtitles.top.find((subtitle) => currentTime >= subtitle.time);
    topSubtitleElement.textContent = topSubtitle ? topSubtitle.text : "";

    const bottomSubtitle = subtitles.bottom.find((subtitle) => currentTime >= subtitle.time);
    bottomSubtitleElement.textContent = bottomSubtitle ? bottomSubtitle.text : "";

    const leftSubtitle = subtitles.left.find((subtitle) => currentTime >= subtitle.time);
    leftSubtitleElement.textContent = leftSubtitle ? leftSubtitle.text : "";

    const rightSubtitle = subtitles.right.find((subtitle) => currentTime >= subtitle.time);
    rightSubtitleElement.textContent = rightSubtitle ? rightSubtitle.text : "";
}


function addBeepSound() {
    const beep = new Audio("beep.mp3");
    window.playBeep = () => beep.play();
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
