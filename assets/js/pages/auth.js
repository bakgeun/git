/**
 * auth.js
 * 인증 페이지들의 공통 기능을 제공하는 모듈
 */

// 전역 네임스페이스에 authHelpers 객체 생성
window.authHelpers = (function() {
    // Private 변수 및 함수
    
    // Public API
    return {
        /**
         * 알림 메시지 표시
         * @param {string} message - 표시할 메시지
         * @param {string} type - 메시지 타입 ('error', 'success', 'info')
         * @param {HTMLElement} container - 메시지를 표시할 컨테이너 요소
         */
        showNotification: function(message, type = 'error', container = null) {
            const notificationElement = container || document.getElementById('notification');
            if (!notificationElement) return;
            
            // 메시지 타입에 따른 스타일 클래스 설정
            const classes = {
                'error': 'bg-red-100 border-l-4 border-red-500 text-red-700',
                'success': 'bg-green-100 border-l-4 border-green-500 text-green-700',
                'info': 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
            };
            
            const icons = {
                'error': `<svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>`,
                'success': `<svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>`,
                'info': `<svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>`
            };
            
            notificationElement.innerHTML = `
                <div class="${classes[type]} p-4 rounded">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            ${icons[type]}
                        </div>
                        <div class="ml-3">
                            <p id="notification-message">${message}</p>
                        </div>
                    </div>
                </div>
            `;
            
            notificationElement.classList.remove('hidden');
            notificationElement.classList.add('mb-6', 'block');
            
            // 메시지가 표시된 후 스크롤
            notificationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        
        /**
         * 알림 메시지 숨기기
         * @param {HTMLElement} container - 메시지 컨테이너 요소
         */
        hideNotification: function(container = null) {
            const notificationElement = container || document.getElementById('notification');
            if (notificationElement) {
                notificationElement.classList.add('hidden');
            }
        },
        
        /**
         * 버튼 로딩 상태 설정
         * @param {HTMLElement} button - 버튼 요소
         * @param {boolean} isLoading - 로딩 상태
         * @param {string} loadingText - 로딩 중 표시할 텍스트
         */
        setButtonLoading: function(button, isLoading, loadingText = '처리 중...') {
            if (!button) return;
            
            const originalText = button.getAttribute('data-original-text') || button.textContent;
            
            if (isLoading) {
                // 원래 텍스트 저장
                button.setAttribute('data-original-text', originalText);
                
                // 버튼 비활성화 및 로딩 상태 표시
                button.disabled = true;
                button.classList.add('opacity-70', 'cursor-not-allowed');
                button.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ${loadingText}
                `;
            } else {
                // 버튼 활성화 및 원래 상태로 복원
                button.disabled = false;
                button.classList.remove('opacity-70', 'cursor-not-allowed');
                button.textContent = originalText;
            }
        },
        
        /**
         * 폼 필드 유효성 검사 표시
         * @param {HTMLElement} input - 입력 필드
         * @param {boolean} isValid - 유효성 여부
         * @param {string} errorMessage - 오류 메시지
         */
        showFieldValidation: function(input, isValid, errorMessage = '') {
            if (!input) return;
            
            const errorElement = input.nextElementSibling?.classList.contains('error-message') 
                ? input.nextElementSibling 
                : null;
            
            if (isValid) {
                input.classList.remove('border-red-500');
                input.classList.add('border-gray-300');
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.classList.add('hidden');
                }
            } else {
                input.classList.remove('border-gray-300');
                input.classList.add('border-red-500');
                
                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.classList.remove('hidden');
                } else if (errorMessage) {
                    // 오류 메시지 요소가 없으면 생성
                    const newErrorElement = document.createElement('p');
                    newErrorElement.className = 'error-message text-red-500 text-xs mt-1';
                    newErrorElement.textContent = errorMessage;
                    input.parentNode.insertBefore(newErrorElement, input.nextSibling);
                }
            }
        },
        
        /**
         * 모달 표시
         * @param {string} modalId - 모달 ID
         */
        showModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
            }
        },
        
        /**
         * 모달 숨기기
         * @param {string|HTMLElement} modalOrId - 모달 ID 또는 요소
         */
        hideModal: function(modalOrId) {
            const modal = typeof modalOrId === 'string' 
                ? document.getElementById(modalOrId) 
                : modalOrId;
                
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = ''; // 배경 스크롤 복원
            }
        },
        
        /**
         * URL 파라미터에서 값 가져오기
         * @param {string} name - 파라미터 이름
         * @returns {string|null} - 파라미터 값
         */
        getUrlParameter: function(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },
        
        /**
         * 이메일 형식 검증
         * @param {string} email - 이메일 주소
         * @returns {boolean} - 유효성 여부
         */
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        /**
         * 전화번호 형식화
         * @param {string} phoneNumber - 전화번호
         * @returns {string} - 형식화된 전화번호
         */
        formatPhoneNumber: function(phoneNumber) {
            // 숫자만 추출
            const cleaned = phoneNumber.replace(/\D/g, '');
            
            // 한국 휴대폰 번호 형식으로 변환 (010-1234-5678)
            if (cleaned.length === 11 && cleaned.startsWith('01')) {
                return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            }
            
            // 기타 번호 형식 (02-123-4567, 031-123-4567 등)
            if (cleaned.length === 9) {
                return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
            }
            if (cleaned.length === 10) {
                if (cleaned.startsWith('02')) {
                    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
                } else {
                    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                }
            }
            
            return phoneNumber;
        },
        
        /**
         * 비밀번호 강도 체크
         * @param {string} password - 비밀번호
         * @returns {object} - 강도 체크 결과
         */
        checkPasswordStrength: function(password) {
            const result = {
                score: 0,
                feedback: [],
                isValid: false
            };
            
            // 길이 체크
            if (password.length >= 8) {
                result.score += 1;
            } else {
                result.feedback.push('8자 이상이어야 합니다');
            }
            
            // 대문자 포함
            if (/[A-Z]/.test(password)) {
                result.score += 1;
            } else {
                result.feedback.push('대문자를 포함해야 합니다');
            }
            
            // 소문자 포함
            if (/[a-z]/.test(password)) {
                result.score += 1;
            } else {
                result.feedback.push('소문자를 포함해야 합니다');
            }
            
            // 숫자 포함
            if (/\d/.test(password)) {
                result.score += 1;
            } else {
                result.feedback.push('숫자를 포함해야 합니다');
            }
            
            // 특수문자 포함
            if (/[!@#$%^&*]/.test(password)) {
                result.score += 1;
            }
            
            // 최소 요구사항 충족 여부
            result.isValid = result.score >= 4 && password.length >= 8;
            
            return result;
        },
        
        /**
         * 디바운스 함수
         * @param {Function} func - 실행할 함수
         * @param {number} wait - 대기 시간 (ms)
         * @returns {Function} - 디바운스된 함수
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };
})();