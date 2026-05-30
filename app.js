
let chart, scene, camera, renderer, rocket;
let alt = 0, vel = 0, batt = 100, pres = 1013, time = 0, packetCount = 0, dataLog = [];
let timer;
let lat = 8.5241, lon = 76.9366, rssi = -45;
let altOffset = 0;
let accX=0, accY=0, accZ=0;

let gyroX=0, gyroY=0, gyroZ=0;

let magX=0, magY=0, magZ=0;

let roll=0, pitch=0, yaw=0;

// Initialize Map & Store Start
const startLat = 8.5241;
const startLon = 76.9366;
const map = L.map('map', { attributionControl: false }).setView([startLat, startLon], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add the starting marker (Static)
// L.marker([startLat, startLon]).addTo(map).bindPopup("Launch Site");

// Add the moving rocket marker
const marker = L.marker([lat, lon]).addTo(map).bindPopup("Rocket");

let currentPos = L.latLng(lat, lon);
let startPos = L.latLng(startLat, startLon);

// Calculate distance in meters, convert to feet (1 meter = 3.28084 feet)
let distanceMeters = currentPos.distanceTo(startPos);
let distanceFeet = (distanceMeters * 3.28084).toFixed(0);

// Update the UI
document.getElementById('val-range').innerText = distanceFeet;


// Setup Chart
const ctx = document.getElementById('altChart').getContext('2d');
chart = new Chart(ctx, { type: 'line', data: { labels: [], datasets: [{ label: 'Altitude (ft)', data: [], borderColor: '#e74c3c', fill: false }] }, options: { animation: false, scales: { y: { beginAtZero: true } } } });

const accChart = new Chart(
document.getElementById('accChart'),
{
    type:'line',
    data:{
        labels:[],
        datasets:[
        {
            label:'Acc X',
            data:[]
        },
        {
            label:'Acc Y',
            data:[]
        },
        {
            label:'Acc Z',
            data:[]
        }]
    },
    options:{animation:false}
});

const gyroChart = new Chart(
document.getElementById('gyroChart'),
{
    type:'line',
    data:{
        labels:[],
        datasets:[
        {label:'Gyro X',data:[]},
        {label:'Gyro Y',data:[]},
        {label:'Gyro Z',data:[]}
        ]
    },
    options:{animation:false}
});

const magChart = new Chart(
document.getElementById('magChart'),
{
    type:'line',
    data:{
        labels:[],
        datasets:[
        {label:'Mag X',data:[]},
        {label:'Mag Y',data:[]},
        {label:'Mag Z',data:[]}
        ]
    },
    options:{animation:false}
});

const orientChart = new Chart(
document.getElementById('orientationChart'),
{
    type:'line',
    data:{
        labels:[],
        datasets:[
        {label:'Roll',data:[]},
        {label:'Pitch',data:[]},
        {label:'Yaw',data:[]}
        ]
    },
    options:{animation:false}
});

// Setup 3D Rocket
function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(250, 200);
    document.getElementById('three-container').appendChild(renderer.domElement);
    const geometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    rocket = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}));
    scene.add(rocket);
    camera.position.z = 5;
    animate3D();
}

function animate3D() { requestAnimationFrame(animate3D); renderer.render(scene, camera); }

// Calibration Function
/*function calibrate() {
    altOffset = alt; // Set current reading as 0
    logEvent("System Calibrated: Alt offset set.");
}
*/

// Simulator Logic
document.getElementById('launch-btn').onclick = () => {
    if (timer) return;
    resetFlight();
    timer = setInterval(() => {
        time++;
        packetCount++;
        
        if (time < 30) { alt += 50; vel += 10; updateStatus("Ascent"); }
        else if (time < 40) { updateStatus("Apogee"); }
        else {

    alt -= 30;
    vel -= 5;

    if (alt <= 0) {

        alt = 0;
        vel = 0;

        updateStatus("Landed");

        clearInterval(timer);
        timer = null;

    } else {

        updateStatus("Descent");

    }

}
        batt -= 0.01; // Slower battery drain
        pres = 1013 - (alt / 30);
        
        // Update GPS
        lat += 0.0001; lon += 0.0001;

        // Update Map Marker position slightly
        marker.setLatLng([lat, lon]);

        let currentPos = L.latLng(lat, lon);
        let startPos = L.latLng(startLat, startLon);
        let distanceMeters = currentPos.distanceTo(startPos);
        let distanceFeet = (distanceMeters * 3.28084).toFixed(0);

        //Update Signal
        rssi = -45 + Math.floor(Math.random() * 20); // Random noise
        accX = (Math.sin(time/4)*5).toFixed(2);
        accY = (Math.cos(time/5)*5).toFixed(2);
        accZ = (9.8 + Math.sin(time/3)).toFixed(2);

        gyroX = (Math.sin(time/6)*180).toFixed(2);
        gyroY = (Math.cos(time/6)*180).toFixed(2);
        gyroZ = (Math.sin(time/8)*180).toFixed(2);

        magX = (Math.sin(time/7)*50).toFixed(2);
        magY = (Math.cos(time/7)*50).toFixed(2);
        magZ = (Math.sin(time/9)*50).toFixed(2);

        roll = (Math.sin(time/8)*45).toFixed(2);
        pitch = (Math.cos(time/8)*45).toFixed(2);
        yaw = (time*3)%360;

        document.getElementById('val-rssi').innerText = rssi;

        document.getElementById('stop-btn').onclick = () => {
                if (!timer) return; // Nothing to stop

                // Show confirmation dialog
                if (confirm("Are you sure you want to stop telemetry?")) {
                    clearInterval(timer);
                    timer = null; // Reset the timer variable
                    updateStatus("Telemetry Stopped by User");
                    
                    document.getElementById('stop-btn').style.backgroundColor = "#7f8c8d";
                    document.getElementById('stop-btn').disabled = true;
                }
        };

       document.getElementById('val-range').innerText = distanceFeet;
        
        let currentStage = document.getElementById('status-display').innerText;

        dataLog.push({

            time,
            stage: currentStage,

            alt: alt.toFixed(0),
            vel: vel.toFixed(2),
            batt: batt.toFixed(1),
            pres: pres.toFixed(2),

            lat: lat.toFixed(4),
            lon: lon.toFixed(4),

            rssi: rssi,

            accX,
            accY,
            accZ,

            gyroX,
            gyroY,
            gyroZ,

            magX,
            magY,
            magZ,

            roll,
            pitch,
            yaw

        });

        updateUI();
    }, 200);
};

