// 侧边栏脚本
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const sidebar = document.getElementById('sidebar');
const header = document.querySelector('.sidebar-header');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');

// 拖拽功能
header.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === header || header.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, sidebar);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// 最小化功能
minimizeBtn.addEventListener('click', () => {
    sidebar.classList.toggle('minimized');
});

// 点击最小化图标恢复
sidebar.addEventListener('click', (e) => {
    if (sidebar.classList.contains('minimized')) {
        sidebar.classList.remove('minimized');
    }
});

// 关闭功能
closeBtn.addEventListener('click', () => {
    sidebar.style.display = 'none';
});

// 从 popup.js 复制所有功能
// ... (这里需要复制 popup.js 的所有逻辑)
