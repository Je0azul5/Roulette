class Roulette {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = [];
        this.optionColors = [];
        this.history = [];
        this.rotation = 0;
        this.isSpinning = false;
        this.spinDuration = 5000; // 5 seconds
        this.spinStartTime = 0;
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.baseColors = [
            '#0074D9', '#1E90FF', '#00BFFF', '#0057D9',
            '#2ECC40', '#28B463', '#27AE60', '#1ABC9C',
            '#16A085', '#00CEC9', '#34ACE0', '#0984E3',
            '#8E44AD', '#9B59B6', '#6C5CE7', '#00B894',
            '#FFD700', '#FFDC00', '#FFEA00', '#F1C40F'
        ];
        this.availableColors = [...this.baseColors];

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize event listeners
        this.initializeEventListeners();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.draw();
    }

    initializeEventListeners() {
        const addButton = document.getElementById('addOption');
        const input = document.getElementById('optionInput');
        const spinButton = document.getElementById('spinButton');
        const clearButton = document.getElementById('clearOptions');
        const clearHistoryButton = document.getElementById('clearHistory');

        addButton.addEventListener('click', () => this.addOption(input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addOption(input);
        });

        spinButton.addEventListener('click', () => this.spin());
        clearButton.addEventListener('click', () => this.clearOptions());
        clearHistoryButton.addEventListener('click', () => this.clearHistory());

        // Animation frame
        const animate = () => {
            if (this.isSpinning) {
                this.updateSpinning();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    getRandomColor() {
        if (this.availableColors.length === 0) {
            this.availableColors = [...this.baseColors];
        }
        const idx = Math.floor(Math.random() * this.availableColors.length);
        const color = this.availableColors[idx];
        this.availableColors.splice(idx, 1);
        return color;
    }

    addOption(input) {
        const option = input.value.trim();
        if (option && !this.options.includes(option)) {
            this.options.push(option);
            this.optionColors.push(this.getRandomColor());
            this.updateOptionsList();
            this.draw();
            input.value = '';
        }
    }

    removeOption(option) {
        const idx = this.options.indexOf(option);
        if (idx !== -1) {
            this.options.splice(idx, 1);
            this.optionColors.splice(idx, 1);
        }
        this.updateOptionsList();
        this.draw();
    }

    updateOptionsList() {
        const list = document.getElementById('optionsList');
        list.innerHTML = '';
        this.options.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Eliminar';
            removeBtn.onclick = () => this.removeOption(option);
            li.appendChild(removeBtn);
            list.appendChild(li);
        });
    }

    clearOptions() {
        this.options = [];
        this.optionColors = [];
        this.updateOptionsList();
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.options.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f0f0f0';
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.fillStyle = '#666';
            ctx.font = '16px Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Agrega opciones', centerX, centerY);
            return;
        }

        const sliceAngle = (Math.PI * 2) / this.options.length;

        // Draw slices
        this.options.forEach((option, index) => {
            const startAngle = index * sliceAngle + this.rotation;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = this.optionColors[index] || '#ccc';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Roboto';
            ctx.fillText(option, radius - 20, 5);
            ctx.restore();
        });
    }

    spin() {
        if (this.isSpinning || this.options.length < 2) return;

        this.isSpinning = true;
        this.spinStartTime = Date.now();
        this.currentRotation = this.rotation;
        
        // Random number of full rotations (3-5) plus random angle
        const fullRotations = 3 + Math.random() * 2;
        const randomAngle = Math.random() * Math.PI * 2;
        this.targetRotation = this.currentRotation + (Math.PI * 2 * fullRotations) + randomAngle;
    }

    addToHistory(winner) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        this.history.unshift({ option: winner, timestamp: timestamp });
        this.updateHistoryList();
    }

    updateHistoryList() {
        const list = document.getElementById('historyList');
        list.innerHTML = '';
        this.history.forEach(item => {
            const li = document.createElement('li');
            const content = document.createElement('span');
            content.textContent = item.option;
            const time = document.createElement('span');
            time.className = 'timestamp';
            time.textContent = item.timestamp;
            li.appendChild(content);
            li.appendChild(time);
            list.appendChild(li);
        });
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryList();
    }

    updateSpinning() {
        const now = Date.now();
        const elapsed = now - this.spinStartTime;
        const progress = Math.min(elapsed / this.spinDuration, 1);
    
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    
        if (progress < 1) {
            this.rotation = this.currentRotation + (this.targetRotation - this.currentRotation) * easeOut(progress);
            this.draw();
        } else {
            this.isSpinning = false;
            this.rotation = this.targetRotation;
            this.draw();
    
            // 1. Normalizamos la rotación a [0, 2π)
            const normalizedRotation = (this.rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
            // 2. Ángulo de cada sector
            const sliceAngle = (Math.PI * 2) / this.options.length;
    
            // 3. Ángulo fijo que apunta al "12 en punto" (la punta de la flecha)
            const arrowAngle = 3 * Math.PI / 2;
    
            // 4. Restamos la rotación y llevamos a [0, 2π)
            const rawAngle = (arrowAngle - normalizedRotation + 2 * Math.PI) % (2 * Math.PI);
    
            // 5. Índice del sector ganador
            const winningIndex = Math.floor(rawAngle / sliceAngle);
            const winner = this.options[winningIndex];
    
            // ---------------------------------------------------
            // == Ahora añadimos a historial y mostramos la alerta ==
            this.addToHistory(winner);
    
            setTimeout(() => {
                alert(`¡La opción ganadora es: ${winner}!`);
                // Removemos la opción escogida
                this.options = this.options.filter(option => option !== winner);
                this.updateOptionsList();
                this.draw();
            }, 500);
    
            // ---------------------------------------------------
        }
    }
}

// Initialize the roulette when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wheelCanvas');
    new Roulette(canvas);
}); 