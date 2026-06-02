
let chart, scene, camera, renderer, rocket;
let alt = 0, vel = 0, batt = 100, pres = 1013, volt=0, time = 0, packetCount = 0, dataLog = [];
let timer;
let lat = 8.5241, lon = 76.9366, rssi = -45;
//let altOffset = 0;
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
L.marker([startLat, startLon]).addTo(map).bindPopup("Launch Site");

// Add the moving rocket marker
const marker = L.marker([lat, lon]).addTo(map).bindPopup("Rocket");

let currentPos,startPos,distanceMeters,distanceFeet;

// Setup Chart
const ctx = document.getElementById('altChart').getContext('2d');
chart = new Chart(ctx, 
    { 
        type: 'line', data: { 
            labels: [], datasets: [{ label: 'Altitude (ft)', data: [], borderColor: '#00039b', fill: false, tension:0.4 }] 
        },

        options: {
        animation: false,
        elements: {
            point: {
                radius: 0 // This hides the circles on the data points
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#ffffff' // White color for x-axis labels
                },
                grid: {
                    color: '#575555' // Darker grid lines
                }
                ,
                title: {
                    display: true,
                    text: 'Time (s)',
                    color: '#ffffff',}// White color for x-axis title
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#575555' 
                },
                ticks: {
                    color: '#ffffff' 
                },
                title: {
                    display: true,
                    text: 'Altitude (ft)',
                    color: '#ffffff',}
            }
        },

        plugins: {
            legend: {
                labels: {
                    color: '#ffffff' // changes the legend text color
                }
            }
        },
    
        }
    });

// Acceleration Chart
const accChart = new Chart(document.getElementById('accChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Acc_X', data: [], borderColor: '#ff0000', fill: false, tension: 0.4 },
            { label: 'Acc_Y', data: [], borderColor: '#00ff00', fill: false, tension: 0.4 },
            { label: 'Acc_Z', data: [], borderColor: '#0000ff', fill: false, tension: 0.4 }
        ]
    },
    options: {
        animation: false,
        elements: {
            point: { radius: 0 }
        },
        scales: {
            x: {
                ticks: { color: '#ffffff' },
                grid: { color: '#575555' },
                title: { display: true, text: 'Time (s)', color: '#ffffff' }
            },
            y: {
                beginAtZero: true,
                grid: { color: '#575555' },
                ticks: { color: '#ffffff' },
                title: { display: true, text: 'Acceleration (ft/s²)', color: '#ffffff' }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#ffffff' }
            }
        }
    }
});

// Gyroscope Chart
const gyroChart = new Chart(document.getElementById('gyroChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Gyro_X', data: [], borderColor: '#ff9f43', fill: false, tension: 0.4 },
            { label: 'Gyro_Y', data: [], borderColor: '#feca57', fill: false, tension: 0.4 },
            { label: 'Gyro_Z', data: [], borderColor: '#ff6b6b', fill: false, tension: 0.4 }
        ]
    },
    options: {
        animation: false,
        elements: { point: { radius: 0 } },
        scales: {
            x: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Time (s)', color: '#ffffff' } },
            y: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Gyro (°/s)', color: '#ffffff' } }
        },
        plugins: { legend: { labels: { color: '#ffffff' } } }
    }
});

// Magnetometer Chart
const magChart = new Chart(document.getElementById('magChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Mag_X', data: [], borderColor: '#54a0ff', fill: false, tension: 0.4 },
            { label: 'Mag_Y', data: [], borderColor: '#5f27cd', fill: false, tension: 0.4 },
            { label: 'Mag_Z', data: [], borderColor: '#1a1872', fill: false, tension: 0.4 }
        ]
    },
    options: {
        animation: false,
        elements: { point: { radius: 0 } },
        scales: {
            x: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Time (s)', color: '#ffffff' } },
            y: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Mag (µT)', color: '#ffffff' } }
        },
        plugins: { legend: { labels: { color: '#ffffff' } } }
    }
});

// Orientation Chart
const orientChart = new Chart(document.getElementById('orientationChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Roll', data: [], borderColor: '#1dd1a1', fill: false, tension: 0.4 },
            { label: 'Pitch', data: [], borderColor: '#00d2d3', fill: false, tension: 0.4 },
            { label: 'Yaw', data: [], borderColor: '#ff9ff3', fill: false, tension: 0.4 }
        ]
    },
    options: {
        animation: false,
        elements: { point: { radius: 0 } },
        scales: {
            x: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Time (s)', color: '#ffffff' } },
            y: { ticks: { color: '#ffffff' }, grid: { color: '#575555' }, title: { display: true, text: 'Orientation (°)', color: '#ffffff' } }
        },
        plugins: { legend: { labels: { color: '#ffffff' } } }
    }
});

