let scenario = 1;
let isPlaying = false;
let time = 0;
let failSafeMode = false;

let vehicleX = 0;
let vehicleY = 0;
let vehicleSpeed = 13.9;
let steadyStateSpeed = 13.9;
let isBraking = false;
let brakeActivationTime = null;
let pathCleared = false;
let hasCollision = false;

let pedX = 35;
let pedY = -7;
let pedSpeed = 0;

const scenarios = [
    { id: 1, pedSpeed: 0, pedYStart: -7, desc: "Static pedestrian at y=-7m (No collision)" },
    { id: 2, pedSpeed: 0, pedYStart: -1, desc: "Static pedestrian at y=-1m (Near miss)" },
    { id: 3, pedSpeed: 1.67, pedYStart: -5, desc: "Moving pedestrian, 6 kph from y=-5m" },
    { id: 4, pedSpeed: 1.67, pedYStart: -1, desc: "Moving pedestrian, 6 kph from y=-1m (Critical)" }
];

function setup() {
    let canvas = createCanvas(1200, 600);
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
    background(20, 20, 35);
    
    const scale = 12;
    const offsetX = 100;
    const offsetY = height / 2;
    
    drawGrid(scale, offsetX, offsetY);
    drawRoad(scale, offsetX, offsetY);
    drawAxes(offsetX, offsetY);
    
    if (isPlaying && vehicleX < 80 && !hasCollision) {
        updateSimulation();
    } else if (vehicleX >= 80 || hasCollision) {
        isPlaying = false;
        document.getElementById('playBtn').textContent = '▶ Play Simulation';
    }
    
    drawSensorRange(scale, offsetX, offsetY);
    drawCollisionZone(scale, offsetX, offsetY);
    drawPedestrian(scale, offsetX, offsetY);
    drawVehicle(scale, offsetX, offsetY);
    drawStats(offsetX, offsetY, scale);
}

function drawGrid(scale, offsetX, offsetY) {
    stroke(30, 40, 55);
    strokeWeight(1);
    
    for (let i = 0; i < width; i += scale * 5) {
        line(i, 0, i, height);
    }
    for (let i = 0; i < height; i += scale * 5) {
        line(0, i, width, i);
    }
}

function drawRoad(scale, offsetX, offsetY) {
    fill(35, 40, 50);
    noStroke();
    rect(offsetX, offsetY - scale * 1.5, width - offsetX, scale * 3);
    
    stroke(80, 80, 100);
    strokeWeight(2);
    for (let x = offsetX; x < width; x += 40) {
        line(x, offsetY, x + 20, offsetY);
    }
}

function drawAxes(offsetX, offsetY) {
    stroke(100, 110, 130);
    strokeWeight(3);
    line(offsetX, 0, offsetX, height);
    line(0, offsetY, width, offsetY);
    
    fill(160, 174, 192);
    noStroke();
    textSize(14);
    textAlign(LEFT);
    text('X-axis (vehicle path) →', offsetX + 15, offsetY + 25);
    text('↑ Y', offsetX - 35, 30);
    
    textAlign(CENTER);
    for (let i = 0; i <= 60; i += 10) {
        let x = offsetX + i * 12;
        if (x < width - 50) {
            stroke(100, 110, 130);
            line(x, offsetY - 5, x, offsetY + 5);
            noStroke();
            fill(160, 174, 192);
            text(i + 'm', x, offsetY + 40);
        }
    }
}

function drawSensorRange(scale, offsetX, offsetY) {
    const vehScreenX = offsetX + vehicleX * scale;
    const vehScreenY = offsetY - vehicleY * scale;
    
    noFill();
    stroke(16, 185, 129, 100);
    strokeWeight(2);
    circle(vehScreenX, vehScreenY, scale * 20);
}

function drawCollisionZone(scale, offsetX, offsetY) {
    if (vehicleX < 50) {
        stroke(isBraking ? color(249, 115, 22, 200) : color(59, 130, 246, 150));
        strokeWeight(3);
        noFill();
        drawingContext.setLineDash([10, 10]);
        rect(
            offsetX + vehicleX * scale + scale * 2,
            offsetY - scale * 1.5,
            (pedX - vehicleX - 2) * scale,
            scale * 3
        );
        drawingContext.setLineDash([]);
    }
}

