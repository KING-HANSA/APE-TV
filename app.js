let localStream;
let remoteStream;
let peerConnection;
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Set up your media stream
async function startVideo() {
    const constraints = {
        video: true,
        audio: true
    };

    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = localStream;
        startBtn.disabled = true;
        endBtn.disabled = false;
    } catch (err) {
        console.error("Error accessing media devices.", err);
    }
}

// WebRTC configuration
const configuration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

// Create peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Listen for remote stream
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    // ICE candidate handling
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            // Send candidate to remote peer
        }
    };
}

// Button Event Listeners
startBtn.addEventListener("click", () => {
    startVideo();
    createPeerConnection();
    // Here you would typically signal with a server
});

endBtn.addEventListener("click", () => {
    peerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
    startBtn.disabled = false;
    endBtn.disabled = true;
});