// Setup 3D Rocket
/*function init3D()
{
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(200, 200);
    document.getElementById('three-container').appendChild(renderer.domElement);
    const geometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    rocket = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0x00039b, wireframe: true}));
    scene.add(rocket);
    camera.position.z = 4;
    animate3D();
}

function animate3D() 
{ 
    requestAnimationFrame(animate3D); 
    renderer.render(scene, camera); 
}
*/

function init3D() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(250, 200);
    document.getElementById('three-container').appendChild(renderer.domElement);

    // Create a group to hold all parts together
    rocket = new THREE.Group();

    // 1. Body (Cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    const bodyMat = new THREE.MeshBasicMaterial({color: 0x00039b});
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    rocket.add(body);

    // 2. Nose Cone (Cone)
    const noseGeo = new THREE.ConeGeometry(0.3, 0.8, 16);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.y = 1.4; // Place it on top of the body
    rocket.add(nose);

    // 3. Fins
    
    // 3.1 Define the shape of the triangle (on a 2D plane)
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);     // Start at bottom-left
    shape.lineTo(0, 0.75);   // Line up to the top
    shape.lineTo(0.75, 0);   // Line to the right (creating the hypotenuse)
    shape.lineTo(0, 0);     // Close the triangle

    // 3.2 Extrude the shape to give it thickness
    const finGeo = new THREE.ExtrudeGeometry(shape, 
    {
        depth: 0.1,         // thickness of the fin
        bevelEnabled: false // Keeping edges sharp
    });

    // 3.3 Loop to add 4 fins
    const finMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    for (let i = 0; i < 2; i++) 
    {
        const fin = new THREE.Mesh(finGeo, finMat);
        
        // Position: Y=-0.8 puts them near the bottom, X=0.3 pushes them to the side
        fin.position.y = -0.5;
        fin.position.x = 0.0;
        
        // Rotate each fin 180 degrees around the Y-axis so they spread out
        fin.rotation.y = i * (Math.PI);
        
        rocket.add(fin);
    }

    scene.add(rocket);
    camera.position.z = 5;
    animate3D();
}

function animate3D() {
    requestAnimationFrame(animate3D);
    //(Three.js uses Radians)
    // Convert to radians: degrees * (Math.PI / 180)
    rocket.rotation.x = pitch * (Math.PI / 180);
    rocket.rotation.z = roll * (Math.PI / 180);
    rocket.rotation.y = yaw * (Math.PI / 180);
    renderer.render(scene, camera);
}

// Calibration Function
/*function calibrate() {
    altOffset = alt; // Set current reading as 0
    logEvent("System Calibrated: Alt offset set.");
}
*/

// Simulator Logic
document.getElementById('launch-btn').onclick = () => 
{
    if (timer) return;
    resetFlight();
    timer = setInterval(() => 
    {
        time++;
        packetCount++;
        
        if (time < 30) { alt += 50; vel += 10; updateStatus("Ascent"); }
        else if (time < 40) { updateStatus("Apogee"); }
        else 
        {
            alt -= 30;
            vel -= 5;
            if (alt <= 0) 
            {
                alt = 0;
                vel = 0;
                updateStatus("Landed");
                //clearInterval(timer);
                //timer = null;
            }
            else 
            {
                updateStatus("Descent");
            }
        }

        //Update the battery level
        if (batt > 0) 
        {
            batt -= 10;
        } 
        else 
        {
            batt = 0;
            clearInterval(timer);
            timer = null;
            updateStatus("Battery Depleted");
            
            //Visual feedback
            document.getElementById('stop-btn').disabled = true;
            document.getElementById('stop-btn').style.backgroundColor = "#7f8c8d";
        }

        //Update the status (Independent of whether it just drained)
        const warningDiv = document.getElementById('low-batt-warning');
        if (batt < 20) 
        {
            warningDiv.style.display = "block";
            warningDiv.classList.add('critical-warning');
            warningDiv.innerText = `CRITICAL: Low Battery! (${batt.toFixed(1)}%)`;
        } 
        else 
        {
            warningDiv.style.display = "none";
        }
        pres = 1013 - (alt / 30);
        volt = Math.random()*(batt * 0.1); 

        lat += 0.0001; lon += 0.0001;

        // Update Map Marker position slightly
        marker.setLatLng([lat, lon]);

        currentPos = L.latLng(lat, lon);
        startPos = L.latLng(startLat, startLon);
        distanceMeters = currentPos.distanceTo(startPos);
        distanceFeet = (distanceMeters * 3.28084).toFixed(0);

        rssi = -45 + Math.floor(Math.random() * 20);
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

        document.getElementById('stop-btn').onclick = () => 
        {
                if (!timer) return; // Nothing to stop

                // Show confirmation dialog
                if (confirm("Are you sure you want to stop telemetry?")) 
                {
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
            volt: volt.toFixed(2),
            lat: lat.toFixed(4),
            lon: lon.toFixed(4),
            rssi: rssi,
            accX, accY, accZ, gyroX, gyroY, gyroZ, magX, magY, magZ, roll, pitch, yaw
        });

        updateUI();
    }, 1000);
};

