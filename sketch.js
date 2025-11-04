let scenario = 1;
let isPlaying = false;
let time = 0;
let failSafeMode = false;

let vehicleX = 0;
let vehicleY = 0;
let vehicleSpeed = 13.9;
let isBraking = false;
let brakeActivationTime = null;
let pathCleared = false;
let hasCollision = false;

let pedX = 35;
let pedY = -7;
let pedSpeed = 0;

const scenarios = [
    { id: 1, pedSpeed: 0, pedYStart: -7, desc: "Static pedestrian at y=-7m" },
    { id: 2, pedSpeed: 0, pedYStart: -5, desc: "Static pedestrian at y=-5m" },
    { id: 3, pedSpeed: 0, pedYStart: -3, desc: "Static pedestrian at y=-3m" },
    { id: 4, pedSpeed: 0, pedYStart: -1, desc: "Static pedestrian at y=-1m" },
    { id: 5, pedSpeed: 0, pedYStart: 1, desc: "Static pedestrian at y=1m" },
    { id: 6, pedSpeed: 1.67, pedYStart: -7, desc: "Moving pedestrian, 6 kph from y=-7m" },
    { id: 7, pedSpeed: 1.67, pedYStart: -5, desc: "Moving pedestrian, 6 kph from y=-5m" },
    { id: 8, pedSpeed: 1.67, pedYStart: -3, desc: "Moving pedestrian, 6 kph from y=-3m" },
    { id: 9, pedSpeed: 1.67, pedYStart: -1, desc: "Moving pedestrian, 6 kph from y=-1m" },
    { id: 10, pedSpeed: 1.67, pedYStart: 1, desc: "Moving pedestrian, 6 kph from y=1m" }
];

