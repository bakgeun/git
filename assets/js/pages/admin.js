/**
 * 관리자 페이지 공통 스크립트
 * 모든 관리자 페이지에서 사용되는 공통 기능
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 네임스페이스 오염 방지
(function () {
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
        createDataTable: function (tableId, data, columns, options = {}) {
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
        createPagination: function (containerId, currentPage, totalPages, onPageChange) {
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
        showModal: function (options) {
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
        closeModal: function () {
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
        confirmDialog: function (message, onConfirm) {
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
        validateForm: function (form, rules) {
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
        showFieldError: function (form, fieldName, message) {
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
        clearFieldError: function (form, fieldName) {
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
        createSearchFilter: function (containerId, filterOptions, onFilter) {
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
        resetFilters: function () {
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
        showLoadingOverlay: function (show = true) {
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
        showToast: function (message, type = 'info', duration = 3000) {
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
        },

        /**
         * 페이지 간 사용자 정보 유지를 위한 함수
         */
        initUserInfo: function () {
            console.log('사용자 정보 초기화 시작');

            // 기본값 설정 (즉시 표시)
            const defaultAdminName = '관리자';
            const defaultAdminEmail = 'gostepexercise@gmail.com';

            // DOM 요소 참조
            const adminNameElem = document.getElementById('admin-name');
            const adminEmailElem = document.getElementById('admin-email');

            // 기본값으로 즉시 채우기
            if (adminNameElem) adminNameElem.textContent = defaultAdminName;
            if (adminEmailElem) adminEmailElem.textContent = defaultAdminEmail;

            // 세션 스토리지에서 사용자 정보 확인 (기본값보다 우선)
            const savedAdminName = sessionStorage.getItem('admin_name');
            const savedAdminEmail = sessionStorage.getItem('admin_email');

            // 저장된 정보가 있으면 즉시 표시
            if (savedAdminName && savedAdminEmail) {
                console.log('저장된 사용자 정보 발견:', savedAdminName, savedAdminEmail);

                if (adminNameElem) adminNameElem.textContent = savedAdminName;
                if (adminEmailElem) adminEmailElem.textContent = savedAdminEmail;
            }

            // 사용자 정보가 표시되었음을 표시
            const userInfoElem = document.querySelector('.admin-user-info');
            if (userInfoElem) {
                userInfoElem.classList.add('loaded');
                userInfoElem.classList.remove('not-loaded');
            }

            // 사이드바 정보 업데이트
            this.addUserInfoToSidebar();

            // Firebase 인증 정보 확인 후 업데이트 (비동기로 진행)
            if (window.dhcFirebase) {
                console.log('Firebase 인증 리스너 설정');

                window.dhcFirebase.onAuthStateChanged((user) => {
                    if (user) {
                        console.log('인증된 사용자:', user.email);

                        const displayName = user.displayName || '관리자';
                        const email = user.email;

                        // DOM 업데이트
                        if (adminNameElem) adminNameElem.textContent = displayName;
                        if (adminEmailElem) adminEmailElem.textContent = email;

                        // 세션 스토리지에 저장
                        sessionStorage.setItem('admin_name', displayName);
                        sessionStorage.setItem('admin_email', email);

                        // 사이드바 정보 업데이트
                        this.addUserInfoToSidebar();
                    } else {
                        console.log('로그아웃 상태');
                        // 로그아웃 상태 - 기본값 유지, 세션 스토리지는 비우지 않음
                    }
                });
            } else {
                console.warn('Firebase를 찾을 수 없음');
            }

            console.log('사용자 정보 초기화 완료 (기본값 적용)');
        },

        /**
         * 사이드바에 사용자 정보 추가 함수
         */
        addUserInfoToSidebar: function () {
            console.log('사이드바에 사용자 정보 추가');

            const sidebar = document.querySelector('.admin-sidebar');
            if (!sidebar) {
                console.warn('사이드바를 찾을 수 없음');
                return;
            }

            // 기존 사용자 정보가 있으면 제거
            const existingUserInfo = sidebar.querySelector('.sidebar-user-info');
            if (existingUserInfo) {
                existingUserInfo.remove();
            }

            // 헤더에서 사용자 정보 가져오기
            const adminName = document.getElementById('admin-name')?.textContent || sessionStorage.getItem('admin_name') || '관리자';
            const adminEmail = document.getElementById('admin-email')?.textContent || sessionStorage.getItem('admin_email') || 'gostepexercise@gmail.com';

            // 사용자 정보 영역 생성
            const userInfoDiv = document.createElement('div');
            userInfoDiv.className = 'sidebar-user-info';
            userInfoDiv.innerHTML = `
        <div class="text-white mb-2">
            <div class="font-bold">${adminName}</div>
            <div class="text-indigo-200 text-sm">${adminEmail}</div>
        </div>
        <button id="sidebar-logout-button" 
            class="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm text-white w-full">
            로그아웃
        </button>
    `;

            // 사이드바의 첫 번째 요소로 추가
            if (sidebar.firstChild) {
                sidebar.insertBefore(userInfoDiv, sidebar.firstChild);
            } else {
                sidebar.appendChild(userInfoDiv);
            }

            // 로그아웃 버튼에 이벤트 추가
            const logoutButton = document.getElementById('sidebar-logout-button');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    console.log('사이드바 로그아웃 버튼 클릭');

                    // 기존 로그아웃 함수 호출 (다양한 가능성 고려)
                    if (typeof window.logout === 'function') {
                        window.logout();
                    } else if (typeof window.headerLogout === 'function') {
                        window.headerLogout();
                    } else if (window.adminAuth && typeof window.adminAuth.logout === 'function') {
                        window.adminAuth.logout();
                    } else if (window.dhcFirebase && window.dhcFirebase.auth) {
                        // Firebase 직접 로그아웃
                        window.dhcFirebase.auth.signOut().then(() => {
                            console.log('Firebase 로그아웃 성공');
                            window.location.href = window.adjustPath ? window.adjustPath('index.html') : 'index.html';
                        }).catch(error => {
                            console.error('로그아웃 오류:', error);
                        });
                    } else {
                        console.error('로그아웃 함수를 찾을 수 없음');
                        alert('로그아웃 기능을 사용할 수 없습니다. 페이지를 새로고침하세요.');
                    }
                });

                console.log('사이드바 로그아웃 버튼에 이벤트 등록 완료');
            }

            // 메인 웹사이트 메뉴 추가 (모바일용)
            this.addMobileMenuLinks(sidebar);

            // 로딩이 완료되면 애니메이션 적용
            setTimeout(() => {
                const sidebarUserInfo = document.querySelector('.sidebar-user-info');
                const headerUserInfo = document.querySelector('.admin-user-info');

                if (sidebarUserInfo) {
                    sidebarUserInfo.classList.add('loaded');
                }

                if (headerUserInfo) {
                    headerUserInfo.classList.add('loaded');
                }
            }, 300);
        },

        // 모바일 메뉴 링크 추가 함수 (새로 추가)
        addMobileMenuLinks: function (sidebar) {
            // 이미 메인 메뉴 섹션이 있는지 확인
            const existingMainMenu = sidebar.querySelector('.sidebar-main-menu');
            if (existingMainMenu) {
                existingMainMenu.remove();
            }

            // 메인 메뉴 컨테이너 생성
            const mainMenuDiv = document.createElement('div');
            mainMenuDiv.className = 'sidebar-main-menu mt-4 mb-2';

            // 메인 웹사이트로 이동 섹션 추가
            mainMenuDiv.innerHTML = `
        <div class="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
            메인 메뉴
        </div>
        <div class="mt-2">
            <a href="${window.adjustPath ? window.adjustPath('index.html') : 'index.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    메인 홈페이지
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/about/overview.html') : 'pages/about/overview.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    기관 소개
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/certificate/health-exercise.html') : 'pages/certificate/health-exercise.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                    자격증 소개
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/education/course-info.html') : 'pages/education/course-info.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    교육 과정
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/board/notice/index.html') : 'pages/board/notice/index.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                    </svg>
                    게시판
                </span>
            </a>
            <a href="${window.adjustPath ? window.adjustPath('pages/mypage/personal-info.html') : 'pages/mypage/personal-info.html'}" 
               class="block px-4 py-2 text-indigo-200 hover:bg-indigo-700 hover:text-white transition">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    마이페이지
                </span>
            </a>
        </div>
    `;

            // 관리자 메뉴 다음에 추가 (현재 nav 요소)
            const adminNav = sidebar.querySelector('.admin-nav');
            if (adminNav) {
                // 분리선 추가
                const divider = document.createElement('div');
                divider.className = 'border-t border-indigo-700 my-4';
                adminNav.after(divider);
                divider.after(mainMenuDiv);
            } else {
                // nav가 없으면 맨 마지막에 추가
                sidebar.appendChild(mainMenuDiv);
            }

            console.log('사이드바에 메인 메뉴 링크 추가 완료');
        },

        /**
         * 사이드바 토글 기능
         */
        toggleSidebar: function () {
            console.log('사이드바 토글 시도');
            const sidebar = document.querySelector('.admin-sidebar');

            // 오버레이가 없으면 생성
            let overlay = document.querySelector('.admin-sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'admin-sidebar-overlay';
                overlay.addEventListener('click', () => this.closeSidebar());
                document.body.appendChild(overlay);
                console.log('오버레이 동적 생성됨');
            }

            if (sidebar) {
                console.log('사이드바 토글: ' + (sidebar.classList.contains('active') ? '닫기' : '열기'));
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');

                // 페이지 스크롤 제어
                if (sidebar.classList.contains('active')) {
                    document.body.classList.add('sidebar-open');
                    document.documentElement.classList.add('sidebar-open');
                } else {
                    document.body.classList.remove('sidebar-open');
                    document.documentElement.classList.remove('sidebar-open');
                }
            } else {
                console.warn('사이드바 요소를 찾을 수 없습니다.');
            }
        },

        /**
         * 사이드바 닫기
         */
        closeSidebar: function () {
            console.log('사이드바 닫기');
            const sidebar = document.querySelector('.admin-sidebar');
            const overlay = document.querySelector('.admin-sidebar-overlay');

            if (!sidebar || !overlay) return;

            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            document.documentElement.classList.remove('sidebar-open');
        },

        /**
         * 관리자 페이지 초기화
         */
        initAdminPage: function () {
            console.log('관리자 페이지 초기화');

            // 사용자 정보 초기화 (우선 실행)
            this.initUserInfo();

            // 반응형 처리를 위한 사이드바 오버레이 추가
            if (!document.querySelector('.admin-sidebar-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'admin-sidebar-overlay';

                // 오버레이 클릭 시 사이드바 닫기 이벤트 추가
                overlay.addEventListener('click', (e) => {
                    console.log('오버레이 클릭됨');
                    this.closeSidebar();
                });

                document.body.appendChild(overlay);
            }

            // 토글 버튼 이벤트 설정 - ID로 선택하여 더 명확하게 대상 지정
            const toggleButton = document.getElementById('admin-sidebar-toggle');
            if (toggleButton) {
                console.log('토글 버튼 발견, 이벤트 등록');
                toggleButton.addEventListener('click', () => {
                    console.log('토글 버튼 클릭됨');
                    this.toggleSidebar();
                });
            } else {
                console.warn('토글 버튼을 찾을 수 없습니다.');

                // 토글 버튼이 없으면 동적으로 생성
                const header = document.querySelector('header');
                if (header) {
                    const containerDiv = header.querySelector('.container');
                    if (containerDiv) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.id = 'admin-sidebar-toggle';
                        toggleBtn.className = 'admin-toggle-button';
                        toggleBtn.setAttribute('aria-label', '메뉴 토글');
                        toggleBtn.innerHTML = `
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        `;

                        // 버튼에 이벤트 리스너 추가
                        toggleBtn.addEventListener('click', () => {
                            console.log('동적 생성된 토글 버튼 클릭됨');
                            this.toggleSidebar();
                        });

                        // 컨테이너의 첫 번째 자식으로 삽입
                        if (containerDiv.firstChild) {
                            containerDiv.insertBefore(toggleBtn, containerDiv.firstChild);
                        } else {
                            containerDiv.appendChild(toggleBtn);
                        }

                        console.log('토글 버튼이 동적으로 생성되었습니다.');
                    }
                }
            }

            // 문서 전체에 클릭 이벤트 추가 (사이드바 외부 클릭 감지)
            document.addEventListener('click', (e) => {
                const sidebar = document.querySelector('.admin-sidebar');
                const toggleButton = document.getElementById('admin-sidebar-toggle');

                // 사이드바가 활성화되어 있고, 클릭이 사이드바나 토글버튼 외부에서 발생했을 때
                if (sidebar &&
                    sidebar.classList.contains('active') &&
                    !sidebar.contains(e.target) &&
                    (!toggleButton || !toggleButton.contains(e.target))) {
                    console.log('사이드바 외부 클릭 감지');
                    this.closeSidebar();
                }
            });

            // 터치 이벤트에 대한 처리 (모바일 터치 지원)
            document.addEventListener('touchstart', (e) => {
                const sidebar = document.querySelector('.admin-sidebar');
                const toggleButton = document.getElementById('admin-sidebar-toggle');

                // 사이드바가 활성화되어 있고, 터치가 사이드바나 토글버튼 외부에서 발생했을 때
                if (sidebar &&
                    sidebar.classList.contains('active') &&
                    !sidebar.contains(e.target) &&
                    (!toggleButton || !toggleButton.contains(e.target))) {
                    console.log('사이드바 외부 터치 감지');
                    this.closeSidebar();
                }
            });

            // 창 크기 변경 시 사이드바 처리
            window.addEventListener('resize', () => {
                if (window.innerWidth >= 1200) {
                    this.closeSidebar();
                }
            });

            // ESC 키로 사이드바 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    console.log('ESC 키 눌림');
                    this.closeSidebar();
                }
            });

            console.log('관리자 페이지 초기화 완료');
        }
    };

    // DOM이 로드된 후 초기화
    document.addEventListener('DOMContentLoaded', function () {
        console.log('DOMContentLoaded 이벤트 발생, 관리자 페이지 초기화 시작');

        if (window.adminUtils && window.adminUtils.initAdminPage) {
            window.adminUtils.initAdminPage();
        } else {
            console.warn('adminUtils가 로드되지 않았거나 initAdminPage 함수가 없습니다.');
        }
    });

    // 페이지 로드 완료 시 추가 초기화 (이미지 등의 로딩까지 완료된 후)
    window.addEventListener('load', function () {
        console.log('페이지 로드 완료');

        // 관리자 요소 확인 및 클래스 추가
        if (!document.querySelector('.admin-header')) {
            const header = document.querySelector('header');
            if (header) {
                header.classList.add('admin-header');
            }
        }

        // 헤더의 제목에 클래스 추가
        if (!document.querySelector('.admin-title')) {
            const headerTitle = document.querySelector('header a[href*="index.html"]');
            if (headerTitle) {
                headerTitle.classList.add('admin-title');

                // 텍스트가 "디지털헬스케어센터 관리자"인 경우 "관리자 페이지"로 변경
                if (headerTitle.textContent.trim() === '디지털헬스케어센터 관리자') {
                    headerTitle.textContent = '관리자 페이지';
                }
            }
        }

        // 사용자 정보에 클래스 추가
        if (!document.querySelector('.admin-user-info')) {
            const adminName = document.getElementById('admin-name');
            if (adminName) {
                let parent = adminName.parentElement;
                while (parent && !parent.classList.contains('flex')) {
                    parent = parent.parentElement;
                }

                if (parent) {
                    parent.classList.add('admin-user-info');

                    // 초기 로딩 시 not-loaded 클래스 추가
                    if (!sessionStorage.getItem('admin_name')) {
                        parent.classList.add('not-loaded');
                    }
                }
            }
        }
    });
})();