function resetFlight() 
{
    time = 0;
    packetCount = 0;
    alt = 0;
    vel = 0;
    batt = 100;
    pres = 1013;
    volt = 0;
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

function updateUI() 
{
    document.getElementById('p-count').innerText = packetCount;
    document.getElementById('m-time').innerText = new Date(time * 1000).toISOString().substr(11, 8);
    document.getElementById('val-alt').innerText = alt.toFixed(0);
    document.getElementById('val-vel').innerText = vel.toFixed(0);
    document.getElementById('val-batt').innerText = Math.max(0, batt).toFixed(1);//max to prevent negative display(redundant)
    document.getElementById('val-pres').innerText = pres.toFixed(0);
    document.getElementById('val-gps').innerText = lat.toFixed(4);
    document.getElementById('val-gps-lon').innerText = lon.toFixed(4);
    document.getElementById('val-rssi').innerText = rssi;
    document.getElementById('val-volt').innerText = volt.toFixed(2);
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
    
}

function updateStatus(s) 
{
    document.getElementById('status-display').innerText = s;
    const consoleDiv = document.getElementById('console');
    //consoleDiv.innerHTML += `<div>${time}s - ${s}</div>`;
    consoleDiv.insertAdjacentHTML('beforeend', `<div>${time}s - ${s}</div>`);
    /*innerHTML +=: This approach effectively reads the entire contents of the div,
     turns them into a long string, adds your new bit of text, 
     and then re-renders the entire div from scratch. 
     As your flight gets longer and the log grows, this gets slower and slower.
    insertAdjacentHTML: This is much faster. It tells the browser, "Don't touch what's already there. 
    Just take this specific piece of new HTML and glue it to the end." 
    It is highly efficient and the standard "pro" way to update consoles or chat logs.*/
    consoleDiv.scrollTop = consoleDiv.scrollHeight; // Auto-scroll to bottom
}

//CSV Export
document.getElementById('download-btn').onclick = () => 
{

    let csv =
        "Time,Stage,Altitude(ft),Velocity(mph),Battery(%),Voltage(V),Pressure(Pa),Latitude(°),Longitude(°),RSSI(dBm)," +
        "AccX(ft/s²),AccY(ft/s²),AccZ(ft/s²)," +
        "GyroX(°/s),GyroY(°/s),GyroZ(°/s)," +
        "MagX(µT),MagY(µT),MagZ(µT)," +
        "Roll(°),Pitch(°),Yaw(°)\n";

    csv += dataLog.map(d =>
        [
            d.time,d.stage,d.alt,d.vel,d.batt,d.volt,d.pres,d.lat,d.lon,d.rssi,
            d.accX,d.accY,d.accZ,d.gyroX,d.gyroY,d.gyroZ,d.magX,d.magY,d.magZ,d.roll,d.pitch,d.yaw
        ].join(",")
    ).join("\n");

    let blob = new Blob([csv], { type: 'text/csv' });

    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'flight_data.csv';
    a.click();
};

init3D();

document.getElementById("advanced-btn").onclick = () => 
{
    document.getElementById("advanced-panel").style.display = "block";
};

document.getElementById("close-advanced").onclick = () => 
{
    document.getElementById("advanced-panel").style.display = "none";
};