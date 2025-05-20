/**
 * mypage.js
 * 마이페이지 공통 기능을 제공하는 모듈
 */

// IIFE(즉시 실행 함수 표현식)을 사용하여 전역 네임스페이스 오염 방지
window.mypageHelpers = (function() {
    // Private 변수 및 함수
    
    /**
     * 마이페이지 사이드바 네비게이션 초기화
     */
    function initializeSidebar() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.mypage-nav-link');
        
        navLinks.forEach(link => {
            // 현재 페이지와 매칭되는 링크 활성화
            if (link.getAttribute('href') === currentPath || link.getAttribute('href').includes(currentPath)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    /**
     * 파일 업로드 프리뷰 기능
     * @param {HTMLInputElement} input - 파일 입력 요소
     * @param {HTMLElement} previewElement - 미리보기 요소
     * @param {function} callback - 파일 선택 후 콜백
     */
    function setupFilePreview(input, previewElement, callback) {
        if (!input || !previewElement) return;
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // 파일 크기 체크 (5MB 제한)
                if (file.size > 5 * 1024 * 1024) {
                    alert('파일 크기는 5MB 이하여야 합니다.');
                    input.value = '';
                    return;
                }
                
                // 이미지 파일 체크
                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드 가능합니다.');
                    input.value = '';
                    return;
                }
                
                // FileReader를 사용하여 미리보기
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (previewElement.tagName === 'IMG') {
                        previewElement.src = e.target.result;
                    } else {
                        previewElement.style.backgroundImage = `url(${e.target.result})`;
                    }
                    
                    if (callback) callback(file, e.target.result);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Public API
    return {
        /**
         * 마이페이지 초기화
         */
        initialize: function() {
            // 사이드바 초기화
            initializeSidebar();
            
            // 인증 상태 체크
            this.checkAuthState();
            
            // 공통 이벤트 리스너 설정
            this.setupCommonEventListeners();
        },
        
        /**
         * 인증 상태 체크
         */
        checkAuthState: function() {
            const user = window.authService.getCurrentUser();
            
            if (!user) {
                // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
                window.location.href = '/pages/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname);
                return false;
            }
            
            return true;
        },
        
        /**
         * 마이페이지 사용자 정보 로드
         */
        loadUserInfo: async function() {
            try {
                const userDetails = await window.authService.getCurrentUserDetails();
                
                if (userDetails) {
                    return userDetails;
                } else {
                    throw new Error('사용자 정보를 가져올 수 없습니다.');
                }
            } catch (error) {
                console.error('사용자 정보 로드 실패:', error);
                return null;
            }
        },
        
        /**
         * 알림 메시지 표시
         * @param {string} message - 표시할 메시지
         * @param {string} type - 메시지 타입 ('success', 'error', 'info')
         * @param {number} duration - 표시 시간 (ms)
         */
        showNotification: function(message, type = 'info', duration = 3000) {
            // 기존 알림 제거
            const existingNotification = document.querySelector('.notification-toast');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // 알림 요소 생성
            const notification = document.createElement('div');
            notification.className = `notification-toast ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                    <span class="notification-message">${message}</span>
                </div>
            `;
            
            // 스타일 적용
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                padding: 16px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            `;
            
            // 타입에 따른 배경색
            const colors = {
                success: '#22c55e',
                error: '#ef4444',
                info: '#3b82f6'
            };
            notification.style.backgroundColor = colors[type] || colors.info;
            
            // DOM에 추가
            document.body.appendChild(notification);
            
            // 페이드 인
            setTimeout(() => {
                notification.style.opacity = '1';
            }, 10);
            
            // 자동 제거
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
        },
        
        /**
         * 알림 아이콘 SVG 반환
         * @param {string} type - 알림 타입
         * @returns {string} - SVG 아이콘 문자열
         */
        getNotificationIcon: function(type) {
            const icons = {
                success: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
                error: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
                info: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
            };
            return icons[type] || icons.info;
        },
        
        /**
         * 모달 열기
         * @param {string} modalId - 모달 ID
         */
        openModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        },
        
        /**
         * 모달 닫기
         * @param {string} modalId - 모달 ID
         */
        closeModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        },
        
        /**
         * 확인 대화상자 표시
         * @param {string} message - 확인 메시지
         * @param {function} onConfirm - 확인 콜백
         * @param {function} onCancel - 취소 콜백
         */
        showConfirmDialog: function(message, onConfirm, onCancel) {
            const modalHtml = `
                <div id="confirm-modal" class="mypage-modal active">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">확인</h3>
                            <button class="modal-close" onclick="mypageHelpers.closeModal('confirm-modal')">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button id="confirm-cancel" class="btn btn-secondary">취소</button>
                            <button id="confirm-ok" class="btn btn-primary">확인</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 기존 모달이 있으면 제거
            const existingModal = document.getElementById('confirm-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // 모달 추가
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // 이벤트 리스너 설정
            document.getElementById('confirm-ok').addEventListener('click', function() {
                mypageHelpers.closeModal('confirm-modal');
                document.getElementById('confirm-modal').remove();
                if (onConfirm) onConfirm();
            });
            
            document.getElementById('confirm-cancel').addEventListener('click', function() {
                mypageHelpers.closeModal('confirm-modal');
                document.getElementById('confirm-modal').remove();
                if (onCancel) onCancel();
            });
        },
        
        /**
         * 날짜 포맷팅
         * @param {Date|string} date - 날짜
         * @param {string} format - 포맷 (기본값: 'YYYY-MM-DD')
         * @returns {string} - 포맷팅된 날짜 문자열
         */
        formatDate: function(date, format = 'YYYY-MM-DD') {
            return window.formatters.formatDate(date, format);
        },
        
        /**
         * 상대적 시간 포맷팅
         * @param {Date|string} date - 날짜
         * @returns {string} - 상대적 시간 문자열
         */
        formatRelativeTime: function(date) {
            return window.formatters.formatRelativeTime(date);
        },
        
        /**
         * 금액 포맷팅
         * @param {number} amount - 금액
         * @returns {string} - 포맷팅된 금액 문자열
         */
        formatCurrency: function(amount) {
            return window.formatters.formatCurrency(amount);
        },
        
        /**
         * 파일 업로드 설정
         * @param {HTMLInputElement} input - 파일 입력 요소
         * @param {HTMLElement} previewElement - 미리보기 요소
         * @param {function} callback - 업로드 완료 콜백
         */
        setupFileUpload: function(input, previewElement, callback) {
            setupFilePreview(input, previewElement, callback);
        },
        
        /**
         * 페이지네이션 설정
         * @param {HTMLElement} container - 페이지네이션 컨테이너
         * @param {number} currentPage - 현재 페이지
         * @param {number} totalPages - 전체 페이지 수
         * @param {function} onPageChange - 페이지 변경 콜백
         */
        setupPagination: function(container, currentPage, totalPages, onPageChange) {
            if (!container) return;
            
            let html = '<div class="pagination">';
            
            // 이전 페이지 버튼
            html += `<button class="pagination-button" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">이전</button>`;
            
            // 페이지 번호 버튼들
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            if (startPage > 1) {
                html += `<button class="pagination-button" data-page="1">1</button>`;
                if (startPage > 2) {
                    html += '<span class="pagination-ellipsis">...</span>';
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="pagination-button ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += '<span class="pagination-ellipsis">...</span>';
                }
                html += `<button class="pagination-button" data-page="${totalPages}">${totalPages}</button>`;
            }
            
            // 다음 페이지 버튼
            html += `<button class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">다음</button>`;
            
            html += '</div>';
            
            container.innerHTML = html;
            
            // 이벤트 리스너 설정
            container.querySelectorAll('.pagination-button').forEach(button => {
                button.addEventListener('click', function() {
                    if (!this.disabled) {
                        const page = parseInt(this.dataset.page);
                        if (onPageChange) onPageChange(page);
                    }
                });
            });
        },
        
        /**
         * 데이터 테이블 초기화
         * @param {HTMLTableElement} table - 테이블 요소
         * @param {object} options - 테이블 옵션
         */
        initializeDataTable: function(table, options = {}) {
            if (!table) return;
            
            const defaultOptions = {
                sortable: true,
                searchable: true,
                paginate: true,
                pageSize: 10
            };
            
            const settings = { ...defaultOptions, ...options };
            
            // 여기에 데이터 테이블 초기화 로직 구현
            // 정렬, 검색, 페이지네이션 기능 등
        },
        
        /**
         * 폼 유효성 검사
         * @param {HTMLFormElement} form - 폼 요소
         * @returns {boolean} - 유효성 검사 결과
         */
        validateForm: function(form) {
            if (!form) return false;
            
            let isValid = true;
            
            // 필수 입력 필드 검사
            form.querySelectorAll('[required]').forEach(input => {
                if (!input.value.trim()) {
                    this.showFieldError(input, '필수 입력 항목입니다.');
                    isValid = false;
                } else {
                    this.clearFieldError(input);
                }
            });
            
            // 이메일 필드 검사
            form.querySelectorAll('input[type="email"]').forEach(input => {
                if (input.value && !window.validators.isValidEmail(input.value)) {
                    this.showFieldError(input, '올바른 이메일 형식이 아닙니다.');
                    isValid = false;
                }
            });
            
            // 전화번호 필드 검사
            form.querySelectorAll('input[type="tel"]').forEach(input => {
                if (input.value && !window.validators.isValidPhone(input.value)) {
                    this.showFieldError(input, '올바른 전화번호 형식이 아닙니다.');
                    isValid = false;
                }
            });
            
            return isValid;
        },
        
        /**
         * 필드 오류 표시
         * @param {HTMLElement} field - 필드 요소
         * @param {string} message - 오류 메시지
         */
        showFieldError: function(field, message) {
            // 기존 오류 메시지 제거
            this.clearFieldError(field);
            
            // 필드에 오류 클래스 추가
            field.classList.add('error');
            
            // 오류 메시지 요소 생성
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            // 필드 다음에 오류 메시지 삽입
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        },
        
        /**
         * 필드 오류 제거
         * @param {HTMLElement} field - 필드 요소
         */
        clearFieldError: function(field) {
            field.classList.remove('error');
            
            // 오류 메시지 요소 제거
            const errorDiv = field.parentNode.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.remove();
            }
        },
        
        /**
         * 공통 이벤트 리스너 설정
         */
        setupCommonEventListeners: function() {
            // 모달 닫기 버튼 이벤트
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal-close') || e.target.classList.contains('mypage-modal')) {
                    const modal = e.target.closest('.mypage-modal');
                    if (modal) {
                        mypageHelpers.closeModal(modal.id);
                    }
                }
            });
            
            // ESC 키로 모달 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const activeModal = document.querySelector('.mypage-modal.active');
                    if (activeModal) {
                        mypageHelpers.closeModal(activeModal.id);
                    }
                }
            });
        },
        
        /**
         * 로딩 상태 표시
         * @param {HTMLElement} container - 컨테이너 요소
         * @param {boolean} show - 표시 여부
         */
        showLoading: function(container, show = true) {
            if (!container) return;
            
            if (show) {
                container.innerHTML = `
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>데이터를 불러오는 중입니다...</p>
                    </div>
                `;
            }
        },
        
        /**
         * 빈 상태 표시
         * @param {HTMLElement} container - 컨테이너 요소
         * @param {string} message - 메시지
         * @param {string} buttonText - 버튼 텍스트 (선택사항)
         * @param {function} onButtonClick - 버튼 클릭 콜백 (선택사항)
         */
        showEmptyState: function(container, message, buttonText, onButtonClick) {
            if (!container) return;
            
            let html = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p class="empty-state-message">${message}</p>
            `;
            
            if (buttonText && onButtonClick) {
                html += `<button class="btn btn-primary empty-state-button">${buttonText}</button>`;
            }
            
            html += '</div>';
            
            container.innerHTML = html;
            
            if (buttonText && onButtonClick) {
                container.querySelector('.empty-state-button').addEventListener('click', onButtonClick);
            }
        }
    };
})();

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.mypageHelpers.initialize();
});