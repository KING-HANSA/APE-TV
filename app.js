const socket = io(); // Connect to the signaling server
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const connectRandomBtn = document.getElementById('connectRandom');
const endCallBtn = document.getElementById('endCall');

let localStream;
let peerConnection;
let remoteStream;
let connectedUserId;

const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Get local media stream
async function getLocalStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = stream;
        localStream = stream;
    } catch (err) {
        console.error('Error accessing media devices:', err);
    }
}

// Create a new peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener('icecandidate', handleICECandidate);
    peerConnection.addEventListener('track', handleTrackEvent);
    
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
}

// Handle incoming ICE candidates
function handleICECandidate(event) {
    if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, connectedUserId);
    }
}

// Handle incoming media tracks
function handleTrackEvent(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.streams[0];
}

// Start the connection with a random user
connectRandomBtn.addEventListener('click', () => {
    socket.emit('connect-random');
});

// Listen for random user connection
socket.on('random-user-found', (userId) => {
    connectedUserId = userId;
    createPeerConnection();

    // Create offer
    peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
    }).then(() => {
        socket.emit('offer', peerConnection.localDescription, connectedUserId);
    });

    endCallBtn.disabled = false;
    connectRandomBtn.disabled = true;
});

// Handle incoming offer
socket.on('offer', (offer, senderId) => {
    connectedUserId = senderId;
    createPeerConnection();

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return peerConnection.createAnswer();
    }).then(answer => {
        return peerConnection.setLocalDescription(answer);
    }).then(() => {
        socket.emit('answer', peerConnection.localDescription, connectedUserId);
    });
});

// Handle incoming answer
socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle incoming ICE candidates
socket.on('ice-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// End the call
endCallBtn.addEventListener('click', () => {
    peerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
    connectRandomBtn.disabled = false;
    endCallBtn.disabled = true;
});

getLocalStream();
