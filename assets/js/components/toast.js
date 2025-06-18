/**
 * 🔔 통합 Toast 알림 시스템
 * 모든 관리자 페이지에서 사용할 수 있는 통일된 알림 시스템
 * admin.js나 별도 파일로 추가하여 전역에서 사용
 */

// 전역 Toast 설정
window.toastConfig = {
    duration: {
        success: 3000,
        error: 5000,
        warning: 4000,
        info: 3000
    },
    maxToasts: 5,
    position: 'top-right' // top-left, top-right, bottom-left, bottom-right
};

/**
 * 🔔 메인 Toast 표시 함수
 */
function showToast(message, type = 'info', options = {}) {
    console.log(`Toast (${type}): ${message}`);

    // 기본 옵션과 병합
    const config = {
        duration: window.toastConfig.duration[type] || 3000,
        position: window.toastConfig.position,
        dismissible: true,
        showProgress: true,
        ...options
    };

    // 기존 토스트 개수 확인 및 정리
    manageToastCount();

    // 새 토스트 생성
    const toast = createToastElement(message, type, config);
    
    // 토스트 컨테이너에 추가
    const container = getOrCreateToastContainer(config.position);
    container.appendChild(toast);

    // 애니메이션 시작
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    // 진행바 애니메이션 (옵션)
    if (config.showProgress) {
        startProgressAnimation(toast, config.duration);
    }

    // 자동 제거 설정
    const autoRemoveTimer = setTimeout(() => {
        removeToast(toast);
    }, config.duration);

    // 토스트에 타이머 저장 (수동 제거 시 필요)
    toast._autoRemoveTimer = autoRemoveTimer;

    // 수동 제거 이벤트 등록
    if (config.dismissible) {
        setupToastDismissal(toast);
    }

    return toast;
}

/**
 * 🎨 토스트 요소 생성
 */
function createToastElement(message, type, config) {
    const toast = document.createElement('div');
    toast.className = `admin-toast toast-${type}`;
    
    // 타입별 아이콘
    const icons = {
        success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`,
        error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`,
        warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>`,
        info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
    };

    const icon = icons[type] || icons.info;
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                ${icon}
            </div>
            <div class="toast-message">
                ${message}
            </div>
            ${config.dismissible ? `
                <button class="toast-close" aria-label="닫기">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            ` : ''}
        </div>
        ${config.showProgress ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>' : ''}
    `;

    return toast;
}

/**
 * 📦 토스트 컨테이너 가져오기 또는 생성
 */
function getOrCreateToastContainer(position) {
    const containerId = `toast-container-${position}`;
    let container = document.getElementById(containerId);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = `toast-container toast-${position}`;
        document.body.appendChild(container);
    }
    
    return container;
}

/**
 * 📊 진행바 애니메이션
 */
function startProgressAnimation(toast, duration) {
    const progressBar = toast.querySelector('.toast-progress-bar');
    if (progressBar) {
        progressBar.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
    }
}

/**
 * 🗑️ 토스트 제거
 */
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;

    // 타이머 정리
    if (toast._autoRemoveTimer) {
        clearTimeout(toast._autoRemoveTimer);
    }

    // 애니메이션으로 제거
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * 🖱️ 토스트 수동 제거 설정
 */
function setupToastDismissal(toast) {
    // 닫기 버튼 클릭
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => removeToast(toast));
    }

    // 토스트 클릭으로 제거
    toast.addEventListener('click', () => removeToast(toast));

    // 호버 시 타이머 일시정지
    let isPaused = false;
    toast.addEventListener('mouseenter', () => {
        if (!isPaused) {
            isPaused = true;
            const progressBar = toast.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'paused';
            }
        }
    });

    toast.addEventListener('mouseleave', () => {
        if (isPaused) {
            isPaused = false;
            const progressBar = toast.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
        }
    });
}

/**
 * 📝 토스트 개수 관리
 */
function manageToastCount() {
    const containers = document.querySelectorAll('[id^="toast-container-"]');
    let totalToasts = 0;
    
    containers.forEach(container => {
        totalToasts += container.children.length;
    });

    // 최대 개수 초과 시 오래된 토스트 제거
    if (totalToasts >= window.toastConfig.maxToasts) {
        containers.forEach(container => {
            const toasts = Array.from(container.children);
            const excessCount = toasts.length - Math.floor(window.toastConfig.maxToasts / containers.length);
            
            if (excessCount > 0) {
                toasts.slice(0, excessCount).forEach(toast => {
                    removeToast(toast);
                });
            }
        });
    }
}

/**
 * 🎯 편의 함수들
 */
function showSuccessToast(message, options = {}) {
    return showToast(message, 'success', options);
}

function showErrorToast(message, options = {}) {
    return showToast(message, 'error', options);
}

function showWarningToast(message, options = {}) {
    return showToast(message, 'warning', options);
}

function showInfoToast(message, options = {}) {
    return showToast(message, 'info', options);
}

/**
 * 🧹 모든 토스트 제거
 */
function clearAllToasts() {
    const containers = document.querySelectorAll('[id^="toast-container-"]');
    containers.forEach(container => {
        Array.from(container.children).forEach(toast => {
            removeToast(toast);
        });
    });
}

/**
 * ⚙️ 토스트 설정 업데이트
 */
function updateToastConfig(newConfig) {
    window.toastConfig = {
        ...window.toastConfig,
        ...newConfig
    };
}

// =================================
// 전역 함수로 노출
// =================================

// 메인 함수들
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
window.clearAllToasts = clearAllToasts;
window.updateToastConfig = updateToastConfig;

// 기존 board-management.js와의 호환성
window.showToast = showToast;

// =================================
// adminAuth와의 통합
// =================================

// adminAuth.showNotification과 통합
if (window.adminAuth) {
    // 기존 함수 백업
    const originalShowNotification = window.adminAuth.showNotification;
    
    // Toast 시스템으로 교체
    window.adminAuth.showNotification = function(message, type = 'info') {
        return showToast(message, type);
    };
    
    // 원본 함수도 보존 (필요한 경우)
    window.adminAuth._originalShowNotification = originalShowNotification;
}

console.log('✅ 통합 Toast 알림 시스템 로드 완료');
console.log('📱 사용법: showToast("메시지", "success|error|warning|info")');
console.log('🔧 편의 함수: showSuccessToast(), showErrorToast(), showWarningToast(), showInfoToast()');
console.log('🧹 전체 제거: clearAllToasts()');