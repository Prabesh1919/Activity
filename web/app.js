// GitHub Contribution Canvas - Core Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let currentMode = 'simulator'; // 'simulator' or 'designer'
    let isDrawing = false;
    let selectedDates = new Set(); // Stores YYYY-MM-DD strings for designer mode
    let simulatedCommits = {}; // Map of YYYY-MM-DD -> commit count for simulator mode

    // Elements
    const tabSimulator = document.getElementById('tab-simulator');
    const tabDesigner = document.getElementById('tab-designer');
    const simulatorSettings = document.getElementById('simulator-settings');
    const designerSettings = document.getElementById('designer-settings');
    const designerDatesSection = document.getElementById('designer-dates-section');
    
    const inputFrequency = document.getElementById('input-frequency');
    const valFrequency = document.getElementById('val-frequency');
    const inputMaxCommits = document.getElementById('input-max-commits');
    const valMaxCommits = document.getElementById('val-max-commits');
    const inputDaysBefore = document.getElementById('input-days-before');
    const valDaysBefore = document.getElementById('val-days-before');
    const inputDaysAfter = document.getElementById('input-days-after');
    const valDaysAfter = document.getElementById('val-days-after');
    const inputNoWeekends = document.getElementById('input-no-weekends');

    const btnClearCanvas = document.getElementById('btn-clear-canvas');
    const btnInvertCanvas = document.getElementById('btn-invert-canvas');

    const inputRepository = document.getElementById('input-repository');
    const inputUsername = document.getElementById('input-username');
    const inputEmail = document.getElementById('input-email');

    const calendarGrid = document.getElementById('calendar-grid');
    const monthLabelsContainer = document.getElementById('month-labels');
    
    const statTotalCommits = document.getElementById('stat-total-commits');
    const statActiveDays = document.getElementById('stat-active-days');
    
    const btnCopyCode = document.getElementById('btn-copy-code');
    const codeSnippet = document.getElementById('code-snippet');
    const btnCopyDates = document.getElementById('btn-copy-dates');
    const datesSnippet = document.getElementById('dates-snippet');

    // Months translation array
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize Grid Setup
    const totalWeeks = 53;
    const daysPerWeek = 7;
    const totalDays = totalWeeks * daysPerWeek;

    // Calculate dates starting on a Sunday 52 weeks ago, ending on Saturday of this week
    function calculateGridDates() {
        const dates = [];
        const endDate = new Date();
        // Adjust to the Saturday of the current week
        const currentDay = endDate.getDay();
        endDate.setDate(endDate.getDate() + (6 - currentDay));

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (totalDays - 1));

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    const gridDates = calculateGridDates();

    // Render Calendar Structure
    function renderCalendar() {
        calendarGrid.innerHTML = '';
        monthLabelsContainer.innerHTML = '';
        
        let lastMonth = -1;

        for (let w = 0; w < totalWeeks; w++) {
            const col = document.createElement('div');
            col.className = 'grid-col';

            // Check if month label needs to be drawn (using the 4th day of the week to align)
            const middleDayIndex = w * 7 + 3;
            if (middleDayIndex < gridDates.length) {
                const middleDate = gridDates[middleDayIndex];
                const currentMonth = middleDate.getMonth();
                if (currentMonth !== lastMonth) {
                    lastMonth = currentMonth;
                    const label = document.createElement('span');
                    label.className = 'month-label';
                    label.innerText = months[currentMonth];
                    label.style.left = `${w * 15}px`; // 12px size + 3px gap
                    monthLabelsContainer.appendChild(label);
                }
            }

            for (let d = 0; d < daysPerWeek; d++) {
                const dateIndex = w * 7 + d;
                if (dateIndex >= gridDates.length) continue;
                
                const date = gridDates[dateIndex];
                const dateStr = formatDate(date);

                const cell = document.createElement('div');
                cell.className = 'cell level-0';
                cell.dataset.date = dateStr;
                cell.title = `${date.toDateString()}: 0 commits`;

                // Add mouse events for Drawing
                cell.addEventListener('mousedown', (e) => {
                    if (currentMode !== 'designer') return;
                    isDrawing = true;
                    toggleDateSelection(cell, dateStr);
                });

                cell.addEventListener('mouseenter', () => {
                    if (currentMode !== 'designer' || !isDrawing) return;
                    toggleDateSelection(cell, dateStr);
                });

                // Add click event for simulator to re-roll that day
                cell.addEventListener('click', () => {
                    if (currentMode !== 'simulator') return;
                    rerollDay(cell, dateStr);
                });

                col.appendChild(cell);
            }
            calendarGrid.appendChild(col);
        }

        document.addEventListener('mouseup', () => {
            isDrawing = false;
        });
    }

    // Helper: format Date as YYYY-MM-DD
    function formatDate(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Toggle cell paint in designer mode
    function toggleDateSelection(cell, dateStr) {
        if (selectedDates.has(dateStr)) {
            selectedDates.delete(dateStr);
            cell.className = 'cell level-0';
            cell.title = `${new Date(dateStr).toDateString()}: 0 commits`;
        } else {
            selectedDates.add(dateStr);
            cell.className = 'cell level-4';
            cell.title = `${new Date(dateStr).toDateString()}: Custom commit`;
        }
        updateStats();
        updateOutput();
    }

    // Reroll single day's commits in simulator mode
    function rerollDay(cell, dateStr) {
        const maxCommits = parseInt(inputMaxCommits.value);
        const commits = Math.floor(Math.random() * maxCommits) + 1;
        simulatedCommits[dateStr] = commits;
        
        const level = getCommitLevel(commits, maxCommits);
        cell.className = `cell level-${level}`;
        cell.title = `${new Date(dateStr).toDateString()}: ${commits} commits`;
        
        updateStats();
        updateOutput();
    }

    // Calculate GitHub color depth levels (0-4)
    function getCommitLevel(commits, max) {
        if (!commits || commits === 0) return 0;
        const ratio = commits / max;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    }

    // Run dynamic random simulation based on parameters
    function runSimulation() {
        const frequency = parseInt(inputFrequency.value);
        const maxCommits = parseInt(inputMaxCommits.value);
        const daysBefore = parseInt(inputDaysBefore.value);
        const daysAfter = parseInt(inputDaysAfter.value);
        const noWeekends = inputNoWeekends.checked;

        simulatedCommits = {};
        const today = new Date();
        today.setHours(0,0,0,0);

        const startLimit = new Date(today);
        startLimit.setDate(today.getDate() - daysBefore);

        const endLimit = new Date(today);
        endLimit.setDate(today.getDate() + daysAfter);

        const cells = calendarGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            const dateStr = cell.dataset.date;
            const cellDate = new Date(dateStr);
            cellDate.setHours(0,0,0,0);

            // Verify if cell falls inside bounds
            if (cellDate >= startLimit && cellDate <= endLimit) {
                const dayOfWeek = cellDate.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

                if (noWeekends && isWeekend) {
                    simulatedCommits[dateStr] = 0;
                    cell.className = 'cell level-0';
                    cell.title = `${cellDate.toDateString()}: 0 commits (Weekend excluded)`;
                } else if (Math.random() * 100 < frequency) {
                    const commits = Math.floor(Math.random() * maxCommits) + 1;
                    simulatedCommits[dateStr] = commits;
                    const level = getCommitLevel(commits, maxCommits);
                    cell.className = `cell level-${level}`;
                    cell.title = `${cellDate.toDateString()}: ${commits} commits`;
                } else {
                    simulatedCommits[dateStr] = 0;
                    cell.className = 'cell level-0';
                    cell.title = `${cellDate.toDateString()}: 0 commits`;
                }
            } else {
                simulatedCommits[dateStr] = 0;
                cell.className = 'cell level-0';
                cell.title = `${cellDate.toDateString()}: 0 commits (Out of range)`;
            }
        });

        updateStats();
        updateOutput();
    }

    // Refresh Statistics
    function updateStats() {
        if (currentMode === 'simulator') {
            let total = 0;
            let active = 0;
            let activeRange = 0;

            const daysBefore = parseInt(inputDaysBefore.value);
            const daysAfter = parseInt(inputDaysAfter.value);
            const maxDays = daysBefore + daysAfter;

            for (const key in simulatedCommits) {
                if (simulatedCommits[key] > 0) {
                    total += simulatedCommits[key];
                    active++;
                }
            }

            statTotalCommits.innerText = total.toLocaleString();
            statActiveDays.innerText = `${active} / ${maxDays} days`;
        } else {
            statTotalCommits.innerText = selectedDates.size;
            statActiveDays.innerText = `${selectedDates.size} / 371 days painted`;
        }
    }

    // Generate output CLI command / code snippets
    function updateOutput() {
        let cmd = 'python contribute.py';
        
        // Settings variables
        const maxCommits = inputMaxCommits.value;
        const frequency = inputFrequency.value;
        const daysBefore = inputDaysBefore.value;
        const daysAfter = inputDaysAfter.value;
        const noWeekends = inputNoWeekends.checked;

        // Custom config options
        const repo = inputRepository.value.trim();
        const user = inputUsername.value.trim();
        const email = inputEmail.value.trim();

        if (currentMode === 'simulator') {
            if (maxCommits != 10) cmd += ` --max_commits=${maxCommits}`;
            if (frequency != 80) cmd += ` --frequency=${frequency}`;
            if (daysBefore != 365) cmd += ` --days_before=${daysBefore}`;
            if (daysAfter != 0) cmd += ` --days_after=${daysAfter}`;
            if (noWeekends) cmd += ` --no_weekends`;
        } else {
            // Designer mode command
            cmd += ' --dates_file=dates.txt';
            if (maxCommits != 10) cmd += ` --max_commits=${maxCommits}`;

            // Fill the custom dates text box
            const sortedDates = Array.from(selectedDates).sort();
            datesSnippet.value = sortedDates.join('\n');
        }

        if (user) cmd += ` --user_name="${user}"`;
        if (email) cmd += ` --user_email="${email}"`;
        if (repo) cmd += ` --repository="${repo}"`;

        codeSnippet.innerText = cmd;
    }

    // Toggle Modes (Simulator vs Designer)
    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'simulator') {
            tabSimulator.classList.add('active');
            tabDesigner.classList.remove('active');
            simulatorSettings.classList.remove('hidden');
            designerSettings.classList.add('hidden');
            designerDatesSection.classList.add('hidden');
            
            // Clear grid and simulate
            runSimulation();
        } else {
            tabSimulator.classList.remove('active');
            tabDesigner.classList.add('active');
            simulatorSettings.classList.add('hidden');
            designerSettings.classList.remove('hidden');
            designerDatesSection.classList.remove('hidden');

            // Reset grid to empty for designer
            const cells = calendarGrid.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.className = 'cell level-0';
                const dateStr = cell.dataset.date;
                cell.title = `${new Date(dateStr).toDateString()}: 0 commits`;
            });
            selectedDates.clear();
            updateStats();
            updateOutput();
        }
    }

    // Clear Canvas actions
    btnClearCanvas.addEventListener('click', () => {
        if (currentMode !== 'designer') return;
        selectedDates.clear();
        const cells = calendarGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell level-0';
            const dateStr = cell.dataset.date;
            cell.title = `${new Date(dateStr).toDateString()}: 0 commits`;
        });
        updateStats();
        updateOutput();
    });

    // Invert Canvas actions
    btnInvertCanvas.addEventListener('click', () => {
        if (currentMode !== 'designer') return;
        const cells = calendarGrid.querySelectorAll('.cell');
        cells.forEach(cell => {
            const dateStr = cell.dataset.date;
            if (selectedDates.has(dateStr)) {
                selectedDates.delete(dateStr);
                cell.className = 'cell level-0';
                cell.title = `${new Date(dateStr).toDateString()}: 0 commits`;
            } else {
                selectedDates.add(dateStr);
                cell.className = 'cell level-4';
                cell.title = `${new Date(dateStr).toDateString()}: Custom commit`;
            }
        });
        updateStats();
        updateOutput();
    });

    // Event Bindings
    tabSimulator.addEventListener('click', () => switchMode('simulator'));
    tabDesigner.addEventListener('click', () => switchMode('designer'));

    inputFrequency.addEventListener('input', (e) => {
        valFrequency.innerText = `${e.target.value}%`;
        runSimulation();
    });
    
    inputMaxCommits.addEventListener('input', (e) => {
        valMaxCommits.innerText = e.target.value;
        if (currentMode === 'simulator') {
            runSimulation();
        } else {
            updateOutput();
        }
    });

    inputDaysBefore.addEventListener('input', (e) => {
        valDaysBefore.innerText = e.target.value;
        runSimulation();
    });

    inputDaysAfter.addEventListener('input', (e) => {
        valDaysAfter.innerText = e.target.value;
        runSimulation();
    });

    inputNoWeekends.addEventListener('change', () => {
        runSimulation();
    });

    inputRepository.addEventListener('input', updateOutput);
    inputUsername.addEventListener('input', updateOutput);
    inputEmail.addEventListener('input', updateOutput);

    // Copy to Clipboard Helpers
    function handleCopy(text, buttonEl, successText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = buttonEl.innerHTML;
            buttonEl.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${successText}</span>
            `;
            buttonEl.style.background = '#28a745';
            buttonEl.style.borderColor = '#28a745';
            
            setTimeout(() => {
                buttonEl.innerHTML = originalHTML;
                buttonEl.style.background = '';
                buttonEl.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }

    btnCopyCode.addEventListener('click', () => {
        handleCopy(codeSnippet.innerText, btnCopyCode, 'Copied Command!');
    });

    btnCopyDates.addEventListener('click', () => {
        handleCopy(datesSnippet.value, btnCopyDates, 'Copied Dates!');
    });

    // Initial Render
    renderCalendar();
    runSimulation();
});
