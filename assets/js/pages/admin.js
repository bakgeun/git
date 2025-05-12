/**
 * 관리자 페이지 공통 스크립트
 * 모든 관리자 페이지에서 사용되는 공통 기능
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function() {
    // adminUtils 네임스페이스 생성
    window.adminUtils = {
        /**
         * 데이터 테이블 생성
         * 
         * @param {string} tableId - 테이블 요소 ID
         * @param {Array} data - 테이블 데이터
         * @param {Object} columns - 컬럼 정의
         * @param {Object} options - 추가 옵션
         */
        createDataTable: function(tableId, data, columns, options = {}) {
            const table = document.getElementById(tableId);
            if (!table) return;
            
            // 헤더 생성
            const thead = table.querySelector('thead') || document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    ${Object.values(columns).map(col => `<th>${col.label}</th>`).join('')}
                    ${options.actions ? '<th>작업</th>' : ''}
                </tr>
            `;
            
            if (!table.querySelector('thead')) {
                table.appendChild(thead);
            }
            
            // 바디 생성
            const tbody = table.querySelector('tbody') || document.createElement('tbody');
            tbody.innerHTML = data.map(item => `
                <tr data-id="${item.id}">
                    ${Object.keys(columns).map(key => {
                        const column = columns[key];
                        let value = item[key];
                        
                        // 포맷터 적용
                        if (column.formatter) {
                            value = column.formatter(value, item);
                        }
                        
                        return `<td>${value || '-'}</td>`;
                    }).join('')}
                    ${options.actions ? `
                        <td>
                            ${options.actions.map(action => 
                                `<button class="admin-btn admin-btn-${action.type} btn-sm" 
                                    onclick="${action.handler}('${item.id}')">
                                    ${action.label}
                                </button>`
                            ).join(' ')}
                        </td>
                    ` : ''}
                </tr>
            `).join('');
            
            if (!table.querySelector('tbody')) {
                table.appendChild(tbody);
            }
            
            // 빈 데이터 처리
            if (data.length === 0) {
                const colspan = Object.keys(columns).length + (options.actions ? 1 : 0);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="${colspan}" class="text-center py-4 text-gray-500">
                            데이터가 없습니다.
                        </td>
                    </tr>
                `;
            }
        },
        
        /**
         * 페이지네이션 생성
         * 
         * @param {string} containerId - 페이지네이션 컨테이너 ID
         * @param {number} currentPage - 현재 페이지
         * @param {number} totalPages - 전체 페이지 수
         * @param {function} onPageChange - 페이지 변경 핸들러
         */
        createPagination: function(containerId, currentPage, totalPages, onPageChange) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            let html = '<div class="admin-pagination">';
            
            // 이전 페이지 버튼
            html += `
                <button class="admin-pagination-btn" 
                    onclick="${onPageChange}(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                    이전
                </button>
            `;
            
            // 페이지 번호
            const maxButtons = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);
            
            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button class="admin-pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="${onPageChange}(${i})">
                        ${i}
                    </button>
                `;
            }
            
            // 다음 페이지 버튼
            html += `
                <button class="admin-pagination-btn" 
                    onclick="${onPageChange}(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                    다음
                </button>
            `;
            
            html += '</div>';
            container.innerHTML = html;
        },
        
        /**
         * 모달 표시
         * 
         * @param {Object} options - 모달 옵션
         */
        showModal: function(options) {
            // 기존 모달 제거
            const existingModal = document.getElementById('admin-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // 모달 생성
            const modalHtml = `
                <div id="admin-modal" class="admin-modal-overlay">
                    <div class="admin-modal">
                        <div class="admin-modal-header">
                            <h3 class="text-lg font-medium">${options.title || '알림'}</h3>
                            <button onclick="adminUtils.closeModal()" class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="admin-modal-body">
                            ${options.content || ''}
                        </div>
                        <div class="admin-modal-footer">
                            ${options.buttons ? options.buttons.map(btn => `
                                <button class="admin-btn admin-btn-${btn.type || 'secondary'}"
                                    onclick="${btn.handler}">
                                    ${btn.label}
                                </button>
                            `).join('') : ''}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        },
        
        /**
         * 모달 닫기
         */
        closeModal: function() {
            const modal = document.getElementById('admin-modal');
            if (modal) {
                modal.remove();
            }
        },
        
        /**
         * 확인 대화상자
         * 
         * @param {string} message - 확인 메시지
         * @param {function} onConfirm - 확인 시 콜백
         */
        confirmDialog: function(message, onConfirm) {
            this.showModal({
                title: '확인',
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        label: '취소',
                        type: 'secondary',
                        handler: 'adminUtils.closeModal()'
                    },
                    {
                        label: '확인',
                        type: 'primary',
                        handler: `adminUtils.closeModal(); (${onConfirm})()`
                    }
                ]
            });
        },
        
        /**
         * 폼 유효성 검사
         * 
         * @param {HTMLFormElement} form - 폼 요소
         * @param {Object} rules - 유효성 검사 규칙
         * @returns {boolean} - 유효성 검사 통과 여부
         */
        validateForm: function(form, rules) {
            let isValid = true;
            const errors = {};
            
            Object.keys(rules).forEach(fieldName => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field) return;
                
                const fieldRules = rules[fieldName];
                const value = field.value.trim();
                
                // 필수 항목 검사
                if (fieldRules.required && !value) {
                    errors[fieldName] = fieldRules.required;
                    isValid = false;
                    return;
                }
                
                // 최소 길이 검사
                if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
                    errors[fieldName] = fieldRules.minLength.message;
                    isValid = false;
                    return;
                }
                
                // 최대 길이 검사
                if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
                    errors[fieldName] = fieldRules.maxLength.message;
                    isValid = false;
                    return;
                }
                
                // 패턴 검사
                if (fieldRules.pattern && !fieldRules.pattern.value.test(value)) {
                    errors[fieldName] = fieldRules.pattern.message;
                    isValid = false;
                    return;
                }
                
                // 커스텀 검사
                if (fieldRules.custom && !fieldRules.custom.validator(value)) {
                    errors[fieldName] = fieldRules.custom.message;
                    isValid = false;
                }
            });
            
            // 오류 표시
            Object.keys(errors).forEach(fieldName => {
                this.showFieldError(form, fieldName, errors[fieldName]);
            });
            
            return isValid;
        },
        
        /**
         * 필드 오류 표시
         * 
         * @param {HTMLFormElement} form - 폼 요소
         * @param {string} fieldName - 필드 이름
         * @param {string} message - 오류 메시지
         */
        showFieldError: function(form, fieldName, message) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            
            // 기존 오류 메시지 제거
            const existingError = field.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // 오류 메시지 추가
            const errorElement = document.createElement('p');
            errorElement.className = 'error-message text-red-500 text-sm mt-1';
            errorElement.textContent = message;
            field.parentElement.appendChild(errorElement);
            
            // 필드 스타일 변경
            field.classList.add('border-red-500');
        },
        
        /**
         * 필드 오류 제거
         * 
         * @param {HTMLFormElement} form - 폼 요소
         * @param {string} fieldName - 필드 이름
         */
        clearFieldError: function(form, fieldName) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;
            
            // 오류 메시지 제거
            const existingError = field.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // 필드 스타일 복원
            field.classList.remove('border-red-500');
        },
        
        /**
         * 검색 필터 생성
         * 
         * @param {string} containerId - 필터 컨테이너 ID
         * @param {Object} filterOptions - 필터 옵션
         * @param {function} onFilter - 필터 적용 핸들러
         */
        createSearchFilter: function(containerId, filterOptions, onFilter) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            let html = '<div class="admin-filter-section"><div class="admin-filter-row">';
            
            // 검색어 입력
            if (filterOptions.searchField) {
                html += `
                    <div class="admin-form-group flex-1">
                        <label class="admin-form-label">${filterOptions.searchField.label}</label>
                        <input type="text" 
                            id="search-keyword"
                            class="admin-form-control" 
                            placeholder="${filterOptions.searchField.placeholder || '검색어 입력'}">
                    </div>
                `;
            }
            
            // 선택 필터
            if (filterOptions.selectFilters) {
                filterOptions.selectFilters.forEach(filter => {
                    html += `
                        <div class="admin-form-group">
                            <label class="admin-form-label">${filter.label}</label>
                            <select id="${filter.id}" class="admin-form-control">
                                <option value="">전체</option>
                                ${filter.options.map(opt => 
                                    `<option value="${opt.value}">${opt.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    `;
                });
            }
            
            // 날짜 필터
            if (filterOptions.dateFilter) {
                html += `
                    <div class="admin-form-group">
                        <label class="admin-form-label">시작일</label>
                        <input type="date" id="start-date" class="admin-form-control">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">종료일</label>
                        <input type="date" id="end-date" class="admin-form-control">
                    </div>
                `;
            }
            
            // 검색 버튼
            html += `
                <div class="admin-form-group">
                    <button class="admin-btn admin-btn-primary" onclick="${onFilter}()">
                        검색
                    </button>
                </div>
                <div class="admin-form-group">
                    <button class="admin-btn admin-btn-secondary" onclick="adminUtils.resetFilters()">
                        초기화
                    </button>
                </div>
            `;
            
            html += '</div></div>';
            container.innerHTML = html;
        },
        
        /**
         * 필터 초기화
         */
        resetFilters: function() {
            const filterInputs = document.querySelectorAll('.admin-filter-section input, .admin-filter-section select');
            filterInputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        },
        
        /**
         * 로딩 오버레이 표시
         * 
         * @param {boolean} show - 표시 여부
         */
        showLoadingOverlay: function(show = true) {
            const existingOverlay = document.getElementById('loading-overlay');
            
            if (show) {
                if (existingOverlay) return;
                
                const overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.innerHTML = `
                    <div class="bg-white rounded-lg p-6 flex items-center space-x-4">
                        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-gray-800">처리 중...</span>
                    </div>
                `;
                document.body.appendChild(overlay);
            } else {
                if (existingOverlay) {
                    existingOverlay.remove();
                }
            }
        },
        
        /**
         * 토스트 알림 표시
         * 
         * @param {string} message - 알림 메시지
         * @param {string} type - 알림 타입 ('success', 'error', 'info', 'warning')
         * @param {number} duration - 표시 시간 (ms)
         */
        showToast: function(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white z-50 
                ${type === 'success' ? 'bg-green-500' : 
                  type === 'error' ? 'bg-red-500' : 
                  type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, duration);
        }
    };
})();