function setup() {
    let canvas = createCanvas(900, 500);
    canvas.parent('canvas-container');
    
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('resetBtn').addEventListener('click', resetSim);
    document.getElementById('prevBtn').addEventListener('click', () => changeScenario(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changeScenario(1));
    document.getElementById('failSafeCheck').addEventListener('change', (e) => {
        failSafeMode = e.target.checked;
        resetSim();
    });
    
    resetSim();
    updateUI();
}

function draw() {
    background(26, 26, 46);
    
    const scale = 8;
    const offsetX = 50;
    const offsetY = height / 2;
    
    drawGrid(scale, offsetX, offsetY);
    drawRoad(scale, offsetX, offsetY);
    drawAxes(offsetX, offsetY);
    
    if (isPlaying && vehicleX < 70 && !hasCollision) {
        updateSimulation();
    } else if (vehicleX >= 70 || hasCollision) {
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ Play';
    }
    
    drawCollisionZone(scale, offsetX, offsetY);
    drawPedestrian(scale, offsetX, offsetY);
    drawVehicle(scale, offsetX, offsetY);
    drawStats(offsetX, offsetY);
}

function drawGrid(scale, offsetX, offsetY) {
    stroke(22, 33, 62);
    strokeWeight(1);
    
    for (let i = 0; i < width; i += scale * 5) {
        line(i, 0, i, height);
    }
    for (let i = 0; i < height; i += scale * 5) {
        line(0, i, width, i);
    }
}

function drawRoad(scale, offsetX, offsetY) {
    fill(42, 42, 62);
    noStroke();
    rect(offsetX, offsetY - scale, width - offsetX, scale * 2);
}

function drawAxes(offsetX, offsetY) {
    stroke(74, 85, 104);
    strokeWeight(2);
    line(offsetX, 0, offsetX, height);
    line(0, offsetY, width, offsetY);
    
    fill(160, 174, 192);
    noStroke();
    textSize(12);
    textAlign(LEFT);
    text('X-axis (vehicle path)', offsetX + 10, offsetY + 20);
    text('Y', offsetX - 25, 20);
}

function drawCollisionZone(scale, offsetX, offsetY) {
    if (vehicleX < 50) {
        stroke(isBraking ? color(249, 115, 22, 200) : color(59, 130, 246, 100));
        strokeWeight(2);
        noFill();
        drawingContext.setLineDash([5, 5]);
        rect(
            offsetX + vehicleX * scale,
            offsetY - scale,
            (35 - vehicleX) * scale,
            scale * 2
        );
        drawingContext.setLineDash([]);
    }
}

function drawPedestrian(scale, offsetX, offsetY) {
    const pedScreenX = offsetX + pedX * scale;
    const pedScreenY = offsetY - pedY * scale;
    
    fill(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    noStroke();
    circle(pedScreenX, pedScreenY, scale * 0.5);
    
    stroke(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    strokeWeight(3);
    line(pedScreenX, pedScreenY, pedScreenX, pedScreenY + scale * 0.4);
    line(pedScreenX - scale * 0.2, pedScreenY + scale * 0.15, pedScreenX + scale * 0.2, pedScreenY + scale * 0.15);
}

function drawVehicle(scale, offsetX, offsetY) {
    const vehScreenX = offsetX + vehicleX * scale;
    const vehScreenY = offsetY - vehicleY * scale;
    
    fill(isBraking ? color(249, 115, 22) : color(59, 130, 246));
    noStroke();
    rect(
        vehScreenX - scale * 0.5,
        vehScreenY - scale,
        scale * 2,
        scale * 2
    );
    
    stroke(255);
    strokeWeight(2);
    line(vehScreenX + scale, vehScreenY, vehScreenX + scale * 1.5, vehScreenY);
    line(vehScreenX + scale * 1.5, vehScreenY, vehScreenX + scale * 1.3, vehScreenY - scale * 0.2);
    line(vehScreenX + scale * 1.5, vehScreenY, vehScreenX + scale * 1.3, vehScreenY + scale * 0.2);
}

function drawStats(offsetX, offsetY) {
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT);
    
    text(`Time: ${time.toFixed(2)}s`, 10, 25);
    text(`Vehicle X: ${vehicleX.toFixed(1)}m`, 10, 45);
    text(`Speed: ${(vehicleSpeed * 3.6).toFixed(1)} kph`, 10, 65);
    text(`Pedestrian: (${pedX.toFixed(1)}, ${pedY.toFixed(1)})`, 10, 85);
    
    if (isBraking) {
        fill(249, 115, 22);
        textSize(16);
        text('⚠ BRAKING ACTIVE', 10, 110);
    } else if (pathCleared) {
        fill(16, 185, 129);
        textSize(16);
        text('✓ Path Clear - Resuming', 10, 110);
    }
    
    if (hasCollision) {
        fill(239, 68, 68);
        textSize(24);
        textAlign(CENTER);
        text('⚠ COLLISION DETECTED!', width / 2, 40);
    }
    
    fill(failSafeMode ? color(239, 68, 68) : color(16, 185, 129));
    textSize(12);
    textAlign(RIGHT);
    text(failSafeMode ? 'FAIL-SAFE MODE (900ms)' : 'NORMAL MODE (200ms)', width - 10, 25);
}

function updateSimulation() {
    const dt = 0.016;
    time += dt;
    
    const currentScenario = scenarios[scenario - 1];
    
    if (currentScenario.pedSpeed > 0) {
        pedY += currentScenario.pedSpeed * dt;
    }
    
    const timeToReachPed = (pedX - vehicleX) / vehicleSpeed;
    const pedYAtIntersection = pedY + currentScenario.pedSpeed * timeToReachPed;
    const willCollide = Math.abs(pedYAtIntersection) <= 1.25;
    
    if (willCollide && !pathCleared && vehicleX < pedX) {
        if (!isBraking) {
            isBraking = true;
            brakeActivationTime = time;
        }
        
        const responseTime = failSafeMode ? 0.9 : 0.2;
        if (time - brakeActivationTime >= responseTime) {
            const deceleration = 0.7 * 9.81;
            vehicleSpeed = Math.max(0, vehicleSpeed - deceleration * dt);
        }
    } else {
        if (isBraking) {
            pathCleared = true;
        }
        isBraking = false;
        
        if (vehicleSpeed < 13.9) {
            const acceleration = 0.25 * 9.81;
            vehicleSpeed = Math.min(13.9, vehicleSpeed + acceleration * dt);
        }
    }
    
    vehicleX += vehicleSpeed * dt;
    
    const distance = dist(vehicleX, vehicleY, pedX, pedY);
    if (distance < 1.25 && vehicleX >= pedX - 1 && vehicleX <= pedX + 1) {
        hasCollision = true;
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play';
}

function resetSim() {
    isPlaying = false;
    time = 0;
    vehicleX = 0;
    vehicleY = 0;
    vehicleSpeed = 13.9;
    isBraking = false;
    hasCollision = false;
    pathCleared = false;
    brakeActivationTime = null;
    
    const currentScenario = scenarios[scenario - 1];
    pedX = 35;
    pedY = currentScenario.pedYStart;
    pedSpeed = currentScenario.pedSpeed;
    
    document.getElementById('playBtn').textContent = '▶ Play';
    updateUI();
}

function changeScenario(direction) {
    scenario = constrain(scenario + direction, 1, 10);
    resetSim();
    updateUI();
}

function updateUI() {
    const currentScenario = scenarios[scenario - 1];
    document.getElementById('scenarioNum').textContent = `Scenario ${scenario}/10`;
    document.getElementById('scenarioDesc').textContent = currentScenario.desc;
    
    document.getElementById('prevBtn').disabled = scenario === 1;
    document.getElementById('nextBtn').disabled = scenario === 10;
}

function keyPressed() {
    if (key === ' ') togglePlay();
    if (key === 'r' || key === 'R') resetSim();
}