function drawPedestrian(scale, offsetX, offsetY) {
    const pedScreenX = offsetX + pedX * scale;
    const pedScreenY = offsetY - pedY * scale;
    
    fill(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    stroke(hasCollision ? color(200, 50, 50) : color(230, 170, 50));
    strokeWeight(3);
    circle(pedScreenX, pedScreenY, scale * 1);
    
    noFill();
    stroke(hasCollision ? color(239, 68, 68, 100) : color(251, 191, 36, 100));
    strokeWeight(2);
    circle(pedScreenX, pedScreenY, scale * 1.5);
    
    stroke(hasCollision ? color(239, 68, 68) : color(251, 191, 36));
    strokeWeight(4);
    line(pedScreenX, pedScreenY + scale * 0.3, pedScreenX, pedScreenY + scale * 0.8);
}

function drawVehicle(scale, offsetX, offsetY) {
    const vehScreenX = offsetX + vehicleX * scale;
    const vehScreenY = offsetY - vehicleY * scale;
    
    fill(isBraking ? color(249, 115, 22) : color(59, 130, 246));
    stroke(255, 255, 255, 200);
    strokeWeight(2);
    rect(
        vehScreenX - scale * 1,
        vehScreenY - scale * 1.5,
        scale * 4,
        scale * 3
    );
    
    fill(hasCollision ? color(255, 0, 0) : (isBraking ? color(200, 80, 10) : color(40, 100, 200)));
    noStroke();
    rect(vehScreenX, vehScreenY - scale * 1.2, scale * 3.5, scale * 1.5);
    
    fill(255);
    rect(vehScreenX + scale * 0.3, vehScreenY - scale * 1, scale * 1.2, scale * 0.8);
    
    fill(255, 255, 0);
    noStroke();
    circle(vehScreenX + scale * 3.3, vehScreenY - scale * 1, scale * 0.4);
    circle(vehScreenX + scale * 3.3, vehScreenY + scale * 1, scale * 0.4);
    
    if (isBraking) {
        fill(255, 0, 0);
        circle(vehScreenX - scale * 0.8, vehScreenY - scale * 1, scale * 0.3);
        circle(vehScreenX - scale * 0.8, vehScreenY + scale * 1, scale * 0.3);
    }
    
    stroke(255);
    strokeWeight(3);
    noFill();
    line(vehScreenX + scale * 3.8, vehScreenY, vehScreenX + scale * 4.5, vehScreenY);
    line(vehScreenX + scale * 4.5, vehScreenY, vehScreenX + scale * 4.2, vehScreenY - scale * 0.3);
    line(vehScreenX + scale * 4.5, vehScreenY, vehScreenX + scale * 4.2, vehScreenY + scale * 0.3);
}

function drawStats(offsetX, offsetY, scale) {
    fill(255);
    noStroke();
    textSize(16);
    textAlign(LEFT);
    
    let yPos = 30;
    text(`Time: ${time.toFixed(2)}s`, 15, yPos);
    yPos += 25;
    text(`Vehicle X: ${vehicleX.toFixed(1)}m`, 15, yPos);
    yPos += 25;
    text(`Speed: ${(vehicleSpeed * 3.6).toFixed(1)} kph`, 15, yPos);
    yPos += 25;
    text(`Pedestrian: (${pedX.toFixed(1)}m, ${pedY.toFixed(1)}m)`, 15, yPos);
    yPos += 25;
    
    const distance = dist(vehicleX, vehicleY, pedX, pedY);
    text(`Distance to Ped: ${distance.toFixed(1)}m`, 15, yPos);
    yPos += 30;
    
    if (isBraking) {
        fill(249, 115, 22);
        textSize(18);
        text('⚠ EMERGENCY BRAKING ACTIVE', 15, yPos);
        yPos += 25;
        fill(255);
        textSize(14);
        text(`Brake delay: ${failSafeMode ? '900ms' : '200ms'}`, 15, yPos);
    } else if (pathCleared) {
        fill(16, 185, 129);
        textSize(18);
        text('✓ Path Clear - Resuming Speed', 15, yPos);
    } else {
        fill(16, 185, 129);
        textSize(16);
        text('● Monitoring...', 15, yPos);
    }
    
    if (hasCollision) {
        fill(239, 68, 68);
        textSize(32);
        textAlign(CENTER);
        text('⚠ COLLISION DETECTED!', width / 2, 60);
        textSize(20);
        text('System Failed - Zero Collision Requirement Violated', width / 2, 95);
    }
    
    fill(failSafeMode ? color(239, 68, 68) : color(16, 185, 129));
    textSize(14);
    textAlign(RIGHT);
    text(failSafeMode ? 'FAIL-SAFE MODE (900ms)' : 'NORMAL MODE (200ms)', width - 15, 30);
    
    const responseTime = failSafeMode ? 0.9 : 0.2;
    fill(200, 200, 220);
    text(`Brake Response: ${(responseTime * 1000).toFixed(0)}ms`, width - 15, 55);
    text(`Max Decel: 0.7g`, width - 15, 80);
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
    const willCollide = Math.abs(pedYAtIntersection) <= 1.5;
    
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
        
        if (vehicleSpeed < steadyStateSpeed) {
            const acceleration = 0.25 * 9.81;
            vehicleSpeed = Math.min(steadyStateSpeed, vehicleSpeed + acceleration * dt);
        }
    }
    
    vehicleX += vehicleSpeed * dt;
    
    const distance = dist(vehicleX, vehicleY, pedX, pedY);
    if (distance < 2 && Math.abs(vehicleX - pedX) < 2.5 && Math.abs(pedY) < 1.5) {
        hasCollision = true;
    }
}

function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('playBtn').textContent = isPlaying ? '⏸ Pause' : '▶ Play Simulation';
}

function resetSim() {
    isPlaying = false;
    time = 0;
    vehicleX = 0;
    vehicleY = 0;
    vehicleSpeed = steadyStateSpeed;
    isBraking = false;
    hasCollision = false;
    pathCleared = false;
    brakeActivationTime = null;
    
    const currentScenario = scenarios[scenario - 1];
    pedX = 35;
    pedY = currentScenario.pedYStart;
    pedSpeed = currentScenario.pedSpeed;
    
    document.getElementById('playBtn').textContent = '▶ Play Simulation';
    updateUI();
}

function changeScenario(direction) {
    scenario = constrain(scenario + direction, 1, 4);
    resetSim();
    updateUI();
}

function updateUI() {
    const currentScenario = scenarios[scenario - 1];
    document.getElementById('scenarioNum').textContent = `Scenario ${scenario}/4`;
    document.getElementById('scenarioDesc').textContent = currentScenario.desc;
    
    document.getElementById('prevBtn').disabled = scenario === 1;
    document.getElementById('nextBtn').disabled = scenario === 4;
}

function keyPressed() {
    if (key === ' ') togglePlay();
    if (key === 'r' || key === 'R') resetSim();
}