function resetFlight() {
    time = 0;
    packetCount = 0;
    alt = 0;
    vel = 0;
    batt = 100;
    pres = 1013;
    lat = 8.5241;
    lon = 76.9366;
    dataLog = []; // Clear previous flight logs
    
    // Reset UI
    document.getElementById('console').innerHTML = ""; // Clear log
    chart.data.labels = []; // Clear chart
    chart.data.datasets[0].data = [];
    chart.update();
    
    // Re-enable Stop button
    const stopBtn = document.getElementById('stop-btn');
    stopBtn.disabled = false;
    stopBtn.style.backgroundColor = "#c0392b"; 
}

function updateUI() {
    document.getElementById('p-count').innerText = packetCount;
    document.getElementById('m-time').innerText = new Date(time * 1000).toISOString().substr(11, 8);
    document.getElementById('val-alt').innerText = alt.toFixed(0);
    document.getElementById('val-vel').innerText = vel.toFixed(0);
    document.getElementById('val-batt').innerText = Math.max(0, batt).toFixed(1);
    document.getElementById('val-pres').innerText = pres.toFixed(0);
    document.getElementById('val-gps').innerText = lat.toFixed(4);
    document.getElementById('val-gps-lon').innerText = lon.toFixed(4);
    document.getElementById('val-rssi').innerText = rssi;
    document.getElementById('acc-x').innerText = accX;
    document.getElementById('acc-y').innerText = accY;
    document.getElementById('acc-z').innerText = accZ;

    document.getElementById('gyro-x').innerText = gyroX;
    document.getElementById('gyro-y').innerText = gyroY;
    document.getElementById('gyro-z').innerText = gyroZ;

    document.getElementById('mag-x').innerText = magX;
    document.getElementById('mag-y').innerText = magY;
    document.getElementById('mag-z').innerText = magZ;

    document.getElementById('roll').innerText = roll;
    document.getElementById('pitch').innerText = pitch;
    document.getElementById('yaw').innerText = yaw;
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(alt);
    chart.update();
    accChart.data.labels.push(time);
    gyroChart.data.labels.push(time);
    magChart.data.labels.push(time);
    orientChart.data.labels.push(time);

    accChart.data.datasets[0].data.push(accX);
    accChart.data.datasets[1].data.push(accY);
    accChart.data.datasets[2].data.push(accZ);

    gyroChart.data.datasets[0].data.push(gyroX);
    gyroChart.data.datasets[1].data.push(gyroY);
    gyroChart.data.datasets[2].data.push(gyroZ);

    magChart.data.datasets[0].data.push(magX);
    magChart.data.datasets[1].data.push(magY);
    magChart.data.datasets[2].data.push(magZ);

    orientChart.data.datasets[0].data.push(roll);
    orientChart.data.datasets[1].data.push(pitch);
    orientChart.data.datasets[2].data.push(yaw);

    accChart.update();
    gyroChart.update();
    magChart.update();
    orientChart.update();
    rocket.rotation.x += 0.05;
}

function updateStatus(s) {
    document.getElementById('status-display').innerText = s;
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerHTML += `<div>${time}s - ${s}</div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight; // Auto-scroll to bottom
}

// Improved CSV Export
document.getElementById('download-btn').onclick = () => {

    let csv =
        "Time,Stage,Altitude(ft),Velocity(mph),Battery(%),Pressure(Pa),Lat,Long,RSSI(dBm)," +
        "AccX,AccY,AccZ," +
        "GyroX,GyroY,GyroZ," +
        "MagX,MagY,MagZ," +
        "Roll,Pitch,Yaw\n";

    csv += dataLog.map(d =>
        [
            d.time,
            d.stage,
            d.alt,
            d.vel,
            d.batt,
            d.pres,
            d.lat,
            d.lon,
            d.rssi,
            d.accX,
            d.accY,
            d.accZ,
            d.gyroX,
            d.gyroY,
            d.gyroZ,
            d.magX,
            d.magY,
            d.magZ,
            d.roll,
            d.pitch,
            d.yaw
        ].join(",")
    ).join("\n");

    let blob = new Blob([csv], { type: 'text/csv' });

    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flight_data.csv';
    a.click();
};

init3D();

/*
// helper to keep the 3D view consistent
function resize3D() {
    const container = document.getElementById('three-container');
    if (renderer && container) {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    }
}
window.addEventListener('resize', resize3D);
*/
document.getElementById(
    "advanced-btn"
).onclick = () => {

    document.getElementById(
        "advanced-panel"
    ).style.display = "block";

};

document.getElementById(
    "close-advanced"
).onclick = () => {

    document.getElementById(
        "advanced-panel"
    ).style.display = "none";

};